(() => {
  const $ = (id) => document.getElementById(id);
  const panel = document.getElementById('panel-blog');
  if (!panel) return;

  const injectStyles = () => {
    if (document.getElementById('bruniano-blog-feedback-style')) return;
    const style = document.createElement('style');
    style.id = 'bruniano-blog-feedback-style';
    style.textContent = `
      #panel-blog .blog-layout > div{min-width:0}
      #panel-blog[data-blog-mode="editor"] .blog-layout{grid-template-columns:minmax(0,1fr) minmax(290px,350px);align-items:start;gap:24px}
      #panel-blog[data-blog-mode="editor"] .blog-layout>div:first-child>.form-card{min-width:0}
      #panel-blog[data-blog-mode="editor"] .blog-layout>div:first-child>.form-card form{display:grid;grid-template-columns:minmax(0,1fr);gap:0}
      #panel-blog[data-blog-mode="editor"] .blog-layout>div:first-child>.form-card form>.form-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:18px;grid-column:1/-1}
      #panel-blog[data-blog-mode="editor"] .blog-layout>div:first-child>.form-card form>label{grid-column:1/-1;min-width:0}
      #panel-blog[data-blog-mode="editor"] .blog-layout>div:first-child>.form-card input,
      #panel-blog[data-blog-mode="editor"] .blog-layout>div:first-child>.form-card textarea{box-sizing:border-box;max-width:100%}
      #panel-blog[data-blog-mode="editor"] .blog-field-counts{margin:5px 0 12px;line-height:1.3;min-height:14px;align-items:flex-start}
      #panel-blog[data-blog-mode="editor"] .blog-field-counts span{display:block}
      #panel-blog[data-blog-mode="editor"] .blog-editor-toolbar{position:relative;z-index:2}
      #panel-blog[data-blog-mode="editor"] .editor-content{min-height:500px;box-sizing:border-box}
      #panel-blog[data-blog-mode="editor"] .blog-publish-card,
      #panel-blog[data-blog-mode="editor"] .blog-live-preview,
      #panel-blog[data-blog-mode="editor"] .blog-feedback-card{box-sizing:border-box;width:100%}

      #panel-blog .blog-insights{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 16px}
      #panel-blog .blog-insight-card{min-width:0;padding:14px 16px;background:#fff;border:1px solid #e3e8ef;border-radius:14px;box-shadow:0 8px 24px rgba(15,23,42,.04)}
      #panel-blog .blog-insight-card span{display:block;font-size:9px;letter-spacing:.11em;text-transform:uppercase;font-weight:900;color:#8792a3}
      #panel-blog .blog-insight-card strong{display:block;margin-top:5px;font-size:22px;line-height:1.05;color:#0a1528}
      #panel-blog .blog-insight-card small{display:block;margin-top:5px;font-size:10px;color:#98a2b3;line-height:1.35}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-item{display:flex;align-items:center;gap:16px;min-width:0}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-item .blog-item-thumb{width:72px;height:56px;flex:0 0 72px;border-radius:10px;overflow:hidden;background:linear-gradient(135deg,#eef2f7,#f8fafc);display:flex;align-items:center;justify-content:center;color:#98a2b3;font-size:10px}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-item .blog-item-thumb img{width:100%;height:100%;object-fit:cover;display:block}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-item .blog-item-content{min-width:0;flex:1 1 auto}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-item .blog-item-feedback{display:flex;align-items:center;gap:7px;flex:0 0 auto;flex-wrap:wrap;justify-content:flex-end;max-width:330px}
      #panel-blog .feedback-pill{display:inline-flex;align-items:center;gap:5px;padding:7px 9px;border:1px solid #e3e8ef;border-radius:999px;background:#f8fafc;color:#344054;font-size:10px;font-weight:800;white-space:nowrap}
      #panel-blog .feedback-pill strong{font-size:11px;color:#0a1528}
      #panel-blog .feedback-pill.feedback-empty{color:#98a2b3;background:#fff}
      #panel-blog .feedback-pill.feedback-positive{border-color:#d5eadf;background:#f3faf6;color:#2d6a45}
      #panel-blog .feedback-pill.feedback-positive strong{color:#2d6a45}
      #panel-blog[data-blog-mode="archive"] #blog-list .managed-actions{flex:0 0 auto}
      #panel-blog .blog-feedback-card{padding:18px 20px;background:#fff;border:1px solid #e3e8ef;border-radius:16px;box-shadow:0 10px 28px rgba(15,23,42,.05)}
      #panel-blog .blog-feedback-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}
      #panel-blog .blog-feedback-card .blog-side-kicker{font-size:10px;letter-spacing:.12em;font-weight:900;color:#7b8799}
      #panel-blog .blog-feedback-card h3{margin:5px 0 0;font-size:18px;color:#0a1528}
      #panel-blog .blog-feedback-card p{margin:0;color:#667085;font-size:12px;line-height:1.55}
      #panel-blog .blog-feedback-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      #panel-blog .blog-feedback-stat{padding:12px;border:1px solid #edf0f4;border-radius:12px;background:#f8fafc;min-width:0}
      #panel-blog .blog-feedback-stat span{display:block;font-size:9px;letter-spacing:.08em;text-transform:uppercase;font-weight:900;color:#8792a3}
      #panel-blog .blog-feedback-stat strong{display:block;margin-top:5px;font-size:18px;color:#0a1528}
      #panel-blog .blog-feedback-stat small{display:block;margin-top:4px;color:#98a2b3;font-size:10px;line-height:1.35}
      #panel-blog .blog-feedback-card .blog-feedback-muted{margin-top:12px;color:#98a2b3;font-size:11px}
      @media(max-width:1180px){
        #panel-blog[data-blog-mode="editor"] .blog-layout{grid-template-columns:1fr}
        #panel-blog[data-blog-mode="editor"] .blog-layout>div:nth-child(2){position:static}
      }
      @media(max-width:900px){
        #panel-blog .blog-insights{grid-template-columns:repeat(2,minmax(0,1fr))}
        #panel-blog[data-blog-mode="archive"] #blog-list .managed-item{align-items:flex-start;flex-wrap:wrap}
        #panel-blog[data-blog-mode="archive"] #blog-list .managed-item .blog-item-feedback{order:4;width:100%;max-width:none;justify-content:flex-start}
        #panel-blog[data-blog-mode="archive"] #blog-list .managed-item .managed-actions{margin-left:auto}
      }
      @media(max-width:700px){
        #panel-blog .blog-insights{grid-template-columns:1fr 1fr}
        #panel-blog[data-blog-mode="editor"] .blog-layout>div:first-child>.form-card form>.form-row{grid-template-columns:1fr}
        #panel-blog .blog-insight-card{padding:12px}
        #panel-blog .blog-insight-card strong{font-size:19px}
        #panel-blog[data-blog-mode="archive"] #blog-list .managed-item{padding:15px}
        #panel-blog[data-blog-mode="archive"] #blog-list .managed-item .blog-item-thumb{width:60px;height:48px;flex-basis:60px}
        #panel-blog .blog-feedback-grid{grid-template-columns:1fr}
      }
    `;
    document.head.appendChild(style);
  };

  const pct = (yes, no) => {
    const total = Number(yes || 0) + Number(no || 0);
    return total ? Math.round((Number(yes || 0) / total) * 100) : null;
  };

  let posts = [];
  let feedback = [];

  const loadData = async () => {
    try {
      const [postsResponse, feedbackResponse] = await Promise.all([
        fetch('/api/blog?admin=1', { credentials:'same-origin', cache:'no-store' }),
        fetch('/api/article-feedback?admin=1', { credentials:'same-origin', cache:'no-store' })
      ]);
      if (postsResponse.ok) {
        const data = await postsResponse.json();
        posts = data.items || [];
      }
      if (feedbackResponse.ok) {
        const data = await feedbackResponse.json();
        feedback = data.items || [];
      }
    } catch {}
    renderStats();
    decorateArchive();
    renderEditorFeedback();
  };

  const feedbackMap = () => new Map(feedback.map(item => [String(item.article_slug), item]));

  const renderStats = () => {
    let bar = document.getElementById('blog-insights');
    if (!bar) {
      const anchor = document.querySelector('#panel-blog .blog-archive-tools');
      if (!anchor) return;
      bar = document.createElement('div');
      bar.id = 'blog-insights';
      bar.className = 'blog-insights';
      anchor.parentNode.insertBefore(bar, anchor);
    }
    const published = posts.filter(p => p.is_published).length;
    const drafts = posts.filter(p => !p.is_published).length;
    const totalResponses = feedback.reduce((sum, item) => sum + Number(item.total_votes || 0), 0);
    const usefulTotals = feedback.reduce((acc, item) => ({yes:acc.yes+Number(item.useful_yes||0),no:acc.no+Number(item.useful_no||0)}), {yes:0,no:0});
    const moreTotals = feedback.reduce((acc, item) => ({yes:acc.yes+Number(item.more_yes||0),no:acc.no+Number(item.more_no||0)}), {yes:0,no:0});
    const usefulPct = pct(usefulTotals.yes, usefulTotals.no);
    const morePct = pct(moreTotals.yes, moreTotals.no);
    bar.innerHTML = `
      <div class="blog-insight-card"><span>Pubblicati</span><strong>${published}</strong><small>articoli online</small></div>
      <div class="blog-insight-card"><span>Bozze</span><strong>${drafts}</strong><small>da completare</small></div>
      <div class="blog-insight-card"><span>Risposte</span><strong>${totalResponses}</strong><small>feedback raccolti</small></div>
      <div class="blog-insight-card"><span>Utilità</span><strong>${usefulPct == null ? '—' : usefulPct + '%'}</strong><small>${usefulPct == null ? 'ancora nessun dato' : 'risposte “Sì, utile”'}</small></div>`;
  };

  const decorateArchive = () => {
    const list = $('blog-list');
    if (!list) return;
    const byId = new Map(posts.map(p => [String(p.id), p]));
    const bySlug = feedbackMap();
    list.querySelectorAll('.managed-item').forEach(item => {
      const edit = item.querySelector('[data-edit-post]');
      const post = edit ? byId.get(String(edit.dataset.editPost)) : null;
      if (!post || item.dataset.feedbackDecorated === '1') return;
      item.dataset.feedbackDecorated = '1';
      const content = item.querySelector(':scope > div:first-child');
      const actions = item.querySelector(':scope > .managed-actions');
      if (content) {
        const thumb = document.createElement('div');
        thumb.className = 'blog-item-thumb';
        if (post.cover_image_url) {
          const img = document.createElement('img'); img.src = post.cover_image_url; img.alt=''; img.loading='lazy'; thumb.appendChild(img);
        } else thumb.textContent = 'BLOG';
        const contentWrap = document.createElement('div');
        contentWrap.className = 'blog-item-content';
        while (content.firstChild) contentWrap.appendChild(content.firstChild);
        item.insertBefore(thumb, content);
        item.insertBefore(contentWrap, actions || null);
      }
      const metrics = document.createElement('div');
      metrics.className = 'blog-item-feedback';
      const stat = bySlug.get(String(post.slug));
      if (stat) {
        const useful = pct(stat.useful_yes, stat.useful_no);
        const more = pct(stat.more_yes, stat.more_no);
        metrics.innerHTML = `
          <span class="feedback-pill ${useful == null ? 'feedback-empty' : useful >= 70 ? 'feedback-positive' : ''}">Utilità <strong>${useful == null ? '—' : useful + '%'}</strong></span>
          <span class="feedback-pill ${more == null ? 'feedback-empty' : more >= 70 ? 'feedback-positive' : ''}">Interesse <strong>${more == null ? '—' : more + '%'}</strong></span>
          <span class="feedback-pill">${Number(stat.total_votes || 0)} risposte</span>`;
      } else {
        metrics.innerHTML = '<span class="feedback-pill feedback-empty">Nessun feedback ancora</span>';
      }
      item.insertBefore(metrics, actions || null);
    });
  };

  const renderEditorFeedback = () => {
    const side = document.querySelector('#panel-blog[data-blog-mode="editor"] .blog-layout>div:nth-child(2)');
    if (!side) return;
    let card = document.getElementById('blog-feedback-card');
    if (!card) {
      card = document.createElement('section');
      card.id = 'blog-feedback-card';
      card.className = 'blog-feedback-card';
      side.insertBefore(card, side.firstElementChild || null);
    }
    const id = String($('blog-id')?.value || '');
    const post = posts.find(p => String(p.id) === id);
    if (!post) {
      card.innerHTML = '<div class="blog-feedback-card-head"><div><div class="blog-side-kicker">DATI ARTICOLO</div><h3>Feedback lettori</h3></div></div><p class="blog-feedback-muted">Le risposte compariranno qui dopo la pubblicazione.</p>';
      return;
    }
    const stat = feedbackMap().get(String(post.slug));
    if (!stat) {
      card.innerHTML = '<div class="blog-feedback-card-head"><div><div class="blog-side-kicker">DATI ARTICOLO</div><h3>Feedback lettori</h3></div></div><p>Nessuna risposta ancora per questo articolo.</p>';
      return;
    }
    const useful = pct(stat.useful_yes, stat.useful_no);
    const more = pct(stat.more_yes, stat.more_no);
    card.innerHTML = `<div class="blog-feedback-card-head"><div><div class="blog-side-kicker">DATI ARTICOLO</div><h3>Feedback lettori</h3></div><span class="feedback-pill">${Number(stat.total_votes || 0)} risposte</span></div><div class="blog-feedback-grid"><div class="blog-feedback-stat"><span>Articolo utile</span><strong>${useful == null ? '—' : useful + '%'}</strong><small>${Number(stat.useful_yes||0)} sì · ${Number(stat.useful_no||0)} no</small></div><div class="blog-feedback-stat"><span>Altri articoli</span><strong>${more == null ? '—' : more + '%'}</strong><small>${Number(stat.more_yes||0)} sì · ${Number(stat.more_no||0)} no</small></div></div><p class="blog-feedback-muted">Usa questi dati per capire quali temi approfondire nel blog.</p>`;
  };

  const watch = () => {
    injectStyles();
    loadData();
    const list = $('blog-list');
    if (list && !list.dataset.feedbackWatch) {
      list.dataset.feedbackWatch = '1';
      new MutationObserver(() => { decorateArchive(); }).observe(list, {childList:true, subtree:true});
    }
    document.addEventListener('click', (event) => {
      if (event.target.closest('[data-panel="blog"],[data-view-link="blog"],[data-edit-post]')) {
        setTimeout(() => { injectStyles(); loadData(); renderEditorFeedback(); }, 150);
      }
      if (event.target.closest('#blog-back,#new-post,#blog-save-draft,#blog-publish-now')) {
        setTimeout(() => { loadData(); renderEditorFeedback(); }, 200);
      }
    });
    setInterval(() => { if (panel.dataset.blogMode) { decorateArchive(); renderEditorFeedback(); } }, 5000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch, {once:true}); else watch();
})();
