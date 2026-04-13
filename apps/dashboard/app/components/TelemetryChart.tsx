"use client";

import type { Telemetry } from "@/app/lib/types";
import { TestTube, Thermometer, Wind, Eye, EyeOff } from "lucide-react";
import { useTelemetryChart, type MetricType } from "@/app/hooks/useTelemetryChart";

type TelemetryChartProps = {
  history: Telemetry[];
  animated?: boolean;
  chartType?: "line" | "area" | "bar";
  showGridLines?: boolean;
  showDataPoints?: boolean;
  animationSpeed?: "slow" | "normal" | "fast";
};

const METRICS = [
  { key: 'pH' as MetricType, label: 'pH Level', icon: TestTube, color: '#10b981', unit: '', optimal: '6.5-8.0' },
  { key: 'temp' as MetricType, label: 'Temperature', icon: Thermometer, color: '#f59e0b', unit: '°C', optimal: '20-30°C' },
  { key: 'do' as MetricType, label: 'Dissolved O₂', icon: Wind, color: '#3b82f6', unit: 'mg/L', optimal: '>5.0 mg/L' },
];

/**
 * TelemetryChart — SVG multi-line chart for pH, Temp and DO2.
 * All data logic is in useTelemetryChart hook.
 */
export function TelemetryChart({
  history, animated = true, chartType, showGridLines = true, showDataPoints = true, animationSpeed = "normal"
}: TelemetryChartProps) {
  void chartType;
  const { svgRef, visibleMetrics, hoveredPoint, tooltipPosition, animationDuration, chartData, handleMouseMove, handleMouseLeave, toggleMetric } = useTelemetryChart(history, animationSpeed);

  if (!chartData || history.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
            <TestTube className="w-8 h-8 text-gray-400" />
          </div>
          <div className="text-sm" style={{ color: "rgb(var(--text-secondary))" }}>No data available for chart</div>
          <div className="text-xs mt-2" style={{ color: "rgb(var(--text-muted))" }}>Data will appear as measurements are collected</div>
        </div>
      </div>
    );
  }

  const lineColors = { pH: 'phGradient', temp: 'tempGradient', do: 'doGradient' };
  const hexColors = { pH: '#10b981', temp: '#f59e0b', do: '#3b82f6' };
  const pathMap = { pH: chartData.paths.ph, temp: chartData.paths.temp, do: chartData.paths.do };
  const yMap = { pH: 'ph', temp: 'temp', do: 'do' } as const;

  return (
    <div className="w-full h-full flex flex-col relative">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
        <div className="flex flex-wrap gap-2">
          {METRICS.map((m) => {
            const Icon = m.icon;
            const isVisible = visibleMetrics.has(m.key);
            const rk = m.key === 'pH' ? 'ph' : m.key;
            const cur = chartData.current[rk as keyof typeof chartData.current];
            return (
              <button key={m.key} onClick={() => toggleMetric(m.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${isVisible ? 'bg-white/20 border border-white/30 shadow-lg' : 'bg-white/5 border border-white/10 opacity-60 hover:opacity-100'}`}
                style={{ borderLeftColor: isVisible ? m.color : 'transparent', borderLeftWidth: '3px' }}>
                <Icon className="w-3 h-3" />
                <span>{m.label}</span>
                <span className="font-bold" style={{ color: m.color }}>{cur ? cur.toFixed(m.key === 'temp' ? 1 : 2) : '--'}{m.unit}</span>
                {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </button>
            );
          })}
        </div>
        <div className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>{chartData.sampledCount} of {chartData.totalCount} points</div>
      </div>

      {/* Chart */}
      <div className="flex-1 relative bg-gradient-to-br from-slate-50/5 to-slate-100/5 rounded-xl border border-white/10 overflow-hidden">
        <svg ref={svgRef} viewBox={`0 0 ${chartData.width} ${chartData.height}`} className="w-full h-full cursor-crosshair" preserveAspectRatio="xMidYMid meet" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
          <defs>
            <linearGradient id="phGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#10b981" stopOpacity="0.9"/><stop offset="100%" stopColor="#059669" stopOpacity="1"/></linearGradient>
            <linearGradient id="tempGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9"/><stop offset="100%" stopColor="#d97706" stopOpacity="1"/></linearGradient>
            <linearGradient id="doGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9"/><stop offset="100%" stopColor="#2563eb" stopOpacity="1"/></linearGradient>
            <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1"/></pattern>
          </defs>
          {showGridLines && <rect width="100%" height="100%" fill="url(#grid)" opacity="0.4"/>}
          {METRICS.map(m => visibleMetrics.has(m.key) && (
            <path key={m.key} d={pathMap[m.key]} fill="none" stroke={`url(#${lineColors[m.key]})`} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: `drop-shadow(0 2px 8px ${hexColors[m.key]}66)`, animation: animated ? `draw ${animationDuration} ease-out` : 'none' }} />
          ))}
          {showDataPoints && chartData.points.map((p, i) => (
            <g key={i}>
              {METRICS.map(m => visibleMetrics.has(m.key) && <circle key={m.key} cx={p.x} cy={p[yMap[m.key]]} r="2" fill={hexColors[m.key]} opacity="0.8" />)}
            </g>
          ))}
          {hoveredPoint && <line x1={hoveredPoint.x} y1={chartData.padding.top} x2={hoveredPoint.x} y2={chartData.height - chartData.padding.bottom} stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="4,4" />}
          {hoveredPoint && METRICS.map(m => visibleMetrics.has(m.key) && <circle key={m.key} cx={hoveredPoint.x} cy={hoveredPoint[yMap[m.key]]} r="5" fill={hexColors[m.key]} stroke="white" strokeWidth="2" className="animate-pulse" />)}
          <g fill="rgba(255,255,255,0.7)" fontFamily="system-ui">
            {visibleMetrics.has('pH') && <text x="15" y="35" fontSize="11" fontWeight="500">pH: {chartData.ranges.ph.min.toFixed(1)}-{chartData.ranges.ph.max.toFixed(1)}</text>}
            {visibleMetrics.has('temp') && <text x="15" y="85" fontSize="11" fontWeight="500">Temp: {chartData.ranges.temp.min.toFixed(1)}-{chartData.ranges.temp.max.toFixed(1)}°C</text>}
            {visibleMetrics.has('do') && <text x="15" y="135" fontSize="11" fontWeight="500">DO: {chartData.ranges.do.min.toFixed(1)}-{chartData.ranges.do.max.toFixed(1)} mg/L</text>}
          </g>
        </svg>
        {hoveredPoint && tooltipPosition && (
          <div className="fixed z-50 pointer-events-none" style={{ left: `${tooltipPosition.x + 10}px`, top: `${tooltipPosition.y - 10}px`, transform: 'translateY(-100%)' }}>
            <div className="glass p-3 rounded-lg shadow-xl border border-white/20 min-w-[200px]">
              <div className="text-xs font-semibold mb-2" style={{ color: "rgb(var(--text-primary))" }}>{new Date(hoveredPoint.timestamp).toLocaleString()}</div>
              <div className="space-y-1">
                {METRICS.map(m => visibleMetrics.has(m.key) && (
                  <div key={m.key} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1" style={{ color: m.color }}><m.icon className="w-3 h-3" />{m.label}:</span>
                    <span className="font-bold" style={{ color: "rgb(var(--text-primary))" }}>
                      {m.key === 'pH' ? hoveredPoint.values.pH.toFixed(2) : m.key === 'temp' ? `${hoveredPoint.values.temp_c.toFixed(1)}°C` : `${hoveredPoint.values.do_mg_l.toFixed(2)} mg/L`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
