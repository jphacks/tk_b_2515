-- Add JSON column for voice feedback metrics
ALTER TABLE "feedback"
ADD COLUMN IF NOT EXISTS "voice_metrics" JSONB;
