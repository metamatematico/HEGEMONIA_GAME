"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { nations, tradeFlows, classColor, type Nation } from "@/lib/hegemonia-data";

interface GraphViewProps {
  selectedNation: string | null;
  onSelectNation: (id: string | null) => void;
}

const VIEW_W = 100;
const VIEW_H = 80;
const MIN_NODE_R = 4;
const MAX_NODE_R = 10;

function nodeRadius(n: Nation): number {
  const gdpMin = 0.1;
  const gdpMax = 4.5;
  const t = Math.max(0, Math.min(1, (n.gdp - gdpMin) / (gdpMax - gdpMin)));
  return MIN_NODE_R + t * (MAX_NODE_R - MIN_NODE_R);
}

function edgeWidth(vol: number): number {
  return Math.max(0.4, Math.min(3, vol / 100));
}

export default function GraphView({ selectedNation, onSelectNation }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [viewBox, setViewBox] = useState(`${-5} ${-5} ${VIEW_W + 10} ${VIEW_H + 10}`);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [vbStart, setVbStart] = useState({ x: -5, y: -5 });

  const maxVolume = Math.max(...tradeFlows.map((f) => f.volume));

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * (VIEW_W + 10) + parseFloat(viewBox.split(" ")[0]);
    const my = ((e.clientY - rect.top) / rect.height) * (VIEW_H + 10) + parseFloat(viewBox.split(" ")[1]);

    const [vx, vy, vw, vh] = viewBox.split(" ").map(Number);
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    const newVw = Math.max(30, Math.min(120, vw * factor));
    const newVh = Math.max(24, Math.min(96, vh * factor));

    const ratio = newVw / vw;
    const nvx = mx - (mx - vx) * ratio;
    const nvy = my - (my - vy) * ratio;
    setViewBox(`${nvx.toFixed(1)} ${nvy.toFixed(1)} ${newVw.toFixed(1)} ${newVh.toFixed(1)}`);
  }, [viewBox]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as Element).closest(".graph-node")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setVbStart({ x: parseFloat(viewBox.split(" ")[0]), y: parseFloat(viewBox.split(" ")[1]) });
  }, [viewBox]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = (VIEW_W + 10) / rect.width;
    const scaleY = (VIEW_H + 10) / rect.height;
    const dx = (e.clientX - dragStart.x) * scaleX;
    const dy = (e.clientY - dragStart.y) * scaleY;
    const [, , vw, vh] = viewBox.split(" ").map(Number);
    setViewBox(`${(vbStart.x - dx).toFixed(1)} ${(vbStart.y - dy).toFixed(1)} ${vw} ${vh}`);
  }, [isDragging, dragStart, vbStart, viewBox]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Highlighted edges (connected to selected or hovered node)
  const highlightNode = selectedNation || hoveredNode;
  const highlightedEdges = highlightNode
    ? tradeFlows.filter((f) => f.from === highlightNode || f.to === highlightNode)
    : [];

  return (
    <div className="relative w-full h-full min-h-[400px] bg-[#070b14] rounded-lg overflow-hidden border border-slate-800/50">
      {/* Grid pattern background */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04] pointer-events-none">
        <defs>
          <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
            <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#06b6d4" strokeWidth="0.15" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Title */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="text-xs font-mono text-cyan-400/70 uppercase tracking-wider">Grafo Mundial</span>
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 bg-black/40 backdrop-blur-sm rounded px-3 py-2 border border-slate-800/30">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span className="text-[10px] text-slate-400">Core</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="text-[10px] text-slate-400">Semi-Periferia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          <span className="text-[10px] text-slate-400">Periferia</span>
        </div>
      </div>

      {/* Main SVG */}
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          if (!(e.target as Element).closest(".graph-node")) {
            onSelectNation(null);
          }
        }}
        style={{ touchAction: "none" }}
      >
        <defs>
          {/* Glow filters */}
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feFlood floodColor="#06b6d4" floodOpacity="0.6" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feFlood floodColor="#f59e0b" floodOpacity="0.5" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-selected" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#06b6d4" floodOpacity="0.8" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {tradeFlows.map((flow, i) => {
          const from = nations.find((n) => n.id === flow.from);
          const to = nations.find((n) => n.id === flow.to);
          if (!from || !to) return null;

          const isHighlighted = highlightNode && (flow.from === highlightNode || flow.to === highlightNode);
          const opacity = highlightNode ? (isHighlighted ? 0.7 : 0.05) : 0.15 + (flow.volume / maxVolume) * 0.25;

          const strokeColor = isHighlighted
            ? flow.type === "raw" ? "#10b981" : flow.type === "manufactured" ? "#06b6d4" : "#a855f7"
            : "#334155";

          return (
            <line
              key={i}
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              stroke={strokeColor}
              strokeWidth={isHighlighted ? edgeWidth(flow.volume) * 1.5 : edgeWidth(flow.volume)}
              opacity={opacity}
              strokeLinecap="round"
            >
              {isHighlighted && (
                <animate
                  attributeName="stroke-dasharray"
                  values="2 6;6 2;2 6"
                  dur="2s"
                  repeatCount="indefinite"
                />
              )}
            </line>
          );
        })}

        {/* Nodes */}
        {nations.map((n) => {
          const r = nodeRadius(n);
          const isSelected = n.id === selectedNation;
          const isHovered = n.id === hoveredNode;
          const isConnected = highlightNode && highlightedEdges.some((e) => e.from === n.id || e.to === n.id);
          const color = classColor(n.class);
          const dimmed = highlightNode && !isSelected && !isConnected && n.id !== highlightNode;

          return (
            <g
              key={n.id}
              className="graph-node"
              transform={`translate(${n.x}, ${n.y})`}
              opacity={dimmed ? 0.15 : 1}
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectNation(isSelected ? null : n.id);
              }}
              onMouseEnter={() => setHoveredNode(n.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Outer glow ring for selected */}
              {isSelected && (
                <circle r={r + 4} fill="none" stroke={color} strokeWidth="1.5" opacity="0.4">
                  <animate attributeName="r" values={`${r + 3};${r + 6};${r + 3}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Node body */}
              <circle
                r={r}
                fill={color}
                opacity={isSelected || isHovered ? 1 : 0.75}
                filter={isSelected ? "url(#glow-selected)" : n.class === "core" ? "url(#glow-cyan)" : n.class === "semi" ? "url(#glow-amber)" : undefined}
                className="transition-all duration-200"
              />

              {/* Inner bright core */}
              <circle r={r * 0.4} fill="white" opacity={isSelected ? 0.6 : 0.3} />

              {/* Label */}
              <text
                y={r + 3}
                textAnchor="middle"
                fill={dimmed ? "#475569" : isSelected ? "#e2e8f0" : "#94a3b8"}
                fontSize="1.8"
                fontFamily="monospace"
                fontWeight={isSelected ? 600 : 400}
              >
                {n.flag} {n.name.length > 12 ? n.name.slice(0, 10) + "…" : n.name}
              </text>

              {/* Tooltip on hover */}
              {isHovered && !isSelected && (
                <g transform={`translate(0, ${-r - 6})`}>
                  <rect
                    x={-30} y={-14} width={60} height={14}
                    rx={3}
                    fill="rgba(15,23,42,0.9)"
                    stroke={color}
                    strokeWidth={0.5}
                  />
                  <text
                    textAnchor="middle" y={-4}
                    fill="#e2e8f0"
                    fontSize="2.2"
                    fontFamily="monospace"
                    fontWeight={600}
                  >
                    GDP: {n.gdp}B
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Zoom hint */}
      <div className="absolute bottom-3 left-4 text-[10px] text-slate-600 font-mono">
        Scroll: zoom · Drag: pan · Click: select
      </div>
    </div>
  );
}
