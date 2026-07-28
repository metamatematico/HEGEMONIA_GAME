"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend
} from "recharts";
import {
  Play, Pause, SkipForward, Save, Download, Settings, Globe, Activity, Users,
  TrendingUp, Crown, Swords, Brain, ChevronRight, ChevronLeft, FastForward
} from "lucide-react";
import { useHegemoniaStore } from "@/store/hegemonia-store";
import {
  IDEOLOGY_INFO, CLASS_INFO, PHASE_LABELS, type Phase,
} from "@/core/types";
import type { NationNode, TradeEdge, PlayerActionType } from "@/core/types";
import { getTopPartners } from "@/core/algorithms";
import {
  PLAYER_ACTIONS, getPlayerActionMeta, isOnCooldown, canAfford, getEffectiveCost,
} from "@/core/player-actions";

// ─── Colors helper ───
function classColor(cls: string): string {
  return CLASS_INFO[cls as keyof typeof CLASS_INFO]?.color ?? "#475569";
}
function classBgColor(cls: string): string {
  return CLASS_INFO[cls as keyof typeof CLASS_INFO]?.bgColor ?? "rgba(71,85,105,0.15)";
}
function classLabel(cls: string): string {
  return CLASS_INFO[cls as keyof typeof CLASS_INFO]?.label ?? cls;
}
function eventIcon(type: string): string {
  const m: Record<string, string> = { trade: "📦", war: "⚔️", revolution: "🔥", crisis: "⚠️", diplomacy: "🤝", ideology: "💭" };
  return m[type] ?? "📌";
}
function eventColor(type: string): string {
  const m: Record<string, string> = { trade: "#06b6d4", war: "#ef4444", revolution: "#f97316", crisis: "#eab308", diplomacy: "#10b981", ideology: "#a855f7" };
  return m[type] ?? "#64748b";
}

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
function Panel({ title, icon: Icon, children, className }: {
  title: string; icon: React.ElementType; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-[#111827] border border-slate-800/50 rounded-lg overflow-hidden ${className ?? ""}`}>
      <div className="px-4 py-2.5 border-b border-slate-800/50 flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-cyan-400" />
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── GRAPH VIEW ───
function GraphView() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState("-5 -5 110 90");
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const vbStart = useRef({ x: -5, y: -5 });

  const nations = useHegemoniaStore((s) => s.nations);
  const edges = useHegemoniaStore((s) => s.edges);
  const selectedNationId = useHegemoniaStore((s) => s.selectedNationId);
  const setSelectedNation = useHegemoniaStore((s) => s.setSelectedNation);
  const activeTab = useHegemoniaStore((s) => s.activeTab);
  const actionTargetId = useHegemoniaStore((s) => s.actionTargetId);
  const setActionTarget = useHegemoniaStore((s) => s.setActionTarget);

  const maxVolume = useMemo(() => Math.max(1, ...edges.map((e) => e.volume)), [edges]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const [vx, vy, vw, vh] = viewBox.split(" ").map(Number);
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * vw + vx;
    const my = ((e.clientY - rect.top) / rect.height) * vh + vy;
    const f = e.deltaY > 0 ? 1.1 : 0.9;
    const nvw = Math.max(30, Math.min(130, vw * f));
    const nvh = nvw * (vh / vw);
    const r = nvw / vw;
    setViewBox(`${(mx - (mx - vx) * r).toFixed(1)} ${(my - (my - vy) * r).toFixed(1)} ${nvw.toFixed(1)} ${nvh.toFixed(1)}`);
  }, [viewBox]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest(".gn")) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    const [vx, vy] = viewBox.split(" ").map(Number);
    vbStart.current = { x: vx, y: vy };
  }, [viewBox]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const [vw] = viewBox.split(" ").map(Number);
    const sx = vw / rect.width;
    const sy = sx;
    const [, , , vh] = viewBox.split(" ").map(Number);
    setViewBox(`${(vbStart.current.x - (e.clientX - dragStart.current.x) * sx).toFixed(1)} ${(vbStart.current.y - (e.clientY - dragStart.current.y) * sy).toFixed(1)} ${vw} ${vh}`);
  }, [isDragging, viewBox]);

  const highlightNode = selectedNationId || hoveredNode;

  return (
    <div className="relative w-full h-full min-h-[400px] bg-[#070b14] rounded-lg overflow-hidden border border-slate-800/50">
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none">
        <defs><pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M 5 0 L 0 0 0 5" fill="none" stroke="#06b6d4" strokeWidth="0.15" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-xs font-mono text-cyan-400/70 uppercase tracking-wider">Grafo Mundial — {nations.length} nodos, {edges.length} aristas</span>
      </div>
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 bg-black/40 backdrop-blur-sm rounded px-3 py-2 border border-slate-800/30">
        {(["core", "semi", "periphery"] as const).map((c) => (
          <div key={c} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: classColor(c) }} />
            <span className="text-[10px] text-slate-400">{classLabel(c)}</span>
          </div>
        ))}
      </div>

      <svg ref={svgRef} viewBox={viewBox} className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)} onMouseLeave={() => setIsDragging(false)}
        onClick={(e) => { if (!(e.target as Element).closest(".gn")) setSelectedNation(null); }}
        style={{ touchAction: "none" }}>
        <defs>
          <filter id="gc" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2" result="b" /><feFlood floodColor="#06b6d4" floodOpacity="0.6" result="c" /><feComposite in="c" in2="b" operator="in" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="gs" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.5" result="b" /><feFlood floodColor="#f59e0b" floodOpacity="0.5" result="c" /><feComposite in="c" in2="b" operator="in" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="gk" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b" /><feFlood floodColor="#06b6d4" floodOpacity="0.8" result="c" /><feComposite in="c" in2="b" operator="in" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const from = nations.find((n) => n.id === e.from);
          const to = nations.find((n) => n.id === e.to);
          if (!from || !to) return null;
          const isHi = highlightNode ? (e.from === highlightNode || e.to === highlightNode) : false;
          const op = highlightNode ? (isHi ? 0.7 : 0.05) : 0.15 + (e.volume / maxVolume) * 0.25;
          const sc = isHi ? (e.type === "raw" ? "#10b981" : e.type === "manufactured" ? "#06b6d4" : "#a855f7") : "#334155";
          return (
            <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={sc} strokeWidth={isHi ? Math.min(3, e.volume / 100) * 1.5 : Math.min(3, e.volume / 100)}
              opacity={op} strokeLinecap="round">
              {isHi && <animate attributeName="stroke-dasharray" values="2 6;6 2;2 6" dur="2s" repeatCount="indefinite" />}
            </line>
          );
        })}

        {/* Nodes */}
        {nations.map((n) => {
          const r = Math.max(3, 3 + (n.gdp / 4.5) * 7);
          const isSel = n.id === selectedNationId;
          const isHov = n.id === hoveredNode;
          const isConn = highlightNode && edges.some((e) => (e.from === highlightNode && e.to === n.id) || (e.to === highlightNode && e.from === n.id));
          const dimmed = highlightNode && !isSel && !isConn && n.id !== highlightNode;
          const color = classColor(n.worldClass);
          return (
            <g key={n.id} className="gn" transform={`translate(${n.x},${n.y})`} opacity={dimmed ? 0.15 : 1}
              style={{ cursor: "pointer" }}
              onClick={(ev) => {
                ev.stopPropagation();
                if (activeTab === "actions" && n.id !== "gb") {
                  setActionTarget(isSel ? null : n.id);
                } else {
                  setSelectedNation(isSel ? null : n.id);
                }
              }}
              onMouseEnter={() => setHoveredNode(n.id)} onMouseLeave={() => setHoveredNode(null)}>
              {isSel && <circle r={r + 4} fill="none" stroke={color} strokeWidth="1.5" opacity="0.4"><animate attributeName="r" values={`${r + 3};${r + 6};${r + 3}`} dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" /></circle>}
              {n.id === actionTargetId && (
                <circle r={r + 3} fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.8">
                  <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="6s" repeatCount="indefinite" />
                </circle>
              )}
              <circle r={r} fill={color} opacity={isSel || isHov ? 1 : 0.75}
                filter={isSel ? "url(#gk)" : n.worldClass === "core" ? "url(#gc)" : n.worldClass === "semi" ? "url(#gs)" : undefined} />
              <circle r={r * 0.4} fill="white" opacity={isSel ? 0.6 : 0.3} />
              <text y={r + 3} textAnchor="middle" fill={dimmed ? "#475569" : isSel ? "#e2e8f0" : "#94a3b8"} fontSize="1.8" fontFamily="monospace" fontWeight={isSel ? 600 : 400}>
                {n.flag} {n.name.length > 12 ? n.name.slice(0, 10) + "…" : n.name}
              </text>
              {isHov && !isSel && (
                <g transform={`translate(0,${-r - 6})`}>
                  <rect x={-30} y={-14} width={60} height={14} rx={3} fill="rgba(15,23,42,0.9)" stroke={color} strokeWidth={0.5} />
                  <text textAnchor="middle" y={-4} fill="#e2e8f0" fontSize="2.2" fontFamily="monospace" fontWeight={600}>GDP: {n.gdp.toFixed(1)}B</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-3 left-4 text-[10px] text-slate-600 font-mono">Scroll: zoom · Drag: pan · Click: select</div>
    </div>
  );
}

// ─── GDP Chart ───
function GDPChart({ nations }: { nations: NationNode[] }) {
  const top = useMemo(() => [...nations].sort((a, b) => b.gdp - a.gdp).slice(0, 10), [nations]);
  const data = top.map((n) => ({ name: n.flag + " " + n.name, gdp: Math.round(n.gdp * 100) / 100, fill: classColor(n.worldClass) }));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 5, right: 20, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={{ stroke: "#334155" }} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} />
        <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#e2e8f0" }} formatter={(v: number) => [`${v.toFixed(1)}B`, "GDP"]} />
        <Bar dataKey="gdp" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Temporal Chart ───
function TemporalChart() {
  const hist = useHegemoniaStore((s) => s.historicalGDP);
  const tracked = ["gb", "fr", "de", "us", "ru", "cn"];
  const colors: Record<string, string> = { gb: "#06b6d4", fr: "#3b82f6", de: "#f59e0b", us: "#10b981", ru: "#ef4444", cn: "#a855f7" };
  const names: Record<string, string> = { gb: "GB", fr: "FR", de: "DE", us: "US", ru: "RU", cn: "CN" };
  const data = hist.map((h) => ({ ...h, label: `${h.year}` }));
  if (data.length < 2) {
    return <div className="flex items-center justify-center h-full text-slate-600 text-xs">Avanza 2+ turnos para ver la gráfica</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ left: -20, right: 10, top: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={{ stroke: "#334155" }} />
        <YAxis tick={{ fontSize: 9, fill: "#64748b" }} axisLine={{ stroke: "#334155" }} />
        <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 10 }} labelStyle={{ color: "#e2e8f0" }} />
        {tracked.map((id) => <Line key={id} type="monotone" dataKey={id} stroke={colors[id]} strokeWidth={1.5} dot={false} name={names[id]} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Distribution Donut ───
function DistributionChart({ core, semi, periphery }: { core: number; semi: number; periphery: number }) {
  const data = [{ name: "Core", value: core, color: "#06b6d4" }, { name: "Semi", value: semi, color: "#f59e0b" }, { name: "Periferia", value: periphery, color: "#64748b" }];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
          {data.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
        </Pie>
        <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#e2e8f0" }} />
        <Legend verticalAlign="bottom" iconType="circle" iconSize={8} formatter={(v: string) => <span className="text-slate-400 text-[10px]">{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ─── Power Radar ───
function PowerRadar({ nation }: { nation: NationNode }) {
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
        <Radar dataKey="val" stroke={classColor(nation.worldClass)} fill={classColor(nation.worldClass)} fillOpacity={0.2} strokeWidth={1.5} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ─── Rankings ───
function RankingsPanel() {
  const nations = useHegemoniaStore((s) => s.nations);
  const setSelected = useHegemoniaStore((s) => s.setSelectedNation);
  const rankings = useMemo(() => [...nations].sort((a, b) => b.eigenvectorCentrality - a.eigenvectorCentrality).slice(0, 8), [nations]);
  return (
    <div className="divide-y divide-slate-800/50 max-h-[260px] overflow-y-auto heg-scroll">
      {rankings.map((n, i) => (
        <button key={n.id} onClick={() => setSelected(n.id)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-800/30 transition-colors text-left">
          <span className={`text-[10px] font-mono w-5 text-center font-bold ${i < 3 ? "text-cyan-400" : "text-slate-600"}`}>{i + 1}</span>
          <span className="text-sm">{n.flag}</span>
          <span className="text-xs text-slate-300 flex-1 truncate">{n.name}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium" style={{ background: classBgColor(n.worldClass), color: classColor(n.worldClass) }}>{classLabel(n.worldClass).slice(0, 4)}</span>
          <span className="text-[10px] text-cyan-400 font-mono w-12 text-right">{n.eigenvectorCentrality.toFixed(2)}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Event Log ───
function EventLog() {
  const events = useHegemoniaStore((s) => s.events);
  const recentEvents = useMemo(() => events.slice(-25).reverse(), [events]);
  return (
    <div className="max-h-[220px] overflow-y-auto heg-scroll">
      <AnimatePresence initial={false}>
        {recentEvents.map((ev, i) => (
          <motion.div key={ev.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3) }}
            className="flex items-start gap-2 px-3 py-2 border-b border-slate-800/30 hover:bg-slate-800/20">
            <span className="text-sm mt-px">{eventIcon(ev.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-slate-300 leading-relaxed">{ev.text}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] text-slate-600 font-mono">T{ev.turn}</span>
                <span className="text-[9px] font-mono" style={{ color: eventColor(ev.type) }}>{ev.type.toUpperCase()}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {recentEvents.length === 0 && <div className="p-4 text-center text-slate-600 text-xs">Avanza un turno para ver eventos</div>}
    </div>
  );
}

// ─── Node Detail ───
function NodeDetail() {
  const nations = useHegemoniaStore((s) => s.nations);
  const edges = useHegemoniaStore((s) => s.edges);
  const selectedId = useHegemoniaStore((s) => s.selectedNationId);
  const nation = useMemo(() => nations.find((n) => n.id === selectedId), [nations, selectedId]);
  if (!nation) return <div className="flex items-center justify-center h-full text-slate-600 text-xs">Selecciona un nodo del grafo</div>;
  const topPartners = getTopPartners(nation.id, edges, 5);
  const socialTotal = nation.socialClasses.elite + nation.socialClasses.middle + nation.socialClasses.working + nation.socialClasses.peasant;
  const ideoInfo = IDEOLOGY_INFO[nation.ideology];

  return (
    <div className="p-4 space-y-4 overflow-y-auto heg-scroll h-full">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{nation.flag}</span>
        <div>
          <h3 className="text-sm font-bold text-white">{nation.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium" style={{ background: classBgColor(nation.worldClass), color: classColor(nation.worldClass) }}>{classLabel(nation.worldClass)}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: ideoInfo.color + "20", color: ideoInfo.color }}>{ideoInfo.icon} {ideoInfo.name}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { l: "GDP", v: `$${nation.gdp.toFixed(2)}B`, c: "text-white" },
          { l: "Población", v: `${nation.population}M`, c: "text-white" },
          { l: "Balanza", v: `${nation.tradeBalance >= 0 ? "+" : ""}${nation.tradeBalance}M`, c: nation.tradeBalance >= 0 ? "text-emerald-400" : "text-red-400" },
          { l: "Centralidad", v: nation.eigenvectorCentrality.toFixed(3), c: "text-cyan-400" },
          { l: "Estabilidad", v: `${nation.stability.toFixed(0)}%`, c: nation.stability > 50 ? "text-emerald-400" : "text-red-400" },
          { l: "Industria", v: `${nation.industrialization.toFixed(0)}%`, c: "text-amber-400" },
        ].map((s, i) => (
          <div key={i} className="bg-slate-900/50 rounded p-2">
            <div className="text-[9px] uppercase text-slate-600 font-mono">{s.l}</div>
            <div className={`text-sm font-bold font-mono ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="text-[10px] uppercase text-slate-500 font-mono mb-2">Estructura Social</div>
        <div className="flex rounded-full overflow-hidden h-2">
          {[
            { pct: nation.socialClasses.elite / socialTotal, color: "#a855f7" },
            { pct: nation.socialClasses.middle / socialTotal, color: "#06b6d4" },
            { pct: nation.socialClasses.working / socialTotal, color: "#f59e0b" },
            { pct: nation.socialClasses.peasant / socialTotal, color: "#64748b" },
          ].map((seg, i) => <div key={i} className="h-full" style={{ width: `${seg.pct * 100}%`, background: seg.color }} />)}
        </div>
        <div className="flex justify-between mt-1">
          {[
            { l: "Elite", v: nation.socialClasses.elite, c: "#a855f7" },
            { l: "Media", v: nation.socialClasses.middle, c: "#06b6d4" },
            { l: "Obrera", v: nation.socialClasses.working, c: "#f59e0b" },
            { l: "Camp.", v: nation.socialClasses.peasant, c: "#64748b" },
          ].map((s, i) => <span key={i} className="text-[9px] font-mono" style={{ color: s.c }}>{s.v}%</span>)}
        </div>
      </div>

      <PowerRadar nation={nation} />

      <div>
        <div className="text-[10px] uppercase text-slate-500 font-mono mb-2">Top Socios Comerciales</div>
        <div className="space-y-1">
          {topPartners.map((tp, i) => {
            const partner = nations.find((n) => n.id === tp.partnerId);
            return (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className="text-xs">{partner?.flag ?? "🏳️"}</span>
                <span className="text-slate-400 flex-1 truncate">{partner?.name ?? tp.partnerId}</span>
                <span className={`font-mono ${tp.direction === "out" ? "text-red-400" : "text-emerald-400"}`}>{tp.direction === "out" ? "→" : "←"} {tp.volume.toFixed(0)}</span>
              </div>
            );
          })}
        </div>
      </div>

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
                <div className="h-full rounded-full" style={{ width: `${r.val}%`, background: r.color }} />
              </div>
              <span className="text-[10px] font-mono text-slate-400 w-6 text-right">{r.val.toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Player Actions Panel ───
function PlayerActionsPanel() {
  const gameState = useHegemoniaStore((s) => s.gameState);
  const nations = useHegemoniaStore((s) => s.nations);
  const queuePlayerAction = useHegemoniaStore((s) => s.queuePlayerAction);
  const actionTargetId = useHegemoniaStore((s) => s.actionTargetId);
  const setActionTarget = useHegemoniaStore((s) => s.setActionTarget);
  const lastResult = useHegemoniaStore((s) => s.lastActionResult);
  const clearActionResult = useHegemoniaStore((s) => s.clearActionResult);

  const player = nations.find((n) => n.isPlayer);
  if (!player) return <div className="p-4 text-slate-600 text-xs">No hay nación del jugador</div>;

  const actionsLeft = gameState.maxActionsPerTurn - gameState.playerActionsUsedThisTurn;
  const cooldowns = gameState.playerCooldowns;
  const target = actionTargetId ? nations.find((n) => n.id === actionTargetId) : undefined;

  // Group actions by category
  const categories: Record<string, typeof PLAYER_ACTIONS> = {
    economy: [], military: [], diplomacy: [], ideology: [], control: [],
  };
  for (const a of PLAYER_ACTIONS) categories[a.category].push(a);

  const categoryLabels: Record<string, string> = {
    economy: "Economía",
    military: "Militar",
    diplomacy: "Diplomacia",
    ideology: "Ideología",
    control: "Control",
  };

  const handleAction = (type: PlayerActionType, requiresTarget: boolean) => {
    if (requiresTarget && !actionTargetId) {
      // Show hint — select a target first
      return;
    }
    queuePlayerAction(type, requiresTarget ? actionTargetId ?? undefined : undefined);
    setTimeout(() => clearActionResult(), 3000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header: actions left + player stats */}
      <div className="px-3 py-2 border-b border-slate-800/50 bg-slate-900/30 flex items-center gap-3 shrink-0">
        <span className="text-base">{player.flag}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white font-semibold">{player.name}</div>
          <div className="text-[10px] text-slate-500 font-mono">
            PIB: ${player.gdp.toFixed(2)}B · Estab: {player.stability.toFixed(0)}% · Descont: {player.unrest.toFixed(0)}%
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex gap-0.5">
            {Array.from({ length: gameState.maxActionsPerTurn }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-sm ${i < actionsLeft ? "bg-cyan-400" : "bg-slate-700"}`}
              />
            ))}
          </div>
          <span className="text-[9px] text-slate-500 font-mono mt-0.5">
            {actionsLeft} acción{actionsLeft !== 1 ? "es" : ""} restante{actionsLeft !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Last action result */}
      {lastResult && (
        <div className={`px-3 py-1.5 text-[10px] font-mono border-b shrink-0 ${
          lastResult.success
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-red-500/10 text-red-400 border-red-500/20"
        }`}>
          {lastResult.success ? "✓ Acción encolada" : `✗ ${lastResult.reason ?? "Error"}`}
        </div>
      )}

      {/* Target selector hint */}
      <div className="px-3 py-1.5 border-b border-slate-800/30 shrink-0 flex items-center gap-2">
        <span className="text-[9px] uppercase tracking-wider text-slate-600 font-mono">Objetivo:</span>
        {target ? (
          <>
            <span className="text-xs">{target.flag}</span>
            <span className="text-[11px] text-slate-300 flex-1 truncate">{target.name}</span>
            <button
              onClick={() => setActionTarget(null)}
              className="text-[10px] text-slate-500 hover:text-red-400 font-mono"
            >
              ✕
            </button>
          </>
        ) : (
          <span className="text-[10px] text-slate-600 italic flex-1">
            Selecciona una nación en el grafo para acciones con objetivo
          </span>
        )}
      </div>

      {/* Actions grid — scrollable */}
      <div className="flex-1 overflow-y-auto heg-scroll p-2 space-y-2">
        {Object.entries(categories).map(([catKey, actions]) => (
          actions.length > 0 && (
            <div key={catKey}>
              <div className="text-[9px] uppercase tracking-wider text-slate-600 font-mono mb-1 px-1">
                {categoryLabels[catKey]}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {actions.map((action) => {
                  const meta = getPlayerActionMeta(action.type);
                  const onCd = isOnCooldown(action.type, cooldowns, gameState.turn);
                  const affordable = canAfford(action.type, player);
                  const cost = getEffectiveCost(action.type, player);
                  const needsTarget = meta.requiresTarget && !actionTargetId;
                  const disabled = onCd || !affordable || needsTarget || actionsLeft <= 0;
                  const hasIdeologyBonus = meta.ideologyBonus?.includes(player.ideology);

                  return (
                    <button
                      key={action.type}
                      onClick={() => handleAction(action.type, meta.requiresTarget)}
                      disabled={disabled}
                      className={`text-left p-2 rounded border transition-all relative ${
                        disabled
                          ? "bg-slate-900/30 border-slate-800/30 opacity-50 cursor-not-allowed"
                          : "bg-slate-800/40 border-slate-700/50 hover:bg-cyan-400/10 hover:border-cyan-400/30 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm">{action.icon}</span>
                        <span className="text-[11px] font-semibold text-slate-200 truncate">
                          {action.label}
                        </span>
                        {hasIdeologyBonus && (
                          <span className="text-[8px] px-1 rounded bg-cyan-400/20 text-cyan-400 font-mono ml-auto shrink-0">
                            BONUS
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-500 leading-tight line-clamp-2 mb-1">
                        {action.description}
                      </p>
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className={affordable ? "text-amber-400" : "text-red-400"}>
                          ${cost}B
                        </span>
                        {onCd && (
                          <span className="text-slate-500">
                            ⏱ {(cooldowns[action.type] ?? 0) - gameState.turn}T
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

// ─── Ideologies Panel ───
function IdeologiesPanel() {
  const counts = useHegemoniaStore((s) => s.ideologyCounts);
  return (
    <div className="flex-1 p-3 space-y-2 overflow-y-auto heg-scroll">
      {counts.map((ideo, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded bg-slate-900/40 border border-slate-800/30">
          <span className="text-lg">{ideo.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white font-medium">{ideo.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: ideo.color + "20", color: ideo.color }}>{ideo.count}</span>
            </div>
            <p className="text-[10px] text-slate-500 truncate">{ideo.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD — CONNECTED TO ENGINE
// ═══════════════════════════════════════════════════════════
export default function Home() {
  const gameState = useHegemoniaStore((s) => s.gameState);
  const nations = useHegemoniaStore((s) => s.nations);
  const activeTab = useHegemoniaStore((s) => s.activeTab);
  const setActiveTab = useHegemoniaStore((s) => s.setActiveTab);
  const runNextTurn = useHegemoniaStore((s) => s.runNextTurn);
  const runNextPhase = useHegemoniaStore((s) => s.runNextPhase);
  const togglePause = useHegemoniaStore((s) => s.togglePause);
  const setSpeed = useHegemoniaStore((s) => s.setSpeed);
  const currentPhaseIndex = useHegemoniaStore((s) => s.currentPhaseIndex);
  const isStepMode = useHegemoniaStore((s) => s.isStepMode);
  const setIsStepMode = useHegemoniaStore((s) => s.setIsStepMode);

  const totalGDP = useHegemoniaStore((s) => s.totalGDP);
  const totalTrade = useHegemoniaStore((s) => s.totalTrade);
  const totalPop = useHegemoniaStore((s) => s.totalPopulation);
  const classCounts = useHegemoniaStore((s) => s.classCounts);
  const actionsLeft = useHegemoniaStore((s) => s.gameState.maxActionsPerTurn - s.gameState.playerActionsUsedThisTurn);
  const setActionTarget = useHegemoniaStore((s) => s.setActionTarget);

  // Auto-play timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speed = useHegemoniaStore((s) => s.gameState.speed);
  const isPaused = useHegemoniaStore((s) => s.gameState.isPaused);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(() => {
      runNextTurn();
    }, speed);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPaused, speed, runNextTurn]);

  const phases: Phase[] = ["production", "trade", "ideological_spread", "class_dynamics", "npc_decisions", "player_decisions", "classification_update", "metrics_update"];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-200 font-mono overflow-hidden">
      {/* HEADER */}
      <header className="h-12 bg-[#111827]/80 backdrop-blur border-b border-slate-800/50 flex items-center px-4 gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-white tracking-wide">HEGEMONÍA</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider">Engine v1.0</span>
        </div>
        <div className="h-6 w-px bg-slate-800" />
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-slate-500">Turno</span>
          <span className="text-cyan-400 font-bold">#{gameState.turn}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">Año</span>
          <span className="text-white font-bold">{gameState.year}</span>
          <span className="text-slate-500">·</span>
          <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">{gameState.lastPhase || "Listo"}</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setIsStepMode(!isStepMode)}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${isStepMode ? "bg-cyan-400/20 border border-cyan-400/40" : "bg-slate-800/50 border border-slate-700/50"}`}
            title={isStepMode ? "Paso a paso activado" : "Paso a paso desactivado"}>
            <ChevronRight className="w-3 h-3 text-cyan-400" />
          </button>
          {isStepMode ? (
            <button onClick={runNextPhase}
              className="w-7 h-7 rounded bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center hover:bg-cyan-400/20 transition-colors" title="Siguiente fase">
              <ChevronRight className="w-3 h-3 text-cyan-400" />
            </button>
          ) : (
            <button onClick={runNextTurn}
              className="w-7 h-7 rounded bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center hover:bg-cyan-400/20 transition-colors" title="Siguiente turno">
              <SkipForward className="w-3 h-3 text-cyan-400" />
            </button>
          )}
          <button onClick={togglePause}
            className="w-7 h-7 rounded bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center hover:bg-cyan-400/20 transition-colors">
            {isPaused ? <Play className="w-3 h-3 text-cyan-400 ml-0.5" /> : <Pause className="w-3 h-3 text-cyan-400" />}
          </button>
          {/* Speed buttons */}
          <button onClick={() => setSpeed(3000)} className={`text-[9px] px-1.5 py-0.5 rounded ${speed === 3000 ? "bg-cyan-400/20 text-cyan-400" : "text-slate-500 hover:text-slate-300"}`}>0.5x</button>
          <button onClick={() => setSpeed(2000)} className={`text-[9px] px-1.5 py-0.5 rounded ${speed === 2000 ? "bg-cyan-400/20 text-cyan-400" : "text-slate-500 hover:text-slate-300"}`}>1x</button>
          <button onClick={() => setSpeed(1000)} className={`text-[9px] px-1.5 py-0.5 rounded ${speed === 1000 ? "bg-cyan-400/20 text-cyan-400" : "text-slate-500 hover:text-slate-300"}`}>2x</button>
          <button onClick={() => setSpeed(400)} className={`text-[9px] px-1.5 py-0.5 rounded ${speed === 400 ? "bg-cyan-400/20 text-cyan-400" : "text-slate-500 hover:text-slate-300"}`}>5x</button>
        </div>
      </header>

      {/* Phase progress bar */}
      <div className="h-6 bg-[#0d1117] border-b border-slate-800/50 flex items-center px-4 gap-1 overflow-x-auto">
        {phases.map((p, i) => (
          <div key={p} className={`text-[9px] px-2 py-0.5 rounded whitespace-nowrap ${
            isStepMode && i < currentPhaseIndex ? "bg-cyan-400/20 text-cyan-400" :
            isStepMode && i === currentPhaseIndex ? "bg-amber-400/20 text-amber-400 animate-pulse" :
            "text-slate-600"
          }`}>
            {PHASE_LABELS[p]}
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <main className="h-[calc(100vh-4.5rem)] overflow-hidden">
        <div className="h-full grid grid-cols-12 grid-rows-12 gap-1.5 p-1.5">
          {/* Graph */}
          <div className="col-span-5 row-span-8">
            <GraphView />
          </div>

          {/* Right column */}
          <div className="col-span-7 row-span-8 flex flex-col gap-1.5">
            <div className="grid grid-cols-4 gap-1.5">
              <StatCard icon={TrendingUp} label="GDP Global" value={`${totalGDP}B`} color="#06b6d4" />
              <StatCard icon={Activity} label="Comercio" value={`${totalTrade}B`} color="#10b981" />
              <StatCard icon={Users} label="Población" value={`${totalPop}M`} color="#a855f7" />
              <StatCard icon={Crown} label="Naciones" value={`${nations.length}`} sub={`${classCounts.core}C · ${classCounts.semi}S · ${classCounts.periphery}P`} color="#f59e0b" />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-1.5 min-h-0">
              <Panel title="GDP por Nación (Top 10)" icon={TrendingUp} className="!flex !flex-col">
                <div className="flex-1 p-2 min-h-0"><GDPChart nations={nations} /></div>
              </Panel>
              <Panel title="Distribución Mundial" icon={Globe} className="!flex !flex-col">
                <div className="flex-1 p-2 min-h-0"><DistributionChart {...classCounts} /></div>
              </Panel>
            </div>
            <div className="flex-1 min-h-0">
              <div className="h-full bg-[#111827] border border-slate-800/50 rounded-lg overflow-hidden flex flex-col">
                <div className="flex border-b border-slate-800/50">
                  <button onClick={() => setActiveTab("detail")} className={`flex-1 px-4 py-2 text-[10px] uppercase tracking-wider font-mono transition-colors ${activeTab === "detail" ? "text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5" : "text-slate-500 hover:text-slate-300"}`}>🔍 Detalle</button>
                  <button onClick={() => setActiveTab("rankings")} className={`flex-1 px-4 py-2 text-[10px] uppercase tracking-wider font-mono transition-colors ${activeTab === "rankings" ? "text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5" : "text-slate-500 hover:text-slate-300"}`}>🏆 Rankings</button>
                  <button onClick={() => setActiveTab("actions")} className={`flex-1 px-4 py-2 text-[10px] uppercase tracking-wider font-mono transition-colors relative ${activeTab === "actions" ? "text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5" : "text-slate-500 hover:text-slate-300"}`}>
                    ⚡ Acciones
                    {actionsLeft > 0 && (
                      <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-cyan-400 text-[9px] text-slate-900 font-bold flex items-center justify-center">
                        {actionsLeft}
                      </span>
                    )}
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {activeTab === "detail" ? <NodeDetail /> : activeTab === "rankings" ? <RankingsPanel /> : <PlayerActionsPanel />}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom left: Events */}
          <div className="col-span-5 row-span-4">
            <Panel title="Log de Eventos" icon={Activity} className="!h-full !flex !flex-col">
              <div className="flex-1 overflow-hidden"><EventLog /></div>
            </Panel>
          </div>

          {/* Bottom right: Charts + Ideologies */}
          <div className="col-span-7 row-span-4 grid grid-cols-2 gap-1.5">
            <Panel title="Evolución Temporal del GDP" icon={TrendingUp} className="!flex !flex-col">
              <div className="flex-1 p-2 min-h-0"><TemporalChart /></div>
            </Panel>
            <Panel title="Ideologías Activas" icon={Brain} className="!flex !flex-col">
              <IdeologiesPanel />
            </Panel>
          </div>
        </div>
      </main>
    </div>
  );
}
