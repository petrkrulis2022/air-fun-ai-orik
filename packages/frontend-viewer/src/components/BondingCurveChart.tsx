// Bonding curve visualization using Recharts

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface BondingCurveChartProps {
  currentSupply: number;
  maxSupply: number;
  currentPrice: number;
  k: number;
}

export function BondingCurveChart({
  currentSupply,
  maxSupply,
  currentPrice,
  k,
}: BondingCurveChartProps) {
  // Generate bonding curve data points
  const generateCurveData = () => {
    const points = [];
    const step = maxSupply / 50; // 50 data points

    for (let supply = 0; supply <= maxSupply; supply += step) {
      const price = k * supply * supply;
      points.push({
        supply: supply / 1000000, // Convert to millions
        price: price,
      });
    }

    return points;
  };

  const data = generateCurveData();
  const currentSupplyInMillions = currentSupply / 1000000;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="supply"
            stroke="#9ca3af"
            label={{ value: "Supply (M)", position: "insideBottom", offset: -5, fill: "#9ca3af" }}
          />
          <YAxis
            stroke="#9ca3af"
            label={{ value: "Price (USDC)", angle: -90, position: "insideLeft", fill: "#9ca3af" }}
            tickFormatter={(value) => `$${value.toFixed(6)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#9ca3af" }}
            formatter={(value: number) => [`$${value.toFixed(6)}`, "Price"]}
            labelFormatter={(label) => `Supply: ${label}M tokens`}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke="#8b5cf6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrice)"
          />

          {/* Current position marker */}
          <Line
            type="monotone"
            dataKey={(entry) =>
              entry.supply === Math.round(currentSupplyInMillions) ? currentPrice : null
            }
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 6, fill: "#10b981" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
