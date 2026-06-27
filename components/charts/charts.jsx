"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#f97316", "#ef4444", "#8b5cf6"];

export function ScoreBarChart({ data, title }) {
  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-medium mb-4">{title}</h4>}
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="name" className="text-xs" tick={{ fill: "currentColor" }} />
          <YAxis domain={[0, 100]} tick={{ fill: "currentColor" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendLineChart({ data, title }) {
  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-medium mb-4">{title}</h4>}
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fill: "currentColor" }} />
          <YAxis domain={[0, 100]} tick={{ fill: "currentColor" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
          />
          <Line type="monotone" dataKey="atsScore" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="grammarScore" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SectionRadarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid className="stroke-border" />
        <PolarAngleAxis dataKey="section" tick={{ fill: "currentColor", fontSize: 12 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "currentColor" }} />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#3b82f6"
          fill="#3b82f6"
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function SkillsPieChart({ matched, missing }) {
  const data = [
    { name: "Matched", value: matched.length },
    { name: "Missing", value: missing.length },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          label={({ name, value }) => `${name}: ${value}`}
        >
          <Cell fill="#22c55e" />
          <Cell fill="#ef4444" />
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AdminBarChart({ data, title }) {
  return (
    <div className="w-full">
      {title && <h4 className="text-sm font-medium mb-4">{title}</h4>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
