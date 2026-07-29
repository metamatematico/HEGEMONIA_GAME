"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createInitialNations } from "@/core/initial-data";
import type { NationNode } from "@/core/types";

interface GameIntroScreenProps {
  onComplete: () => void;
}

// ─── Scene data ───
interface Scene {
  id: number;
  /** If 0, scene auto-advances after ms. If null, waits for click. */
  autoMs: number | null;
}

const SCENES: Scene[] = [
  { id: 0, autoMs: 2500 },   // Fade-in logo pulse
  { id: 1, autoMs: null },   // "1847" — click to continue
  { id: 2, autoMs: null },   // Title reveal
  { id: 3, autoMs: null },   // World graph + classification
  { id: 4, autoMs: null },   // Narrative: what is Hegemonía
  { id: 5, autoMs: null },   // Start prompt
];

const TOTAL_SCENES = SCENES.length;

// ─── Floating particles ───
function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 0.5,
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.3 + 0.1,
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

// ─── Typewriter ───
function TypewriterText({
  text,
  speed = 60,
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
  const hasCalledComplete = useRef(false);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed("");
    hasCalledComplete.current = false;
    const interval = setInterval(() => {
      indexRef.current++;
      if (indexRef.current <= text.length) {
        setDisplayed(text.slice(0, indexRef.current));
      } else {
        clearInterval(interval);
        if (!hasCalledComplete.current) {
          hasCalledComplete.current = true;
          onComplete?.();
        }
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

  const connections = useMemo(() => {
    const ids = nations.map((n) => n.id);
    const pairs: [string, string][] = [
      ["gb", "fr"], ["gb", "de"], ["gb", "nl"], ["gb", "be"],
      ["gb", "us"], ["gb", "in"], ["fr", "de"], ["fr", "es"],
      ["fr", "ru"], ["de", "at"], ["us", "mx"], ["cn", "jp"],
      ["ot", "fr"], ["ot", "ru"], ["in", "cn"], ["jp", "us"],
      ["br", "gb"], ["ar", "es"], ["eg", "fr"], ["eg", "ot"],
    ];
    return pairs.filter(([a, b]) => ids.includes(a) && ids.includes(b));
  }, [nations]);

  return (
    <motion.svg
      viewBox="-2 -2 104 82"
      className="w-full max-w-lg mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.5 }}
    >
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
            transition={{ duration: 1.5, delay: i * 0.06 }}
          />
        );
      })}
      {nations.map((n, i) => {
        const color = nodeColors[n.worldClass] ?? "#64748b";
        const r = Math.max(1.5, Math.min(4, n.gdp * 0.8));
        return (
          <motion.g
            key={n.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
          >
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={r}
              fill={color}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ delay: 0.3 + i * 0.05 }}
            />
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={r + 1}
              fill="none"
              stroke={color}
              strokeWidth={0.3}
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 2, delay: 0.5 + i * 0.05, repeat: Infinity }}
            />
          </motion.g>
        );
      })}
    </motion.svg>
  );
}

// ─── Progress dots ───
function SceneProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          animate={{
            backgroundColor: i <= current ? "#06b6d4" : "#334155",
            scale: i === current ? 1.3 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// GAME INTRO SCREEN — Cinematic 6-scene narrative intro
// ═══════════════════════════════════════════════════════════
export default function GameIntroScreen({ onComplete }: GameIntroScreenProps) {
  const [scene, setScene] = useState(0);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nations = useMemo(() => createInitialNations().slice(0, 20), []);

  const clearAutoTimer = useCallback(() => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  const goToScene = useCallback(
    (target: number) => {
      clearAutoTimer();
      setScene(target);
      // If the new scene has autoMs, start its timer
      const sc = SCENES[target];
      if (sc && sc.autoMs && sc.autoMs > 0) {
        autoTimerRef.current = setTimeout(() => {
          if (target + 1 < TOTAL_SCENES) {
            setScene(target + 1);
          }
        }, sc.autoMs);
      }
    },
    [clearAutoTimer]
  );

  const skipToEnd = useCallback(() => {
    clearAutoTimer();
    setScene(TOTAL_SCENES - 1);
  }, [clearAutoTimer]);

  // Initialize: scene 0 has autoMs
  useEffect(() => {
    const sc = SCENES[0];
    if (sc && sc.autoMs && sc.autoMs > 0) {
      autoTimerRef.current = setTimeout(() => {
        setScene(1);
      }, sc.autoMs);
    }
    return () => clearAutoTimer();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = useCallback(() => {
    if (scene === TOTAL_SCENES - 1) {
      onComplete();
    } else if (scene < TOTAL_SCENES - 1) {
      goToScene(scene + 1);
    }
  }, [scene, goToScene, onComplete]);

  const [yearDone, setYearDone] = useState(false);
  const handleYearDone = useCallback(() => setYearDone(true), []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none overflow-hidden"
      onClick={handleClick}
    >
      <FloatingParticles />

      {/* Skip button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          skipToEnd();
        }}
        className="absolute top-6 right-6 z-50 px-4 py-1.5 text-xs font-mono text-slate-500 border border-slate-700 rounded-full hover:border-slate-500 hover:text-slate-300 transition-colors"
      >
        Saltar intro →
      </button>

      {/* Scene progress */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
        <SceneProgress current={scene} total={TOTAL_SCENES} />
      </div>

      {/* ─── SCENE 0: Logo pulse — cinematic fade-in ─── */}
      <AnimatePresence mode="wait">
        {scene === 0 && (
          <motion.div
            key="s0"
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Central pulse */}
            <motion.div
              className="w-3 h-3 rounded-full bg-cyan-400"
              initial={{ scale: 0, opacity: 0.9 }}
              animate={{
                scale: [0, 180],
                opacity: [0.9, 0.2, 0],
              }}
              transition={{ duration: 2.2, ease: "easeOut" }}
            />
            {/* Radial rays */}
            <motion.div
              className="absolute"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 60, opacity: 0 }}
              transition={{ duration: 2, ease: "easeOut" }}
            >
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
                <div
                  key={angle}
                  className="absolute w-px h-24 bg-gradient-to-t from-cyan-400/40 to-transparent origin-bottom"
                  style={{
                    bottom: "50%",
                    left: "50%",
                    transform: `rotate(${angle}deg) translateY(-120px)`,
                  }}
                />
              ))}
            </motion.div>
            {/* Faint year watermark */}
            <motion.span
              className="absolute text-7xl md:text-9xl font-bold text-slate-900/30 tracking-[0.5em] font-mono pointer-events-none"
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 2.2, times: [0, 0.5, 1] }}
            >
              1847
            </motion.span>
          </motion.div>
        )}

        {/* ─── SCENE 1: Year + context ─── */}
        {scene === 1 && (
          <motion.div
            key="s1"
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-7xl md:text-9xl font-mono font-bold text-cyan-400 tracking-widest">
              <TypewriterText
                text="1847"
                speed={100}
                className="text-cyan-400"
                onComplete={handleYearDone}
              />
            </div>
            <AnimatePresence>
              {yearDone && (
                <motion.div
                  className="flex flex-col items-center gap-4 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                >
                  <p className="text-base md:text-lg text-slate-400 font-mono tracking-wide max-w-lg leading-relaxed">
                    El mundo se transforma. La Revolución Industrial redefine el poder.
                    Imperios colonizan continentes. El comercio global teje una red que
                    une y enfrenta a naciones enteras.
                  </p>
                  <p className="text-sm text-cyan-400/60 font-mono tracking-wider">
                    Una nueva era de hegemonía está por comenzar
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.p
              className="text-xs text-slate-600 font-mono mt-8"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Haz clic para continuar →
            </motion.p>
          </motion.div>
        )}

        {/* ─── SCENE 2: Title — HEGEMONÍA ─── */}
        {scene === 2 && (
          <motion.div
            key="s2"
            className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-[0.3em] text-white font-mono"
              initial={{ opacity: 0, letterSpacing: "1em", scale: 0.95 }}
              animate={{ opacity: 1, letterSpacing: "0.3em", scale: 1 }}
              transition={{ duration: 2.5, ease: "easeOut" }}
            >
              HEGEMONÍA
            </motion.h1>
            <motion.p
              className="text-base md:text-xl text-cyan-400/70 font-mono tracking-[0.4em]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 1.5 }}
            >
              El Grafo de los Mundos
            </motion.p>
            <motion.p
              className="text-xs text-slate-600 font-mono mt-12"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Haz clic para continuar →
            </motion.p>
          </motion.div>
        )}

        {/* ─── SCENE 3: World graph + classification system ─── */}
        {scene === 3 && (
          <motion.div
            key="s3"
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="flex items-center gap-2 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Sistema-Mundo — Teoría de Wallerstein
              </span>
            </motion.div>
            <p className="text-sm text-slate-500 font-mono max-w-md text-center leading-relaxed mb-2">
              20 naciones conectadas por 46 rutas comerciales forman un grafo
              dinámico. Cada nación es un nodo; cada ruta, una arista. El flujo
              de riqueza y poder fluye entre ellas.
            </p>
            <div className="w-full max-w-lg px-6">
              <MiniGraph nations={nations} />
            </div>
            <motion.div
              className="flex gap-8 mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span className="text-[11px] text-slate-500 font-mono">Core — Potencias industriales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-[11px] text-slate-500 font-mono">Semi-Periferia — En transición</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span className="text-[11px] text-slate-500 font-mono">Periferia — Materias primas</span>
              </div>
            </motion.div>
            <motion.p
              className="text-xs text-slate-600 font-mono mt-4"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Haz clic para continuar →
            </motion.p>
          </motion.div>
        )}

        {/* ─── SCENE 4: What is Hegemonía — full narrative ─── */}
        {scene === 4 && (
          <motion.div
            key="s4"
            className="absolute inset-0 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="w-full max-w-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 md:p-8 max-h-[80vh] overflow-y-auto heg-scroll"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <h3 className="text-lg font-bold text-cyan-400 mb-4 font-mono tracking-wide flex items-center gap-2">
                <span className="text-2xl">⚔</span>
                ¿Qué es Hegemonía?
              </h3>
              <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                <p>
                  <span className="text-cyan-400 font-semibold">Hegemonía: El Grafo de los Mundos</span> es un simulador
                  estratégico de sistemas-mundo donde encarnas una nación en el año 1847.
                  Inspirado en la teoría de Immanuel Wallerstein, el mundo se representa como
                  un grafo dinámico donde naciones compiten por recursos, dominio comercial
                  y poder geopolítico.
                </p>
                <p>
                  El mapa mundial es un <span className="text-amber-400 font-semibold">grafo interactivo</span>:
                  20 naciones conectadas por 46 rutas comerciales, alianzas diplomáticas y
                  conflictos ideológicos. Cada nodo que tocas afecta a los demás — la
                  interdependencia es la regla, no la excepción.
                </p>
                <p>
                  <span className="text-emerald-400 font-semibold">12 ideologías</span> (desde mercantilismo
                  hasta anarquismo), <span className="text-purple-400 font-semibold">12 rasgos culturales</span> (marítimo,
                  guerrero, innovador...) y <span className="text-rose-400 font-semibold">10 enfoques estratégicos</span> definen
                  tu estilo de juego. Combínalos para crear estrategias únicas.
                </p>
                <p>
                  Cada turno, la simulación avanza por <span className="text-cyan-400/80">8 fases</span>:
                  producción, comercio, expansión ideológica, dinámicas de clase, decisiones
                  de las naciones controladas por IA, tus acciones, reclasificación del
                  sistema-mundo y actualización de métricas.
                </p>
                <p>
                  Hay <span className="text-yellow-400 font-semibold">8 condiciones de victoria</span>: desde hegemonía
                  comercial hasta revolución ideológica global. Y <span className="text-red-400 font-semibold">7 condiciones
                  de derrota</span> que vigilarán cada uno de tus movimientos.
                </p>
                <p>
                  Domina el sistema-mundo antes de que el tiempo agote. ¿Conquistarás por
                  el comercio, por la fuerza militar, o por la fuerza de tus ideas?
                </p>
              </div>
              <motion.p
                className="text-xs text-slate-500 mt-5 text-center font-mono"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Haz clic para continuar →
              </motion.p>
            </motion.div>
          </motion.div>
        )}

        {/* ─── SCENE 5: Start ─── */}
        {scene === 5 && (
          <motion.div
            key="s5"
            className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="text-center"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-widest font-mono mb-3">
                HEGEMONÍA
              </h2>
              <p className="text-sm text-cyan-400/60 font-mono tracking-[0.3em]">
                El Grafo de los Mundos
              </p>
            </motion.div>

            <motion.button
              className="px-12 py-4 bg-cyan-500/20 border-2 border-cyan-400 rounded-lg text-cyan-400 font-mono text-lg tracking-wider hover:bg-cyan-500/30 hover:scale-105 transition-all"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(6,182,212,0.1)",
                  "0 0 50px rgba(6,182,212,0.3)",
                  "0 0 20px rgba(6,182,212,0.1)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, boxShadow: [
                "0 0 20px rgba(6,182,212,0.1)",
                "0 0 50px rgba(6,182,212,0.3)",
                "0 0 20px rgba(6,182,212,0.1)",
              ] }}
              transition={{ duration: 0.8, boxShadow: { duration: 2, repeat: Infinity } }}
            >
              Comenzar Partida
            </motion.button>

            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <p className="text-xs text-slate-500 font-mono">
                v3.0 — 20 naciones · 12 ideologías · 12 rasgos · 10 enfoques · 47+ acciones
              </p>
              <p className="text-xs text-slate-600 font-mono mt-1">
                Elige tu nación, define tu ideología y conquista el sistema-mundo
              </p>
              <p className="text-[10px] text-slate-700 font-mono mt-3">
                Desarrollado por <span className="text-slate-500">Leonardo Jiménez Martínez</span> & <span className="text-slate-500">Super Z</span>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
