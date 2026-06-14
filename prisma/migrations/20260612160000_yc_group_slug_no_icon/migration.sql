-- Drop icon column; add slug for public/group-icon/{slug}.jpg
ALTER TABLE "YcGroup" DROP COLUMN IF EXISTS "icon";
ALTER TABLE "YcGroup" ADD COLUMN IF NOT EXISTS "slug" TEXT;

UPDATE "YcGroup" AS g
SET "slug" = numbered.slug
FROM (
  SELECT id, 'team-' || ROW_NUMBER() OVER (ORDER BY "createdAt", "name") AS slug
  FROM "YcGroup"
) AS numbered
WHERE g.id = numbered.id
  AND (g."slug" IS NULL OR g."slug" = '');

ALTER TABLE "YcGroup" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "YcGroup_slug_key" ON "YcGroup"("slug");
