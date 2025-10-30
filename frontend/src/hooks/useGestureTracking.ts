import { useRef, useEffect } from "react";
import type { FacialMetrics } from "@/types/facial";
import type { SaveGestureMetricsRequest } from "@/types/api";

interface GestureStats {
  totalSamples: number;
  smilingSamples: number;
  smileIntensitySum: number;
  smileIntensityMax: number;
  gazeScoreSum: number;
  lookingSamples: number;
  gazeUpSamples: number;
  gazeDownSamples: number;
}

export function useGestureTracking(facialMetrics: FacialMetrics | null) {
  const gestureStatsRef = useRef<GestureStats>({
    totalSamples: 0,
    smilingSamples: 0,
    smileIntensitySum: 0,
    smileIntensityMax: 0,
    gazeScoreSum: 0,
    lookingSamples: 0,
    gazeUpSamples: 0,
    gazeDownSamples: 0,
  });

  // Track facial metrics
  useEffect(() => {
    if (!facialMetrics) return;

    const stats = gestureStatsRef.current;
    stats.totalSamples += 1;
    stats.smileIntensitySum += facialMetrics.smileIntensity;
    stats.gazeScoreSum += facialMetrics.gazeScore;

    if (facialMetrics.smileIntensity > stats.smileIntensityMax) {
      stats.smileIntensityMax = facialMetrics.smileIntensity;
    }

    if (facialMetrics.isSmiling) {
      stats.smilingSamples += 1;
    }

    if (facialMetrics.isLookingAtTarget) {
      stats.lookingSamples += 1;
    }

    if (facialMetrics.gazeVertical === "up") {
      stats.gazeUpSamples += 1;
    } else if (facialMetrics.gazeVertical === "down") {
      stats.gazeDownSamples += 1;
    }
  }, [facialMetrics]);

  const reset = () => {
    gestureStatsRef.current = {
      totalSamples: 0,
      smilingSamples: 0,
      smileIntensitySum: 0,
      smileIntensityMax: 0,
      gazeScoreSum: 0,
      lookingSamples: 0,
      gazeUpSamples: 0,
      gazeDownSamples: 0,
    };
  };

  const getMetrics = (): SaveGestureMetricsRequest | null => {
    const stats = gestureStatsRef.current;
    if (stats.totalSamples === 0) return null;

    return {
      totalSamples: stats.totalSamples,
      smilingSamples: stats.smilingSamples,
      smileIntensityAvg: stats.smileIntensitySum / stats.totalSamples,
      smileIntensityMax: stats.smileIntensityMax,
      gazeScoreAvg: stats.gazeScoreSum / stats.totalSamples,
      lookingSamples: stats.lookingSamples,
      gazeUpSamples: stats.gazeUpSamples,
      gazeDownSamples: stats.gazeDownSamples,
    };
  };

  return {
    reset,
    getMetrics,
  };
}
