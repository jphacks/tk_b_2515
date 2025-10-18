ALTER TABLE "gesture_metrics"
  ADD COLUMN "gaze_up_samples" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "gaze_down_samples" INTEGER NOT NULL DEFAULT 0;
