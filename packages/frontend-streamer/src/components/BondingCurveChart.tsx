import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { BondingCurveState } from "../types";

interface BondingCurveChartProps {
  bondingCurveState: BondingCurveState;
}

export default function BondingCurveChart({ bondingCurveState }: BondingCurveChartProps) {
  // Generate chart data points for bonding curve visualization
  const generateChartData = () => {
    const data = [];
    const { k, tokensSold } = bondingCurveState;
    const maxTokens = tokensSold + 100000; // Show some future projection
    const step = maxTokens / 20;

    for (let tokens = 0; tokens <= maxTokens; tokens += step) {
      const price = k * tokens * tokens;
      data.push({
        tokens: Math.round(tokens),
        price: price.toFixed(8),
      });
    }

    return data;
  };

  const chartData = generateChartData();

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Bonding Curve</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="tokens"
            stroke="#9CA3AF"
            label={{ value: "Tokens Sold", position: "insideBottom", offset: -5 }}
          />
          <YAxis
            stroke="#9CA3AF"
            label={{ value: "Price (USDC)", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2937",
              border: "1px solid #374151",
              borderRadius: "0.5rem",
            }}
            labelStyle={{ color: "#F3F4F6" }}
          />
          <Line type="monotone" dataKey="price" stroke="#8B5CF6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-400">Current Price</p>
          <p className="text-lg font-semibold text-purple-400">
            ${bondingCurveState.currentPrice.toFixed(8)}
          </p>
        </div>
        <div>
          <p className="text-gray-400">Next Price</p>
          <p className="text-lg font-semibold text-purple-400">
            ${bondingCurveState.nextPrice.toFixed(8)}
          </p>
        </div>
      </div>
    </div>
  );
}
