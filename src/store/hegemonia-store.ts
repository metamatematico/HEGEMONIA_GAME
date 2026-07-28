// ============================================================
// Hegemonía — Zustand Game Store
// ============================================================
// Bridges the core engine to React components

import { create } from "zustand";
import type {
  GameState, NationNode, TradeEdge, GameEvent, GDPSnapshot, Phase,
  PlayerActionType, PlayerAction,
} from "@/core/types";
import { IDEOLOGY_INFO } from "@/core/types";
import { createGameState, runTurn, runPhase } from "@/core/simulation";
import { queueAction as coreQueueAction } from "@/core/player-actions";

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
  activeTab: "detail" | "rankings" | "actions";
  currentPhaseIndex: number;
  isStepMode: boolean;
  actionTargetId: string | null;
  lastActionResult: { success: boolean; reason?: string } | null;

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
  playerActionQueue: PlayerAction[];
  playerCooldowns: GameState["playerCooldowns"];

  // Actions
  setSelectedNation: (id: string | null) => void;
  setActiveTab: (tab: "detail" | "rankings" | "actions") => void;
  togglePause: () => void;
  setSpeed: (ms: number) => void;
  runNextTurn: () => void;
  runNextPhase: () => void;
  setIsStepMode: (step: boolean) => void;
  queuePlayerAction: (type: PlayerActionType, targetId?: string) => void;
  setActionTarget: (id: string | null) => void;
  clearActionResult: () => void;
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

  return {
    nations, edges, events, historicalGDP,
    totalGDP, totalTrade, totalPopulation,
    classCounts, ideologyCounts,
    playerActionQueue: state.playerActionQueue,
    playerCooldowns: state.playerCooldowns,
  };
}

function deepCopy(state: GameState): GameState {
  return {
    ...state,
    nations: state.nations.map((n) => ({
      ...n,
      resources: { ...n.resources },
      socialClasses: { ...n.socialClasses },
    })),
    edges: state.edges.map((e) => ({ ...e })),
    events: [...state.events],
    historicalGDP: [...state.historicalGDP],
    playerActionQueue: [...state.playerActionQueue],
    playerCooldowns: { ...state.playerCooldowns },
  };
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
    actionTargetId: null,
    lastActionResult: null,

    setSelectedNation: (id) => set({ selectedNationId: id }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setActionTarget: (id) => set({ actionTargetId: id }),
    clearActionResult: () => set({ lastActionResult: null }),

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
        const newState = deepCopy(s.gameState);
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
        const newState = deepCopy(s.gameState);

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

    queuePlayerAction: (type, targetId) =>
      set((s) => {
        const newState = deepCopy(s.gameState);
        const result = coreQueueAction(type, targetId, newState);
        if (result.success) {
          newState.playerActionsUsedThisTurn++;
        }
        return {
          gameState: newState,
          ...computeDerived(newState),
          lastActionResult: result,
        };
      }),

    setIsStepMode: (step) => set({ isStepMode: step }),
  };
});
