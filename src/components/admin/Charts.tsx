'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DailyPoint } from '@/types/db';

/* A single, consistent set of hues for every chart in the admin panel. */
const SERIES = {
  views: '#8b5cf6',
  downloads: '#10b981',
  colorings: '#f59e0b',
} as const;

const CATEGORICAL = ['#8b5cf6', '#10b981', '#f59e0b', '#38bdf8', '#f43f5e', '#a3e635', '#64748b'];

const AXIS = { stroke: '#94a3b8', fontSize: 11, fontWeight: 600 } as const;

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  fontWeight: 600,
  boxShadow: '0 8px 24px -12px rgba(15,23,42,0.35)',
} as const;

function shortDay(value: unknown) {
  const date = new Date(String(value ?? ''));
  return Number.isNaN(date.getTime())
    ? String(value ?? '')
    : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

/** Views / downloads / colorings over time. */
export function TrafficChart({ data }: { data: DailyPoint[] }) {
  if (data.length === 0) {
    return <ChartEmpty message="No activity recorded yet. Numbers appear as visitors arrive." />;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            {Object.entries(SERIES).map(([key, color]) => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="day" tickFormatter={shortDay} tick={AXIS} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} width={46} />
          <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={shortDay} />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, fontWeight: 700, paddingTop: 8 }}
          />

          <Area
            type="monotone"
            dataKey="views"
            name="Views"
            stroke={SERIES.views}
            fill="url(#grad-views)"
            strokeWidth={2.5}
          />
          <Area
            type="monotone"
            dataKey="colorings"
            name="Colourings"
            stroke={SERIES.colorings}
            fill="url(#grad-colorings)"
            strokeWidth={2.5}
          />
          <Area
            type="monotone"
            dataKey="downloads"
            name="Downloads"
            stroke={SERIES.downloads}
            fill="url(#grad-downloads)"
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Horizontal bars - used for top pages and country splits. */
export function RankChart({
  data,
  color = CATEGORICAL[0],
  height = 280,
}: {
  data: { name: string; value: number }[];
  color?: string;
  height?: number;
}) {
  if (data.length === 0) return <ChartEmpty message="Nothing to rank yet." />;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
          <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            width={132}
          />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Bar dataKey="value" name="Events" fill={color} radius={[0, 6, 6, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut - used for the device split. */
export function SplitChart({ data }: { data: { name: string; value: number }[] }) {
  if (data.length === 0) return <ChartEmpty message="No visits recorded yet." />;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="82%"
            paddingAngle={3}
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={CATEGORICAL[index % CATEGORICAL.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="grid h-48 place-items-center rounded-xl bg-slate-50 px-6 text-center text-sm font-semibold text-slate-400">
      {message}
    </div>
  );
}
