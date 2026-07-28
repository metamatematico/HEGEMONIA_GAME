"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from "recharts";
import { Play, Pause, SkipForward, Save, Download, Settings, Globe, Activity, Users, TrendingUp, Crown, Swords, Brain } from "lucide-react";
import GraphView from "@/components/hegemonia/graph-view";
import {
  nations, tradeFlows, gameEvents, historicalGDP, gameState,
  getNationName, classColor, classBgColor, classLabel, eventIcon, eventColor,
  type Nation
} from "@/lib/hegemonia-data";

// ─── Mini stat card ───
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="bg-[#111827] border border-slate-800/50 rounded-lg p-3 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: color + "20" }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">{label}</div>
        <div className="text-lg font-bold text-white font-mono leading-tight">{value}</div>
        {sub && <div className="text-[10px] text-slate-500 font-mono">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Panel wrapper ───
function Panel({ title, icon, children, className }: {
  title: string; icon: React.ElementType; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-[#111827] border border-slate-800/50 rounded-lg overflow-hidden ${className ?? ""}`}>
      <div className="px-4 py-2.5 border-b border-slate-800/50 flex items-center gap-2">
        <icon className="w-3.5 h-3.5 text-cyan-400" />
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── GDP Chart (horizontal bars) ───
function GDPChart() {
  const topNations = [...nations].sort((a, b) => b.gdp - a.gdp).slice(0, 10);
  const data = topNations.map((n) => ({
    name: n.flag + " " + n.name,
    gdp: n.gdp,
    fill: classColor(n.class),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 5, right: 20, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={{ stroke: "#334155" }} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
          labelStyle={{ color: "#e2e8f0" }}
          formatter={(v: number) => [`${v.toFixed(1)}B`, "GDP"]}
        />
        <Bar dataKey="gdp" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Temporal Evolution ───
function TemporalChart() {
  const tracked = ["gb", "fr", "de", "us", "ru", "cn"];
  const colors: Record<string, string> = {
    gb: "#06b6d4", fr: "#3b82f6", de: "#f59e0b", us: "#10b981", ru: "#ef4444", cn: "#a855f7",
  };
  const data = historicalGDP.map((h) => ({
    ...h,
    label: `${h.year}`,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ left: -20, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={{ stroke: "#334155" }} />
        <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={{ stroke: "#334155" }} />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 10 }}
          labelStyle={{ color: "#e2e8f0" }}
        />
        {tracked.map((id) => (
          <Line
            key={id}
            type="monotone"
            dataKey={id}
            stroke={colors[id]}
            strokeWidth={1.5}
            dot={false}
            name={getNationName(id)}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Distribution Donut ───
function DistributionChart() {
  const data = [
    { name: "Core", value: gameState.coreCount, color: "#06b6d4" },
    { name: "Semi", value: gameState.semiCount, color: "#f59e0b" },
    { name: "Periferia", value: gameState.peripheryCount, color: "#64748b" },
  ];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }}
          labelStyle={{ color: "#e2e8f0" }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(v: string) => <span className="text-slate-400 text-[10px]">{v}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Power Radar ───
function PowerRadar({ nation }: { nation: Nation }) {
  const data = [
    { dim: "Militar", val: nation.militaryPower },
    { dim: "Económico", val: Math.round((nation.gdp / 4.5) * 100) },
    { dim: "Cultural", val: nation.culturalPower },
    { dim: "Diplomático", val: nation.diplomaticPower },
    { dim: "Centralidad", val: Math.round(nation.eigenvectorCentrality * 100) },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#334155" />
        <PolarAngleAxis dataKey="dim" tick={{ fontSize: 9, fill: "#94a3b8" }} />
        <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
        <Radar
          dataKey="val"
          stroke={classColor(nation.class)}
          fill={classColor(nation.class)}
          fillOpacity={0.2}
          strokeWidth={1.5}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Rankings Table ───
function RankingsPanel({ onSelect }: { onSelect: (id: string) => void }) {
  const rankings = useMemo(() =>
    [...nations]
      .sort((a, b) => b.eigenvectorCentrality - a.eigenvectorCentrality)
      .slice(0, 8),
    []
  );

  return (
    <div className="divide-y divide-slate-800/50 max-h-[260px] overflow-y-auto heg-scroll">
      {rankings.map((n, i) => (
        <button
          key={n.id}
          onClick={() => onSelect(n.id)}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800/30 transition-colors text-left"
        >
          <span className={`text-[10px] font-mono w-5 text-center font-bold ${i < 3 ? "text-cyan-400" : "text-slate-600"}`}>
            {i + 1}
          </span>
          <span className="text-sm">{n.flag}</span>
          <span className="text-xs text-slate-300 flex-1 truncate">{n.name}</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium"
            style={{ background: classBgColor(n.class), color: classColor(n.class) }}
          >
            {classLabel(n.class).slice(0, 4)}
          </span>
          <span className="text-[10px] text-cyan-400 font-mono w-12 text-right">
            {n.eigenvectorCentrality.toFixed(2)}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Event Log ───
function EventLog() {
  const filtered = gameEvents.filter((e) => e.turn >= 10);

  return (
    <div className="max-h-[220px] overflow-y-auto heg-scroll">
      <AnimatePresence initial={false}>
        {filtered.map((ev, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-start gap-2 px-3 py-2 border-b border-slate-800/30 hover:bg-slate-800/20"
          >
            <span className="text-sm mt-px">{eventIcon(ev.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-300 leading-relaxed">{ev.text}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-slate-600 font-mono">T{ev.turn}</span>
                <span
                  className="text-[9px] font-mono px-1 py-0 rounded"
                  style={{ color: eventColor(ev.type) }}
                >
                  {ev.type.toUpperCase()}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Node Detail ───
function NodeDetail({ nationId }: { nationId: string }) {
  const topPartners = useMemo(() => {
    const flows = tradeFlows
      .filter((f) => f.from === nationId || f.to === nationId)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
    return flows.map((f) => ({
      partner: f.from === nationId ? f.to : f.from,
      volume: f.volume,
      direction: f.from === nationId ? "out" : "in",
    }));
  }, [nationId]);

  const nation = nations.find((n) => n.id === nationId);
  if (!nation) return null;

  const socialTotal = nation.socialStructure.elite + nation.socialStructure.middle +
    nation.socialStructure.working + nation.socialStructure.peasant;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{nation.flag}</span>
        <div>
          <h3 className="text-sm font-bold text-white">{nation.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium"
              style={{ background: classBgColor(nation.class), color: classColor(nation.class) }}
            >
              {classLabel(nation.class)}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">{nation.ideology}</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900/50 rounded p-2">
          <div className="text-[9px] uppercase text-slate-600 font-mono">GDP</div>
          <div className="text-sm font-bold text-white font-mono">${nation.gdp}B</div>
        </div>
        <div className="bg-slate-900/50 rounded p-2">
          <div className="text-[9px] uppercase text-slate-600 font-mono">Población</div>
          <div className="text-sm font-bold text-white font-mono">{nation.population}M</div>
        </div>
        <div className="bg-slate-900/50 rounded p-2">
          <div className="text-[9px] uppercase text-slate-600 font-mono">Balanza</div>
          <div className={`text-sm font-bold font-mono ${nation.tradeBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {nation.tradeBalance >= 0 ? "+" : ""}{nation.tradeBalance}M
          </div>
        </div>
        <div className="bg-slate-900/50 rounded p-2">
          <div className="text-[9px] uppercase text-slate-600 font-mono">Centralidad</div>
          <div className="text-sm font-bold text-cyan-400 font-mono">{nation.eigenvectorCentrality.toFixed(3)}</div>
        </div>
      </div>

      {/* Social structure */}
      <div>
        <div className="text-[10px] uppercase text-slate-500 font-mono mb-2">Estructura Social</div>
        <div className="flex rounded-full overflow-hidden h-2">
          {[
            { pct: nation.socialStructure.elite / socialTotal, color: "#a855f7", label: "Elite" },
            { pct: nation.socialStructure.middle / socialTotal, color: "#06b6d4", label: "Media" },
            { pct: nation.socialStructure.working / socialTotal, color: "#f59e0b", label: "Obrera" },
            { pct: nation.socialStructure.peasant / socialTotal, color: "#64748b", label: "Campesina" },
          ].map((seg, i) => (
            <div
              key={i}
              className="h-full"
              style={{ width: `${seg.pct * 100}%`, background: seg.color }}
              title={`${seg.label}: ${(seg.pct * 100).toFixed(0)}%`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          {[
            { label: "Elite", val: nation.socialStructure.elite, color: "#a855f7" },
            { label: "Media", val: nation.socialStructure.middle, color: "#06b6d4" },
            { label: "Obrera", val: nation.socialStructure.working, color: "#f59e0b" },
            { label: "Camp.", val: nation.socialStructure.peasant, color: "#64748b" },
          ].map((s, i) => (
            <span key={i} className="text-[9px] font-mono" style={{ color: s.color }}>{s.val}%</span>
          ))}
        </div>
      </div>

      {/* Power radar */}
      <PowerRadar nation={nation} />

      {/* Trade partners */}
      <div>
        <div className="text-[10px] uppercase text-slate-500 font-mono mb-2">Top Socios Comerciales</div>
        <div className="space-y-1">
          {topPartners.map((tp, i) => {
            const partner = nations.find((n) => n.id === tp.partner);
            return (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className="text-xs">{partner?.flag ?? "🏳️"}</span>
                <span className="text-slate-400 flex-1 truncate">{getNationName(tp.partner)}</span>
                <span className={`font-mono ${tp.direction === "out" ? "text-red-400" : "text-emerald-400"}`}>
                  {tp.direction === "out" ? "→" : "←"} {tp.volume}M
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resources */}
      <div>
        <div className="text-[10px] uppercase text-slate-500 font-mono mb-2">Recursos</div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {[
            { name: "Carbón", val: nation.resources.coal, color: "#64748b" },
            { name: "Hierro", val: nation.resources.iron, color: "#94a3b8" },
            { name: "Grano", val: nation.resources.grain, color: "#f59e0b" },
            { name: "Algodón", val: nation.resources.cotton, color: "#e2e8f0" },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 w-12">{r.name}</span>
              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${r.val}%`, background: r.color }} />
              </div>
              <span className="text-[10px] font-mono text-slate-400 w-6 text-right">{r.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════
export default function Home() {
  const [selectedNation, setSelectedNation] = useState<string | null>("gb");
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<"rankings" | "detail">("detail");

  // Simulate auto-play
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      // Cycle through nations
      const currentIdx = nations.findIndex((n) => n.id === selectedNation);
      const nextIdx = (currentIdx + 1) % nations.length;
      setSelectedNation(nations[nextIdx].id);
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying, selectedNation]);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-200 font-mono overflow-hidden">
      {/* ─── HEADER ─── */}
      <header className="h-12 bg-[#111827]/80 backdrop-blur border-b border-slate-800/50 flex items-center px-4 gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-white tracking-wide">HEGEMONÍA</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">El Grafo de los Mundos</span>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-slate-500">Turno</span>
          <span className="text-cyan-400 font-bold">#{gameState.turn}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">Año</span>
          <span className="text-white font-bold">{gameState.year}</span>
          <span className="text-slate-500">·</span>
          <span className="px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400 text-[10px] border border-cyan-400/20">
            {gameState.playerIdeology}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-7 h-7 rounded bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center hover:bg-cyan-400/20 transition-colors"
          >
            {isPlaying ? <Pause className="w-3 h-3 text-cyan-400" /> : <Play className="w-3 h-3 text-cyan-400 ml-0.5" />}
          </button>
          <button className="w-7 h-7 rounded bg-slate-800/50 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/50 transition-colors">
            <SkipForward className="w-3 h-3 text-slate-400" />
          </button>
          <button className="w-7 h-7 rounded bg-slate-800/50 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/50 transition-colors">
            <Save className="w-3 h-3 text-slate-400" />
          </button>
          <button className="w-7 h-7 rounded bg-slate-800/50 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/50 transition-colors">
            <Download className="w-3 h-3 text-slate-400" />
          </button>
          <button className="w-7 h-7 rounded bg-slate-800/50 border border-slate-700/50 flex items-center justify-center hover:bg-slate-700/50 transition-colors">
            <Settings className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      </header>

      {/* ─── MAIN CONTENT ─── */}
      <main className="h-[calc(100vh-3rem)] overflow-hidden">
        <div className="h-full grid grid-cols-12 grid-rows-12 gap-1.5 p-1.5">

          {/* ─── GRAPH VIEW (left, large) ─── */}
          <div className="col-span-5 row-span-8">
            <GraphView selectedNation={selectedNation} onSelectNation={setSelectedNation} />
          </div>

          {/* ─── RIGHT COLUMN ─── */}
          <div className="col-span-7 row-span-8 flex flex-col gap-1.5">

            {/* Global Indicators */}
            <div className="grid grid-cols-4 gap-1.5">
              <StatCard icon={TrendingUp} label="GDP Global" value={`${gameState.totalGDP}B`} color="#06b6d4" />
              <StatCard icon={Activity} label="Comercio" value={`${gameState.totalTrade}B`} color="#10b981" />
              <StatCard icon={Users} label="Población" value={`${gameState.totalPopulation}M`} color="#a855f7" />
              <StatCard icon={Crown} label="Naciones" value={`${nations.length}`} sub="5C · 7S · 8P" color="#f59e0b" />
            </div>

            {/* GDP + Distribution charts */}
            <div className="flex-1 grid grid-cols-2 gap-1.5 min-h-0">
              <Panel title="GDP por Nación (Top 10)" icon={TrendingUp} className="!flex !flex-col">
                <div className="flex-1 p-2 min-h-0">
                  <GDPChart />
                </div>
              </Panel>
              <Panel title="Distribución Mundial" icon={Globe} className="!flex !flex-col">
                <div className="flex-1 p-2 min-h-0">
                  <DistributionChart />
                </div>
              </Panel>
            </div>

            {/* Detail / Rankings tab */}
            <div className="flex-1 min-h-0">
              <div className="h-full bg-[#111827] border border-slate-800/50 rounded-lg overflow-hidden flex flex-col">
                {/* Tab headers */}
                <div className="flex border-b border-slate-800/50">
                  <button
                    onClick={() => setActiveTab("detail")}
                    className={`flex-1 px-4 py-2 text-[10px] uppercase tracking-wider font-mono transition-colors ${activeTab === "detail" ? "text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    🔍 Detalle de Nación
                  </button>
                  <button
                    onClick={() => setActiveTab("rankings")}
                    className={`flex-1 px-4 py-2 text-[10px] uppercase tracking-wider font-mono transition-colors ${activeTab === "rankings" ? "text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    🏆 Rankings
                  </button>
                </div>
                {/* Tab content */}
                <div className="flex-1 overflow-y-auto heg-scroll">
                  {activeTab === "detail" && selectedNation && (
                    <NodeDetail nationId={selectedNation} />
                  )}
                  {activeTab === "detail" && !selectedNation && (
                    <div className="flex items-center justify-center h-full text-slate-600 text-xs">
                      Haz click en un nodo del grafo para ver su detalle
                    </div>
                  )}
                  {activeTab === "rankings" && (
                    <RankingsPanel onSelect={setSelectedNation} />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ─── BOTTOM LEFT: Event Log ─── */}
          <div className="col-span-5 row-span-4">
            <Panel title="Log de Eventos" icon={Activity} className="!h-full !flex !flex-col">
              <div className="flex-1 overflow-hidden">
                <EventLog />
              </div>
            </Panel>
          </div>

          {/* ─── BOTTOM RIGHT: Temporal chart + Ideology summary ─── */}
          <div className="col-span-7 row-span-4 grid grid-cols-2 gap-1.5">
            <Panel title="Evolución Temporal del GDP" icon={TrendingUp} className="!flex !flex-col">
              <div className="flex-1 p-2 min-h-0">
                <TemporalChart />
              </div>
            </Panel>

            {/* Ideology summary panel */}
            <Panel title="Ideologías Activas" icon={Brain} className="!flex !flex-col">
              <div className="flex-1 p-3 space-y-2 overflow-y-auto heg-scroll">
                {[
                  { name: "Mercantilismo", icon: "💰", count: 2, desc: "Proteccionismo + acumulación de oro", color: "#f59e0b" },
                  { name: "Liberalismo", icon: "⚖️", count: 4, desc: "Libre comercio + competencia", color: "#06b6d4" },
                  { name: "Nacionalismo", icon: "🏛️", count: 2, desc: "Unificación + poder estatal", color: "#ef4444" },
                  { name: "Conservadurismo", icon: "👑", count: 10, desc: "Tradición + orden jerárquico", color: "#a855f7" },
                  { name: "Absolutismo", icon: "🏰", count: 1, desc: "Poder centralizado + control total", color: "#64748b" },
                  { name: "Socialismo", icon: "✊", count: 0, desc: "Clase trabajadora + propiedad colectiva", color: "#10b981" },
                ].map((ideo, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded bg-slate-900/40 border border-slate-800/30">
                    <span className="text-lg">{ideo.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white font-medium">{ideo.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: ideo.color + "20", color: ideo.color }}>
                          {ideo.count}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{ideo.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}
