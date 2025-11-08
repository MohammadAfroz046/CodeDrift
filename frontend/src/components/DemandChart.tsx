import { useMemo } from "react";

interface DemandChartProps {
  demandHistory: Array<{
    date: string;
    demand: number;
  }>;
  forecasts: Array<{
    forecast_date: string;
    predicted_demand: number;
    confidence_lower: number;
    confidence_upper: number;
  }>;
}

export default function DemandChart({ demandHistory, forecasts }: DemandChartProps) {
  const chartData = useMemo(() => {
    // Sort historical data by date
    const sortedHistory = [...demandHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Sort forecasts by date
    const sortedForecasts = [...forecasts].sort((a, b) => 
      new Date(a.forecast_date).getTime() - new Date(b.forecast_date).getTime()
    );

    // Combine and sort all data points
    const historicalData = sortedHistory.map(d => ({
      date: d.date,
      actual: d.demand,
      predicted: null,
      lower: null,
      upper: null,
    }));

    const forecastData = sortedForecasts.map(f => ({
      date: f.forecast_date,
      actual: null,
      predicted: f.predicted_demand,
      lower: f.confidence_lower,
      upper: f.confidence_upper,
    }));

    return [...historicalData, ...forecastData];
  }, [demandHistory, forecasts]);

  const maxValue = useMemo(() => {
    const values = chartData.flatMap(d => [
      d.actual || 0,
      d.predicted || 0,
      d.upper || 0
    ]);
    return Math.max(...values) * 1.1;
  }, [chartData]);

  const chartWidth = Math.max(800, chartData.length * 10); // Dynamic width based on data
  const chartHeight = 400;
  const padding = 60;

  return (
    <div className="w-full overflow-x-auto">
      <svg width={chartWidth} height={chartHeight} className="border rounded">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
          <g key={ratio}>
            <line
              x1={padding}
              y1={padding + (chartHeight - 2 * padding) * ratio}
              x2={chartWidth - padding}
              y2={padding + (chartHeight - 2 * padding) * ratio}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text
              x={padding - 10}
              y={padding + (chartHeight - 2 * padding) * ratio + 5}
              textAnchor="end"
              fontSize="12"
              fill="#6b7280"
            >
              {Math.round(maxValue * (1 - ratio))}
            </text>
          </g>
        ))}

        {/* Confidence interval area */}
        {forecasts.length > 0 && chartData.length > 0 && (
          <path
            d={`
              M ${padding + (chartWidth - 2 * padding) * (demandHistory.length / Math.max(chartData.length, 1))} ${chartHeight - padding - (forecasts[0].confidence_lower / maxValue) * (chartHeight - 2 * padding)}
              ${forecasts.map((f, i) => {
                const x = padding + (chartWidth - 2 * padding) * ((demandHistory.length + i) / Math.max(chartData.length, 1));
                const yUpper = chartHeight - padding - (f.confidence_upper / maxValue) * (chartHeight - 2 * padding);
                return `L ${x} ${yUpper}`;
              }).join(' ')}
              ${forecasts.slice().reverse().map((f, i) => {
                const x = padding + (chartWidth - 2 * padding) * ((demandHistory.length + forecasts.length - 1 - i) / Math.max(chartData.length, 1));
                const yLower = chartHeight - padding - (f.confidence_lower / maxValue) * (chartHeight - 2 * padding);
                return `L ${x} ${yLower}`;
              }).join(' ')}
              Z
            `}
            fill="#dbeafe"
            opacity="0.5"
          />
        )}

        {/* Historical demand line */}
        {demandHistory.length > 0 && (
          <path
            d={demandHistory.map((d, i) => {
              const x = padding + (chartWidth - 2 * padding) * (i / Math.max(chartData.length, 1));
              const y = chartHeight - padding - (d.demand / maxValue) * (chartHeight - 2 * padding);
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            stroke="#2563eb"
            strokeWidth="2"
            fill="none"
          />
        )}

        {/* Forecast line */}
        {forecasts.length > 0 && chartData.length > 0 && (
          <path
            d={forecasts.map((f, i) => {
              const x = padding + (chartWidth - 2 * padding) * ((demandHistory.length + i) / Math.max(chartData.length, 1));
              const y = chartHeight - padding - (f.predicted_demand / maxValue) * (chartHeight - 2 * padding);
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            stroke="#dc2626"
            strokeWidth="2"
            strokeDasharray="5,5"
            fill="none"
          />
        )}

        {/* Data points - Historical */}
        {demandHistory.map((d, i) => {
          const x = padding + (chartWidth - 2 * padding) * (i / Math.max(chartData.length, 1));
          const y = chartHeight - padding - (d.demand / maxValue) * (chartHeight - 2 * padding);
          return (
            <circle
              key={`hist-${i}`}
              cx={x}
              cy={y}
              r="3"
              fill="#2563eb"
            />
          );
        })}

        {/* Data points - Forecasts */}
        {forecasts.map((f, i) => {
          const x = padding + (chartWidth - 2 * padding) * ((demandHistory.length + i) / Math.max(chartData.length, 1));
          const y = chartHeight - padding - (f.predicted_demand / maxValue) * (chartHeight - 2 * padding);
          return (
            <circle
              key={`forecast-${i}`}
              cx={x}
              cy={y}
              r="3"
              fill="#dc2626"
            />
          );
        })}

        {/* Legend */}
        <g transform={`translate(${chartWidth - 200}, 30)`}>
          <rect x="0" y="0" width="180" height="60" fill="white" stroke="#e5e7eb" rx="4" />
          <line x1="10" y1="15" x2="30" y2="15" stroke="#2563eb" strokeWidth="2" />
          <text x="35" y="19" fontSize="12" fill="#374151">Historical</text>
          <line x1="10" y1="35" x2="30" y2="35" stroke="#dc2626" strokeWidth="2" strokeDasharray="3,3" />
          <text x="35" y="39" fontSize="12" fill="#374151">Forecast</text>
          <rect x="10" y="45" width="20" height="8" fill="#dbeafe" opacity="0.5" />
          <text x="35" y="53" fontSize="12" fill="#374151">Confidence</text>
        </g>
      </svg>
    </div>
  );
}
