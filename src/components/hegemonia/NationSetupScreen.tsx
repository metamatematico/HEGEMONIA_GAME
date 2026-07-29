"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, AlertTriangle, Sparkles } from "lucide-react";
import {
  IDEOLOGY_INFO,
  IDEOLOGY_EXTENDED,
  IDEOLOGY_SYNERGIES,
  IDEOLOGY_CONFLICTS,
  TRAIT_INFO,
  FOCUS_INFO,
  CLASS_INFO,
  type Ideology,
  type CulturalTrait,
  type StrategicFocus,
  type NationNode,
} from "@/core/types";
import { createInitialNations } from "@/core/initial-data";

interface NationSetupScreenProps {
  onStart: (
    nationId: string,
    primaryIdeology: Ideology,
    secondaryIdeologies: Ideology[],
    trait: CulturalTrait,
    focus: StrategicFocus
  ) => void;
}

type Step = 0 | 1 | 2 | 3;

const STEP_LABELS = ["Nación", "Ideología", "Rasgo Cultural", "Enfoque Estratégico"];
const STEP_ICONS = ["🏴", "💭", "🎭", "🎯"];

// ─── Animated wrapper for step transitions ───
const stepVariants = {
  enter: { x: 80, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -80, opacity: 0 },
};

const stepVariantsBack = {
  enter: { x: -80, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: 80, opacity: 0 },
};

export default function NationSetupScreen({ onStart }: NationSetupScreenProps) {
  const [step, setStep] = useState<Step>(0);
  const [selectedNationId, setSelectedNationId] = useState<string | null>(null);
  const [primaryIdeology, setPrimaryIdeology] = useState<Ideology | null>(null);
  const [secondaryIdeologies, setSecondaryIdeologies] = useState<Ideology[]>([]);
  const [selectedTrait, setSelectedTrait] = useState<CulturalTrait | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<StrategicFocus | null>(null);
  const [animDirection, setAnimDirection] = useState<"forward" | "back">("forward");

  const nations = useMemo(() => createInitialNations(), []);

  const selectedNation = useMemo(
    () => nations.find((n) => n.id === selectedNationId) ?? null,
    [nations, selectedNationId]
  );

  // ─── Synergy/conflict detection ───
  const detectedSynergies = useMemo(() => {
    const allSelected = primaryIdeology
      ? [primaryIdeology, ...secondaryIdeologies]
      : [...secondaryIdeologies];
    const synergies: [string, string][] = [];
    for (const [a, b] of IDEOLOGY_SYNERGIES) {
      if (allSelected.includes(a) && allSelected.includes(b)) {
        synergies.push([a, b]);
      }
    }
    return synergies;
  }, [primaryIdeology, secondaryIdeologies]);

  const detectedConflicts = useMemo(() => {
    const allSelected = primaryIdeology
      ? [primaryIdeology, ...secondaryIdeologies]
      : [...secondaryIdeologies];
    const conflicts: [string, string][] = [];
    for (const [a, b] of IDEOLOGY_CONFLICTS) {
      if (allSelected.includes(a) && allSelected.includes(b)) {
        conflicts.push([a, b]);
      }
    }
    return conflicts;
  }, [primaryIdeology, secondaryIdeologies]);

  const canAdvance = useMemo(() => {
    if (step === 0) return selectedNationId !== null;
    if (step === 1) return primaryIdeology !== null;
    if (step === 2) return selectedTrait !== null;
    if (step === 3) return selectedFocus !== null;
    return false;
  }, [step, selectedNationId, primaryIdeology, selectedTrait, selectedFocus]);

  const goNext = useCallback(() => {
    if (step < 3) {
      setAnimDirection("forward");
      setStep((prev) => (prev + 1) as Step);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 0) {
      setAnimDirection("back");
      setStep((prev) => (prev - 1) as Step);
    }
  }, [step]);

  const handleStart = useCallback(() => {
    if (!selectedNationId || !primaryIdeology || !selectedTrait || !selectedFocus) return;
    onStart(selectedNationId, primaryIdeology, secondaryIdeologies, selectedTrait, selectedFocus);
  }, [selectedNationId, primaryIdeology, secondaryIdeologies, selectedTrait, selectedFocus, onStart]);

  const toggleSecondaryIdeology = useCallback(
    (ideo: Ideology) => {
      setSecondaryIdeologies((prev) => {
        if (prev.includes(ideo)) {
          return prev.filter((i) => i !== ideo);
        }
        if (prev.length >= 2) return prev;
        return [...prev, ideo];
      });
    },
    []
  );

  const setAsPrimary = useCallback((ideo: Ideology) => {
    setPrimaryIdeology((prev) => {
      if (prev === ideo) return prev;
      // Move old primary to secondary if not already there
      setSecondaryIdeologies((sec) => {
        const filtered = sec.filter((s) => s !== ideo);
        if (prev && !filtered.includes(prev)) {
          filtered.push(prev);
          if (filtered.length > 2) filtered.shift();
        }
        return filtered;
      });
      return ideo;
    });
  }, []);

  const variants = animDirection === "forward" ? stepVariants : stepVariantsBack;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-200 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#0a0e1a]/90 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-cyan-400 font-mono tracking-wider">
            HEGEMONÍA
          </h1>
          <span className="text-xs text-slate-500 font-mono">Configuración de Partida</span>
        </div>

        {/* Step indicator */}
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <div className="flex items-center gap-1">
            {(STEP_LABELS as string[]).map((label, i) => {
              const stepNum = i as Step;
              const isActive = step === stepNum;
              const isCompleted = step > stepNum;
              return (
                <button
                  key={i}
                  onClick={() => {
                    // Allow navigating to completed steps or the current one
                    if (isCompleted || isActive) {
                      setAnimDirection(step > stepNum ? "back" : "forward");
                      setStep(stepNum);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                      : isCompleted
                      ? "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600 cursor-pointer"
                      : "text-slate-600 border border-transparent cursor-default"
                  }`}
                >
                  <span>{STEP_ICONS[i]}</span>
                  <span className="hidden sm:inline">{label}</span>
                  {isCompleted && <Check className="w-3 h-3 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Content area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <AnimatePresence mode="wait" custom={animDirection}>
            {/* ─── STEP 0: Nation Selection ─── */}
            {step === 0 && (
              <motion.div
                key="step-0"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-bold text-white mb-1">Selecciona tu Nación</h2>
                <p className="text-sm text-slate-400 mb-6">
                  Elige la nación que guiarás hacia la hegemonía mundial.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                  {nations.map((n) => {
                    const classInfo = CLASS_INFO[n.worldClass];
                    const isSelected = n.id === selectedNationId;
                    return (
                      <motion.button
                        key={n.id}
                        onClick={() => setSelectedNationId(n.id)}
                        className={`relative p-4 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500/30"
                            : "border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50"
                        }`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        {/* Selected indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}

                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{n.flag}</span>
                          <div>
                            <p className="font-bold text-sm text-white">{n.name}</p>
                            <span
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                              style={{
                                color: classInfo.color,
                                backgroundColor: classInfo.bgColor,
                              }}
                            >
                              {classInfo.label}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-400">
                          <span>GDP: <span className="text-slate-200">{n.gdp}B</span></span>
                          <span>Pop: <span className="text-slate-200">{n.population}M</span></span>
                          <span>Mil: <span className="text-slate-200">{n.militaryPower}</span></span>
                          <span>Dip: <span className="text-slate-200">{n.diplomaticPower}</span></span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Selected nation summary */}
                {selectedNation && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-slate-900/70 border border-slate-700/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-3xl">{selectedNation.flag}</span>
                      <div>
                        <p className="font-bold text-lg text-white">{selectedNation.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span style={{ color: CLASS_INFO[selectedNation.worldClass].color }}>
                            {CLASS_INFO[selectedNation.worldClass].label}
                          </span>
                          <span>·</span>
                          <span>
                            {IDEOLOGY_INFO[selectedNation.primaryIdeology].icon}{" "}
                            {IDEOLOGY_INFO[selectedNation.primaryIdeology].name}
                          </span>
                          {selectedNation.secondaryIdeologies.length > 0 && (
                            <span>
                              +{selectedNation.secondaryIdeologies.length} secundaria(s)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ml-auto flex gap-4 text-xs text-slate-500">
                        <span>Resources: {selectedNation.resources.coal + selectedNation.resources.iron + selectedNation.resources.grain + selectedNation.resources.cotton}/400</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ─── STEP 1: Ideology Selection ─── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-bold text-white mb-1">Selecciona tu Ideología</h2>
                <p className="text-sm text-slate-400 mb-4">
                  Elige 1 primaria (golden border) y hasta 2 secundarias. Las ideologías compatibles
                  generan sinergias; las incompatibles generan conflictos.
                </p>

                {/* Synergy / Conflict warnings */}
                {detectedSynergies.length > 0 && (
                  <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        Sinergias activas ({detectedSynergies.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {detectedSynergies.map(([a, b]) => (
                        <span key={`${a}-${b}`} className="text-[11px] text-emerald-300/80 font-mono">
                          {IDEOLOGY_INFO[a as Ideology].icon} {IDEOLOGY_INFO[a as Ideology].name} +{" "}
                          {IDEOLOGY_INFO[b as Ideology].icon} {IDEOLOGY_INFO[b as Ideology].name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {detectedConflicts.length > 0 && (
                  <div className="mb-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-bold text-rose-400 font-mono">
                        Conflictos detectados ({detectedConflicts.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {detectedConflicts.map(([a, b]) => (
                        <span key={`${a}-${b}`} className="text-[11px] text-rose-300/80 font-mono">
                          {IDEOLOGY_INFO[a as Ideology].icon} {IDEOLOGY_INFO[a as Ideology].name} ⚡{" "}
                          {IDEOLOGY_INFO[b as Ideology].icon} {IDEOLOGY_INFO[b as Ideology].name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                  {(Object.entries(IDEOLOGY_EXTENDED) as [Ideology, typeof IDEOLOGY_EXTENDED[Ideology]][]).map(
                    ([key, info]) => {
                      const isPrimary = primaryIdeology === key;
                      const isSecondary = secondaryIdeologies.includes(key);
                      const isOtherPrimary = primaryIdeology !== null && !isPrimary;

                      return (
                        <motion.button
                          key={key}
                          onClick={() => {
                            if (isSecondary) {
                              toggleSecondaryIdeology(key);
                            } else {
                              setAsPrimary(key);
                            }
                          }}
                          className={`relative p-4 rounded-lg border text-left transition-all ${
                            isPrimary
                              ? "border-amber-400 bg-amber-400/10 ring-2 ring-amber-400/40"
                              : isSecondary
                              ? "border-cyan-500/50 bg-cyan-500/5 ring-1 ring-cyan-500/20"
                              : "border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50"
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          {/* Primary badge */}
                          {isPrimary && (
                            <div className="absolute top-2 right-2 text-[10px] font-bold font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                              PRIMARIA
                            </div>
                          )}
                          {isSecondary && (
                            <div className="absolute top-2 right-2 text-[10px] font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/30">
                              SECUNDARIA
                            </div>
                          )}

                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{info.icon}</span>
                            <div>
                              <p className="font-bold text-sm text-white">{info.name}</p>
                              <span
                                className="text-[10px] font-mono"
                                style={{ color: info.color }}
                              >
                                {info.era}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-400 mb-2">{info.desc}</p>

                          {/* Bonuses */}
                          <div className="space-y-1 mb-2">
                            {info.bonuses.map((bonus, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <span className="text-emerald-400 text-[10px] mt-0.5">+</span>
                                <span className="text-[11px] text-emerald-300/80">{bonus}</span>
                              </div>
                            ))}
                          </div>

                          {/* Penalties */}
                          <div className="space-y-1">
                            {info.penalties.map((penalty, i) => (
                              <div key={i} className="flex items-start gap-1.5">
                                <span className="text-rose-400 text-[10px] mt-0.5">−</span>
                                <span className="text-[11px] text-rose-300/80">{penalty}</span>
                              </div>
                            ))}
                          </div>

                          {/* Action hint */}
                          <div className="mt-3 pt-2 border-t border-slate-800/50">
                            <p className="text-[10px] text-slate-600">
                              {isPrimary
                                ? "Clic para deseleccionar"
                                : isSecondary
                                ? "Clic para quitar"
                                : isOtherPrimary
                                ? "Clic para hacer primaria (la anterior pasa a secundaria)"
                                : "Clic para hacer primaria"}
                            </p>
                          </div>
                        </motion.button>
                      );
                    }
                  )}
                </div>

                {/* Current selection summary */}
                {primaryIdeology && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-slate-900/70 border border-slate-700/50 rounded-lg"
                  >
                    <p className="text-xs text-slate-500 font-mono mb-2">Tu combinación ideológica:</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-amber-400 bg-amber-400/10 text-sm font-bold"
                        style={{ color: IDEOLOGY_INFO[primaryIdeology].color }}
                      >
                        {IDEOLOGY_INFO[primaryIdeology].icon} {IDEOLOGY_INFO[primaryIdeology].name}
                        <span className="text-[10px] font-mono text-amber-400">PRIMARIA</span>
                      </span>
                      {secondaryIdeologies.map((s) => (
                        <span
                          key={s}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan-500/50 bg-cyan-500/5 text-sm"
                          style={{ color: IDEOLOGY_INFO[s].color }}
                        >
                          {IDEOLOGY_INFO[s].icon} {IDEOLOGY_INFO[s].name}
                          <span className="text-[10px] font-mono text-cyan-400">SEC</span>
                        </span>
                      ))}
                      {secondaryIdeologies.length < 2 && (
                        <span className="text-xs text-slate-600 font-mono">
                          +{2 - secondaryIdeologies.length} secundaria(s) disponible(s)
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ─── STEP 2: Cultural Trait Selection ─── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-bold text-white mb-1">Selecciona tu Rasgo Cultural</h2>
                <p className="text-sm text-slate-400 mb-6">
                  El rasgo cultural define las acciones especiales disponibles y los bonuses pasivos
                  de tu nación.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                  {(Object.entries(TRAIT_INFO) as [CulturalTrait, typeof TRAIT_INFO[CulturalTrait]][]).map(
                    ([key, info]) => {
                      const isSelected = selectedTrait === key;
                      return (
                        <motion.button
                          key={key}
                          onClick={() => setSelectedTrait(key)}
                          className={`relative p-4 rounded-lg border text-left transition-all ${
                            isSelected
                              ? "border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500/30"
                              : "border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50"
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}

                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{info.icon}</span>
                            <div>
                              <p className="font-bold text-sm text-white">{info.name}</p>
                              <span
                                className="text-[10px] font-mono"
                                style={{ color: info.color }}
                              >
                                {key}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-400 mb-2">{info.desc}</p>

                          <div className="p-2 bg-slate-800/50 rounded">
                            <span className="text-[11px] text-emerald-300/80">
                              ✨ {info.effect}
                            </span>
                          </div>
                        </motion.button>
                      );
                    }
                  )}
                </div>
              </motion.div>
            )}

            {/* ─── STEP 3: Strategic Focus Selection ─── */}
            {step === 3 && (
              <motion.div
                key="step-3"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-xl font-bold text-white mb-1">Selecciona tu Enfoque Estratégico</h2>
                <p className="text-sm text-slate-400 mb-6">
                  Tu enfoque determina tus bonificaciones principales y debilidades. Elige con sabiduría.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                  {(Object.entries(FOCUS_INFO) as [StrategicFocus, typeof FOCUS_INFO[StrategicFocus]][]).map(
                    ([key, info]) => {
                      const isSelected = selectedFocus === key;
                      return (
                        <motion.button
                          key={key}
                          onClick={() => setSelectedFocus(key)}
                          className={`relative p-5 rounded-lg border text-left transition-all ${
                            isSelected
                              ? "border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500/30"
                              : "border-slate-800 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50"
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}

                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-3xl">{info.icon}</span>
                            <div>
                              <p className="font-bold text-base text-white">{info.name}</p>
                              <span
                                className="text-[10px] font-mono"
                                style={{ color: info.color }}
                              >
                                {key}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-slate-400 mb-3">{info.desc}</p>

                          {/* Bonuses */}
                          <div className="space-y-1.5 mb-3">
                            {info.bonuses.map((bonus, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">{bonus.stat}</span>
                                <span className="text-xs font-mono text-emerald-400">{bonus.value}</span>
                              </div>
                            ))}
                          </div>

                          {/* Penalty */}
                          <div className="p-2 bg-slate-800/50 rounded">
                            <span className="text-xs text-rose-400">
                              ⚠ {info.penalty}
                            </span>
                          </div>
                        </motion.button>
                      );
                    }
                  )}
                </div>

                {/* Final summary */}
                {selectedNation && primaryIdeology && selectedTrait && selectedFocus && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-5 bg-slate-900/70 border border-cyan-500/20 rounded-lg"
                  >
                    <p className="text-sm font-bold text-cyan-400 font-mono mb-3">
                      Resumen de tu perfil
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{selectedNation.flag}</span>
                        <div>
                          <p className="font-bold text-white">{selectedNation.name}</p>
                          <span
                            className="text-[10px] font-mono"
                            style={{ color: CLASS_INFO[selectedNation.worldClass].color }}
                          >
                            {CLASS_INFO[selectedNation.worldClass].label}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Ideología</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span style={{ color: IDEOLOGY_INFO[primaryIdeology].color }}>
                            {IDEOLOGY_INFO[primaryIdeology].icon} {IDEOLOGY_INFO[primaryIdeology].name}
                          </span>
                          {secondaryIdeologies.map((s) => (
                            <span key={s} className="text-slate-500">
                              + {IDEOLOGY_INFO[s].icon} {IDEOLOGY_INFO[s].name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Rasgo Cultural</p>
                        <span style={{ color: TRAIT_INFO[selectedTrait].color }}>
                          {TRAIT_INFO[selectedTrait].icon} {TRAIT_INFO[selectedTrait].name}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Enfoque Estratégico</p>
                        <span style={{ color: FOCUS_INFO[selectedFocus].color }}>
                          {FOCUS_INFO[selectedFocus].icon} {FOCUS_INFO[selectedFocus].name}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="sticky bottom-0 z-30 bg-[#0a0e1a]/90 backdrop-blur-md border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={goBack}
            disabled={step === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-mono transition-all ${
              step === 0
                ? "text-slate-700 cursor-not-allowed"
                : "text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Atrás
          </button>

          {step < 3 ? (
            <button
              onClick={goNext}
              disabled={!canAdvance}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-mono transition-all ${
                canAdvance
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30"
                  : "text-slate-700 cursor-not-allowed border border-slate-800"
              }`}
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={!canAdvance}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold font-mono transition-all ${
                canAdvance
                  ? "bg-cyan-500 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                  : "text-slate-700 cursor-not-allowed bg-slate-800"
              }`}
            >
              ⚡ Comenzar Partida
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
