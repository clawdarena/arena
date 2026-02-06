-- Add avatar and tagline to Bot
ALTER TABLE "bots" ADD COLUMN "avatar" TEXT NOT NULL DEFAULT '⚔️';
ALTER TABLE "bots" ADD COLUMN "tagline" TEXT NOT NULL DEFAULT '';
