-- Rename sticker column to icon (stores base64 data URL)
ALTER TABLE "YcGroup" RENAME COLUMN "sticker" TO "icon";
