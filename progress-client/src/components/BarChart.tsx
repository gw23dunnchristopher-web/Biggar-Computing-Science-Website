interface Bar {
  label: string;
  value: number | null;
  active?: boolean;
}

interface BarChartProps {
  bars: Bar[];
  height?: number;
  barWidth?: number;
  gap?: number;
}

function scoreColour(pct: number | null) {
  if (pct === null) return "#30363d";
  if (pct >= 70) return "#238636";
  if (pct >= 40) return "#b08800";
  return "#da3633";
}

function scoreTextColour(pct: number | null) {
  if (pct === null) return "#8b949e";
  if (pct >= 70) return "#4ade80";
  if (pct >= 40) return "#fbbf24";
  return "#f87171";
}

export default function BarChart({ bars, height = 200, barWidth = 36, gap = 14 }: BarChartProps) {
  const totalWidth = bars.length * (barWidth + gap) + gap;
  const chartH = height - 32;

  return (
    <div className="chart-wrap">
      <svg width={totalWidth} height={height} style={{ display: "block", minWidth: "100%" }}>
        {/* guide lines */}
        {[0, 25, 50, 75, 100].map(pct => {
          const y = 4 + (chartH - 4) * (1 - pct / 100);
          return (
            <g key={pct}>
              <line x1={0} x2={totalWidth} y1={y} y2={y}
                stroke="#21262d" strokeWidth={1} />
              <text x={2} y={y - 3} fill="#8b949e" fontSize={9}>{pct}%</text>
            </g>
          );
        })}

        {bars.map((bar, i) => {
          const x = gap + i * (barWidth + gap);
          const pct = bar.value ?? 0;
          const barH = Math.max(2, (chartH - 4) * (pct / 100));
          const barY = 4 + (chartH - 4) - barH;
          const colour = scoreColour(bar.value);
          const textColour = scoreTextColour(bar.value);

          return (
            <g key={i}>
              {/* bar shadow */}
              <rect x={x + 2} y={barY + 2} width={barWidth} height={barH}
                rx={4} fill="rgba(0,0,0,0.3)" />
              {/* bar */}
              <rect x={x} y={barY} width={barWidth} height={barH}
                rx={4} fill={colour} opacity={bar.value === null ? 0.3 : 1} />
              {/* active glow ring */}
              {bar.active && (
                <rect x={x - 2} y={barY - 2} width={barWidth + 4} height={barH + 4}
                  rx={6} fill="none" stroke="#4ade80" strokeWidth={1.5} />
              )}
              {/* score label above bar */}
              <text x={x + barWidth / 2} y={barY - 4} textAnchor="middle"
                fill={textColour} fontSize={10} fontWeight="bold">
                {bar.value !== null ? `${bar.value}%` : "—"}
              </text>
              {/* username label below */}
              <text x={x + barWidth / 2} y={chartH + 18} textAnchor="middle"
                fill={bar.active ? "#4ade80" : "#8b949e"} fontSize={9}>
                {bar.label.length > 10 ? bar.label.slice(0, 9) + "…" : bar.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
