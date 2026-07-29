"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createInitialNations } from "@/core/initial-data";
import type { NationNode } from "@/core/types";

interface GameIntroScreenProps {
  onComplete: () => void;
}

// ─── Particle effect ───
function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.4 + 0.1,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-cyan-400"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Typewriter effect ───
function TypewriterText({
  text,
  speed = 80,
  className = "",
  onComplete,
}: {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}) {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    const interval = setInterval(() => {
      indexRef.current++;
      if (indexRef.current <= text.length) {
        setDisplayed(text.slice(0, indexRef.current));
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block ml-0.5"
      >
        |
      </motion.span>
    </span>
  );
}

// ─── Mini animated graph ───
function MiniGraph({ nations }: { nations: NationNode[] }) {
  const nodeColors: Record<string, string> = {
    core: "#06b6d4",
    semi: "#f59e0b",
    periphery: "#64748b",
  };

  // Create a mini set of connections for the preview
  const connections = useMemo(() => {
    const ids = nations.map((n) => n.id);
    const pairs: [string, string][] = [
      ["gb", "fr"], ["gb", "de"], ["gb", "nl"], ["gb", "be"],
      ["gb", "us"], ["gb", "in"], ["fr", "de"], ["fr", "es"],
      ["fr", "ru"], ["de", "at"], ["us", "mx"], ["us", "gb"],
      ["in", "gb"], ["cn", "gb"], ["cn", "jp"], ["ot", "fr"],
    ];
    return pairs.filter(([a, b]) => ids.includes(a) && ids.includes(b));
  }, [nations]);

  return (
    <motion.svg
      viewBox="-2 -2 104 82"
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
      {/* Edges */}
      {connections.map(([fromId, toId], i) => {
        const from = nations.find((n) => n.id === fromId);
        const to = nations.find((n) => n.id === toId);
        if (!from || !to) return null;
        return (
          <motion.line
            key={`e-${i}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#1e293b"
            strokeWidth={0.8}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: i * 0.08 }}
          />
        );
      })}

      {/* Nodes */}
      {nations.map((n, i) => {
        const color = nodeColors[n.worldClass] ?? "#64748b";
        const r = Math.max(1.5, Math.min(4, n.gdp * 0.8));
        return (
          <motion.g
            key={n.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.06 }}
          >
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={r}
              fill={color}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.3 + i * 0.06 }}
            />
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={r + 1}
              fill="none"
              stroke={color}
              strokeWidth={0.3}
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 2, delay: 0.5 + i * 0.06, repeat: Infinity }}
            />
          </motion.g>
        );
      })}
    </motion.svg>
  );
}

// ─── Scene timing ───
const SCENE_TIMINGS = [2000, 3000, 5000, 5000, 0, 0]; // 0 = wait for click
const TOTAL_TIMED_SCENES = 4; // scenes 0-3 auto-advance

export default function GameIntroScreen({ onComplete }: GameIntroScreenProps) {
  const [scene, setScene] = useState(0);
  const [yearDone, setYearDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nations = useMemo(() => createInitialNations().slice(0, 20), []);

  const advance = useCallback(
    (target: number) => {
      if (target > TOTAL_TIMED_SCENES) {
        setScene(target);
      } else {
        setScene(target);
        timerRef.current = setTimeout(() => {
          setScene((prev) => prev + 1);
        }, SCENE_TIMINGS[target]);
      }
    },
    []
  );

  const skipTo = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setScene(5);
  }, []);

  // Start auto-advance timer for scene 0
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setScene(1);
    }, SCENE_TIMINGS[0]);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // When scene changes to 1-3, set auto-advance timers
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (scene >= 1 && scene <= 3) {
      timerRef.current = setTimeout(() => {
        setScene((prev) => prev + 1);
      }, SCENE_TIMINGS[scene]);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scene]);

  const handleYearComplete = useCallback(() => {
    setYearDone(true);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center cursor-pointer select-none overflow-hidden"
      onClick={() => {
        if (scene === 5) {
          onComplete();
        } else if (scene === 4) {
          advance(5);
        }
      }}
    >
      <FloatingParticles />

      {/* Skip button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          skipTo();
        }}
        className="absolute top-6 right-6 z-50 px-4 py-1.5 text-xs font-mono text-slate-500 border border-slate-700 rounded-full hover:border-slate-500 hover:text-slate-300 transition-colors"
      >
        Saltar intro →
      </button>

      {/* Scene content */}
      <AnimatePresence mode="wait">
        {scene === 0 && (
          <motion.div
            key="scene-0"
            className="absolute inset-0 flex items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="w-4 h-4 rounded-full bg-cyan-400"
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{
                scale: [0, 200],
                opacity: [0.8, 0.15, 0],
              }}
              transition={{ duration: 2, ease: "easeOut" }}
            />
            {/* Radial lines */}
            <motion.div
              className="absolute"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 50, opacity: 0 }}
              transition={{ duration: 1.8, ease: "easeOut" }}
            >
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <div
                  key={angle}
                  className="absolute w-px h-20 bg-cyan-400/30 origin-bottom"
                  style={{
                    bottom: "50%",
                    left: "50%",
                    transform: `rotate(${angle}deg) translateY(-100px)`,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}

        {scene === 1 && (
          <motion.div
            key="scene-1"
            className="absolute inset-0 flex flex-col items-center justify-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-6xl md:text-8xl font-mono font-bold text-cyan-400 tracking-widest">
              <TypewriterText
                text="1847"
                speed={120}
                className="text-cyan-400"
                onComplete={handleYearComplete}
              />
            </div>
            {yearDone && (
              <motion.p
                className="text-lg md:text-xl text-slate-400 font-mono tracking-wide"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
              >
                El mundo se transforma
              </motion.p>
            )}
          </motion.div>
        )}

        {scene === 2 && (
          <motion.div
            key="scene-2"
            className="absolute inset-0 flex flex-col items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-[0.3em] text-white"
              initial={{ opacity: 0, letterSpacing: "0.8em" }}
              animate={{ opacity: 1, letterSpacing: "0.3em" }}
              transition={{ duration: 2.5, ease: "easeOut" }}
            >
              HEGEMONÍA
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-cyan-400/70 font-mono tracking-[0.5em]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 2 }}
            >
              El Grafo de los Mundos
            </motion.p>
          </motion.div>
        )}

        {scene === 3 && (
          <motion.div
            key="scene-3"
            className="absolute inset-0 flex flex-col items-center justify-center gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="flex items-center gap-2 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                Core · Semi-Periferia · Periferia
              </span>
            </motion.div>
            <div className="w-full max-w-lg px-6">
              <MiniGraph nations={nations} />
            </div>
            <motion.div
              className="flex gap-6 mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-[11px] text-slate-500 font-mono">Core</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-[11px] text-slate-500 font-mono">Semi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span className="text-[11px] text-slate-500 font-mono">Periferia</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {scene === 4 && (
          <motion.div
            key="scene-4"
            className="absolute inset-0 flex items-end justify-center pb-16 md:pb-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="w-full max-w-xl mx-6 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 md:p-8"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <h3 className="text-lg font-bold text-cyan-400 mb-4 font-mono tracking-wide">
                ¿Qué es Hegemonía?
              </h3>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  <span className="text-cyan-400">Hegemonía</span> es un simulador de
                  sistemas-mundo donde encarnas una nación en 1847. Inspirado en la teoría de
                  Wallerstein, el mundo es un grafo dinámico donde naciones compiten por
                  recursos, comercio y poder.
                </p>
                <p>
                  El mundo es un <span className="text-amber-400">grafo dinámico</span>:
                  naciones conectadas por rutas comerciales, alianzas diplomáticas y conflictos
                  ideológicos. Cada nodo afecta a los demás.
                </p>
                <p>
                  <span className="text-emerald-400">12 ideologías</span>,{" "}
                  <span className="text-purple-400">12 rasgos culturales</span> y{" "}
                  <span className="text-rose-400">10 enfoques estratégicos</span> definen tu
                  camino a la victoria. Combínalos para crear estrategias únicas.
                </p>
                <p>
                  Domina el sistema-mundo antes de que el tiempo agote. ¿Conquistarás por
                  comercio, por la fuerza, o por la fuerza de tus ideas?
                </p>
              </div>
              <motion.p
                className="text-xs text-slate-500 mt-4 text-center font-mono"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Haz clic para continuar →
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {scene === 5 && (
          <motion.div
            key="scene-5"
            className="absolute inset-0 flex flex-col items-center justify-center gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-white tracking-widest font-mono"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              HEGEMONÍA
            </motion.h2>
            <motion.button
              className="px-10 py-4 bg-cyan-500/20 border-2 border-cyan-400 rounded-lg text-cyan-400 font-mono text-lg tracking-wider hover:bg-cyan-500/30 transition-colors"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(6,182,212,0.1)",
                  "0 0 40px rgba(6,182,212,0.3)",
                  "0 0 20px rgba(6,182,212,0.1)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Haz clic para comenzar
            </motion.button>
            <motion.p
              className="text-xs text-slate-600 font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              v3.0 — 20 naciones · 12 ideologías · 12 rasgos · 10 enfoques
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
