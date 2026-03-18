import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  PieChart,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  Bar,
  Pie,
  Area,
  Cell,
} from 'recharts';
import type { ChartConfig } from '../lib/chartSelector';
import type { PieLabelRenderProps } from 'recharts';

interface ChartPanelProps {
  config: ChartConfig;
}

function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return String(value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tooltipFormatter(value: any, name: any): [string, string] {
  const numVal = typeof value === 'number' ? value : Number(value) || 0;
  const nameStr = String(name ?? '');
  const isMonetary = nameStr === 'revenue' || nameStr === 'profit';
  if (isMonetary) {
    return [
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(numVal),
      nameStr,
    ];
  }
  return [new Intl.NumberFormat('en-US').format(numVal), nameStr];
}

function renderPieLabel(props: PieLabelRenderProps): string {
  const name = props.name ?? '';
  const percent = props.percent ?? 0;
  return `${name} ${(percent * 100).toFixed(0)}%`;
}

const ChartPanel: React.FC<ChartPanelProps> = ({ config }) => {
  const { type, title, dataKey, xAxisKey, data, colors, showLegend } = config;
  const dataKeys: string[] = Array.isArray(dataKey) ? dataKey : [dataKey];

  const renderChart = () => {
    if (type === 'line') {
      return (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} width={70} />
          <Tooltip formatter={tooltipFormatter} />
          {showLegend && <Legend />}
          {dataKeys.map((key, idx) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[idx % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      );
    }

    if (type === 'area') {
      return (
        <AreaChart data={data}>
          <defs>
            {dataKeys.map((key, idx) => (
              <linearGradient key={key} id={`gradient-${config.id}-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} width={70} />
          <Tooltip formatter={tooltipFormatter} />
          {showLegend && <Legend />}
          {dataKeys.map((key, idx) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[idx % colors.length]}
              strokeWidth={2}
              fill={`url(#gradient-${config.id}-${idx})`}
            />
          ))}
        </AreaChart>
      );
    }

    if (type === 'bar' || type === 'grouped-bar') {
      return (
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={xAxisKey} tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11 }} width={70} />
          <Tooltip formatter={tooltipFormatter} />
          {showLegend && <Legend />}
          {dataKeys.map((key, idx) => (
            <Bar key={key} dataKey={key} fill={colors[idx % colors.length]} radius={[3, 3, 0, 0]}>
              {type === 'bar' && dataKeys.length === 1 &&
                data.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
                ))
              }
            </Bar>
          ))}
        </BarChart>
      );
    }

    if (type === 'pie') {
      return (
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKeys[0]}
            nameKey={xAxisKey}
            cx="50%"
            cy="50%"
            outerRadius={110}
            innerRadius={40}
            paddingAngle={2}
            label={renderPieLabel}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={tooltipFormatter} />
          {showLegend && <Legend />}
        </PieChart>
      );
    }

    return null;
  };

  return (
    <div className="chart-panel">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={320}>
        {renderChart() ?? <div />}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartPanel;
