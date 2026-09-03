ALTER TABLE gallery_items
  ADD COLUMN IF NOT EXISTS studio_slot integer;

CREATE INDEX IF NOT EXISTS idx_gallery_items_studio_slot
  ON gallery_items (studio_slot);

INSERT INTO site_settings (key, value)
VALUES ('home_hero_image', '')
ON CONFLICT (key) DO NOTHING;
