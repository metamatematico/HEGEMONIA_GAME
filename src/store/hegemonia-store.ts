// ============================================================
// Hegemonía — Zustand Game Store
// ============================================================
// Bridges the core engine to React components

import { create } from "zustand";
import type { GameState, NationNode, TradeEdge, GameEvent, GDPSnapshot, Phase } from "@/core/types";
import { IDEOLOGY_INFO } from "@/core/types";
import { createGameState, runTurn, runPhase } from "@/core/simulation";

interface IdeologyCount {
  name: string;
  icon: string;
  color: string;
  desc: string;
  count: number;
}

interface ClassCounts {
  core: number;
  semi: number;
  periphery: number;
}

interface HegemoniaStore {
  // Core state
  gameState: GameState;

  // UI state
  selectedNationId: string | null;
  activeTab: "detail" | "rankings";
  currentPhaseIndex: number;
  isStepMode: boolean;

  // Derived values (updated whenever gameState changes)
  nations: NationNode[];
  edges: TradeEdge[];
  events: GameEvent[];
  historicalGDP: GDPSnapshot[];
  totalGDP: number;
  totalTrade: number;
  totalPopulation: number;
  classCounts: ClassCounts;
  ideologyCounts: IdeologyCount[];

  // Actions
  setSelectedNation: (id: string | null) => void;
  setActiveTab: (tab: "detail" | "rankings") => void;
  togglePause: () => void;
  setSpeed: (ms: number) => void;
  runNextTurn: () => void;
  runNextPhase: () => void;
  setIsStepMode: (step: boolean) => void;
}

function computeDerived(state: GameState) {
  const nations = state.nations;
  const edges = state.edges;
  const events = state.events;
  const historicalGDP = state.historicalGDP;

  const totalGDP = Math.round(nations.reduce((s, n) => s + n.gdp, 0) * 10) / 10;
  const totalTrade = Math.round(edges.reduce((s, e) => s + e.volume, 0) / 100) / 10;
  const totalPopulation = Math.round(nations.reduce((s, n) => s + n.population, 0));

  const classCounts: ClassCounts = {
    core: nations.filter((n) => n.worldClass === "core").length,
    semi: nations.filter((n) => n.worldClass === "semi").length,
    periphery: nations.filter((n) => n.worldClass === "periphery").length,
  };

  const ideoCounts: Record<string, number> = {};
  for (const n of nations) ideoCounts[n.ideology] = (ideoCounts[n.ideology] ?? 0) + 1;
  const ideologyCounts: IdeologyCount[] = Object.entries(IDEOLOGY_INFO).map(([key, info]) => ({
    ...info,
    count: ideoCounts[key] ?? 0,
  }));

  return { nations, edges, events, historicalGDP, totalGDP, totalTrade, totalPopulation, classCounts, ideologyCounts };
}

export const useHegemoniaStore = create<HegemoniaStore>((set, get) => {
  const initial = createGameState();
  const derived = computeDerived(initial);

  return {
    gameState: initial,
    ...derived,
    selectedNationId: "gb",
    activeTab: "detail",
    currentPhaseIndex: 0,
    isStepMode: false,

    setSelectedNation: (id) => set({ selectedNationId: id }),
    setActiveTab: (tab) => set({ activeTab: tab }),

    togglePause: () =>
      set((s) => {
        const newGS = { ...s.gameState, isPaused: !s.gameState.isPaused };
        return { gameState: newGS, ...computeDerived(newGS) };
      }),

    setSpeed: (ms) =>
      set((s) => {
        const newGS = { ...s.gameState, speed: ms };
        return { gameState: newGS, ...computeDerived(newGS) };
      }),

    runNextTurn: () =>
      set((s) => {
        // Deep copy for mutation
        const newState: GameState = {
          ...s.gameState,
          nations: s.gameState.nations.map((n) => ({ ...n, resources: { ...n.resources }, socialClasses: { ...n.socialClasses } })),
          edges: s.gameState.edges.map((e) => ({ ...e })),
          events: [...s.gameState.events],
          historicalGDP: [...s.gameState.historicalGDP],
        };
        runTurn(newState);
        return { gameState: newState, currentPhaseIndex: 0, ...computeDerived(newState) };
      }),

    runNextPhase: () =>
      set((s) => {
        const phases: Phase[] = [
          "production", "trade", "ideological_spread", "class_dynamics",
          "npc_decisions", "player_decisions", "classification_update", "metrics_update",
        ];

        const idx = s.currentPhaseIndex;
        const newState: GameState = {
          ...s.gameState,
          nations: s.gameState.nations.map((n) => ({ ...n, resources: { ...n.resources }, socialClasses: { ...n.socialClasses } })),
          edges: s.gameState.edges.map((e) => ({ ...e })),
          events: [...s.gameState.events],
          historicalGDP: [...s.gameState.historicalGDP],
        };

        if (idx < phases.length) {
          runPhase(phases[idx], newState);
        }

        const nextIdx = idx + 1;
        if (nextIdx >= phases.length) {
          newState.turn++;
          newState.year++;
          const snapshot: GDPSnapshot = { turn: newState.turn, year: newState.year, data: {} };
          for (const n of newState.nations) snapshot.data[n.id] = Math.round(n.gdp * 100) / 100;
          newState.historicalGDP.push(snapshot);
          if (newState.historicalGDP.length > 50) newState.historicalGDP = newState.historicalGDP.slice(-50);
          return { gameState: newState, currentPhaseIndex: 0, ...computeDerived(newState) };
        }

        return { gameState: newState, currentPhaseIndex: nextIdx, ...computeDerived(newState) };
      }),

    setIsStepMode: (step) => set({ isStepMode: step }),
  };
});
