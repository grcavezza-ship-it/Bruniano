const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function isWriteMethod(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
}

function hasAccessContext(request) {
  // Production must be protected by Cloudflare Access on /admin and /api/write routes.
  // The header is supplied by Access after authentication. Keep this as defense-in-depth;
  // do not expose write routes without an Access application in Cloudflare.
  return Boolean(request.headers.get("Cf-Access-Jwt-Assertion"));
}

const TABLES = {
  team: { table: "team_members", order: "sort_order" },
  gallery: { table: "gallery_items", order: "sort_order" },
  promotions: { table: "promotions", order: "created_at" },
  blog: { table: "blog_posts", order: "published_at" },
};

function tableFor(type) {
  return TABLES[type] || null;
}

async function publicList(env, type) {
  const cfg = tableFor(type);
  if (!cfg) return json({ error: "Unknown resource" }, 404);

  let sql;
  if (type === "promotions") {
    sql = `SELECT * FROM promotions WHERE is_published = 1 AND (starts_at IS NULL OR starts_at <= date('now')) AND (ends_at IS NULL OR ends_at >= date('now')) ORDER BY created_at DESC`;
  } else if (type === "blog") {
    sql = `SELECT * FROM blog_posts WHERE is_published = 1 ORDER BY COALESCE(published_at, created_at) DESC`;
  } else {
    sql = `SELECT * FROM ${cfg.table} WHERE is_published = 1 ORDER BY ${cfg.order} ASC`;
  }

  const result = await env.DB.prepare(sql).all();
  return json({ items: result.results || [] });
}

async function writeResource(request, env, type) {
  if (!hasAccessContext(request)) return json({ error: "Unauthorized" }, 401);
  const cfg = tableFor(type);
  if (!cfg) return json({ error: "Unknown resource" }, 404);

  const body = await request.json();
  if (request.method === "POST") {
    const id = body.id || crypto.randomUUID();
    if (type === "team") {
      await env.DB.prepare(`INSERT INTO team_members (id,name,role,specialty,bio,photo_url,sort_order,is_published) VALUES (?,?,?,?,?,?,?,?)`)
        .bind(id, body.name || "", body.role || "", body.specialty || null, body.bio || null, body.photo_url || null, Number(body.sort_order || 0), body.is_published === false ? 0 : 1).run();
    } else if (type === "promotions") {
      await env.DB.prepare(`INSERT INTO promotions (id,title,description,image_key,starts_at,ends_at,is_published) VALUES (?,?,?,?,?,?,?)`)
        .bind(id, body.title || "", body.description || null, body.image_key || null, body.starts_at || null, body.ends_at || null, body.is_published ? 1 : 0).run();
    } else if (type === "blog") {
      await env.DB.prepare(`INSERT INTO blog_posts (id,title,slug,excerpt,content,cover_key,category,meta_description,is_published,published_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
        .bind(id, body.title || "", body.slug || crypto.randomUUID(), body.excerpt || null, body.content || "", body.cover_key || null, body.category || null, body.meta_description || null, body.is_published ? 1 : 0, body.published_at || null).run();
    } else if (type === "gallery") {
      await env.DB.prepare(`INSERT INTO gallery_items (id,title,media_type,media_key,alt_text,sort_order,is_published) VALUES (?,?,?,?,?,?,?)`)
        .bind(id, body.title || "", body.media_type || "image", body.media_key || "", body.alt_text || null, Number(body.sort_order || 0), body.is_published === false ? 0 : 1).run();
    }
    return json({ ok: true, id }, 201);
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ error: "Missing id" }, 400);

  if (request.method === "DELETE") {
    await env.DB.prepare(`DELETE FROM ${cfg.table} WHERE id = ?`).bind(id).run();
    return json({ ok: true });
  }

  const patch = body;
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(patch)) {
    if (["id", "created_at", "updated_at"].includes(key)) continue;
    const allowed = {
      team: ["name","role","specialty","bio","photo_url","sort_order","is_published"],
      gallery: ["title","media_type","media_key","alt_text","sort_order","is_published"],
      promotions: ["title","description","image_key","starts_at","ends_at","is_published"],
      blog: ["title","slug","excerpt","content","cover_key","category","meta_description","is_published","published_at"],
    }[type];
    if (!allowed?.includes(key)) continue;
    fields.push(`${key} = ?`);
    values.push(key === "is_published" ? (value ? 1 : 0) : value);
  }

  if (!fields.length) return json({ error: "No valid fields" }, 400);
  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);
  await env.DB.prepare(`UPDATE ${cfg.table} SET ${fields.join(", ")} WHERE id = ?`).bind(...values).run();
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const resource = parts[1];

      try {
        if (request.method === "GET" && TABLES[resource]) {
          return await publicList(env, resource);
        }
        if (isWriteMethod(request.method) && TABLES[resource]) {
          return await writeResource(request, env, resource);
        }
        if (url.pathname === "/api/health") return json({ ok: true, service: "bruniano" });
        return json({ error: "Not found" }, 404);
      } catch (error) {
        console.error(error);
        return json({ error: "Internal server error" }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
