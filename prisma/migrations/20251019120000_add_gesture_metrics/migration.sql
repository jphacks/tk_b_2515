-- CreateTable
CREATE TABLE "gesture_metrics" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "total_samples" INTEGER NOT NULL DEFAULT 0,
    "smiling_samples" INTEGER NOT NULL DEFAULT 0,
    "smile_intensity_avg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "smile_intensity_max" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "gaze_score_avg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "looking_samples" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gesture_metrics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "gesture_metrics_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "gesture_metrics_conversation_id_key" ON "gesture_metrics"("conversation_id");
