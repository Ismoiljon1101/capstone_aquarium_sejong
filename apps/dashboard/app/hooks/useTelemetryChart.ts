"use client";

import { useMemo, useState, useRef } from "react";
import type { Telemetry } from "@/app/lib/types";

/** Types */
export type MetricType = 'pH' | 'temp' | 'do';

export type ChartPoint = {
  x: number;
  ph: number;
  temp: number;
  do: number;
  timestamp: string;
  values: { pH: number; temp_c: number; do_mg_l: number };
};

export type ChartData = {
  points: ChartPoint[];
  paths: { ph: string; temp: string; do: string };
  current: { ph: number; temp: number; do: number };
  ranges: { ph: { min: number; max: number }; temp: { min: number; max: number }; do: { min: number; max: number } };
  sampledCount: number;
  totalCount: number;
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
};

const createSmoothPath = (points: { x: number; y: number }[]): string => {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    if (next) {
      const cp1x = prev.x + (curr.x - prev.x) * 0.5;
      const cp2x = curr.x - (next.x - curr.x) * 0.5;
      path += ` C ${cp1x},${prev.y} ${cp2x},${curr.y} ${curr.x},${curr.y}`;
    } else {
      path += ` L ${curr.x},${curr.y}`;
    }
  }
  return path;
};

const normalizeToScale = (values: number[], targetMin: number, targetMax: number): number[] => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values.map(v => targetMin + ((v - min) / range) * (targetMax - targetMin));
};

/**
 * Hook: computes chart data, hover interaction, and metric visibility state.
 * @param history - Array of telemetry readings to visualize.
 * @param animationSpeed - Animation duration setting.
 */
export function useTelemetryChart(history: Telemetry[], animationSpeed: "slow" | "normal" | "fast" = "normal") {
  const [visibleMetrics, setVisibleMetrics] = useState<Set<MetricType>>(new Set(['pH', 'temp', 'do']));
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const animationDuration = useMemo(() => {
    switch (animationSpeed) {
      case "slow": return "2s";
      case "fast": return "0.5s";
      default: return "1s";
    }
  }, [animationSpeed]);

  const chartData = useMemo((): ChartData | null => {
    if (history.length === 0) return null;
    const maxPoints = 150;
    const step = Math.max(1, Math.floor(history.length / maxPoints));
    const sampled = history.filter((_, i) => i % step === 0);
    const W = 900, H = 350;
    const padding = { top: 20, right: 20, bottom: 50, left: 60 };

    const phValues = sampled.map(h => h.pH);
    const tempValues = sampled.map(h => h.temp_c);
    const doValues = sampled.map(h => h.do_mg_l);

    const phScale = normalizeToScale(phValues, H - padding.bottom - 100, padding.top + 30);
    const tempScale = normalizeToScale(tempValues, H - padding.bottom - 50, padding.top + 80);
    const doScale = normalizeToScale(doValues, H - padding.bottom, padding.top + 130);

    const points: ChartPoint[] = sampled.map((item, i) => ({
      x: padding.left + (i / (sampled.length - 1 || 1)) * (W - padding.left - padding.right),
      ph: phScale[i], temp: tempScale[i], do: doScale[i],
      timestamp: item.timestamp,
      values: { pH: item.pH, temp_c: item.temp_c, do_mg_l: item.do_mg_l }
    }));

    return {
      points,
      paths: {
        ph: createSmoothPath(points.map(p => ({ x: p.x, y: p.ph }))),
        temp: createSmoothPath(points.map(p => ({ x: p.x, y: p.temp }))),
        do: createSmoothPath(points.map(p => ({ x: p.x, y: p.do }))),
      },
      current: { ph: phValues.at(-1) ?? 0, temp: tempValues.at(-1) ?? 0, do: doValues.at(-1) ?? 0 },
      ranges: {
        ph: { min: Math.min(...phValues), max: Math.max(...phValues) },
        temp: { min: Math.min(...tempValues), max: Math.max(...tempValues) },
        do: { min: Math.min(...doValues), max: Math.max(...doValues) },
      },
      sampledCount: sampled.length, totalCount: history.length,
      width: W, height: H, padding,
    };
  }, [history]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!chartData || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaledX = (e.clientX - rect.left) * (chartData.width / rect.width);
    let closest: ChartPoint | null = null;
    let minDist = Infinity;
    chartData.points.forEach(p => {
      const d = Math.abs(p.x - scaledX);
      if (d < minDist) { minDist = d; closest = p; }
    });
    if (closest && minDist < 30) {
      setHoveredPoint(closest);
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    } else {
      setHoveredPoint(null);
      setTooltipPosition(null);
    }
  };

  const handleMouseLeave = () => { setHoveredPoint(null); setTooltipPosition(null); };

  const toggleMetric = (metric: MetricType) => {
    const next = new Set(visibleMetrics);
    next.has(metric) ? next.delete(metric) : next.add(metric);
    setVisibleMetrics(next);
  };

  return { svgRef, visibleMetrics, hoveredPoint, tooltipPosition, animationDuration, chartData, handleMouseMove, handleMouseLeave, toggleMetric };
}
