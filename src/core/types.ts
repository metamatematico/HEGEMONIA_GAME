// ============================================================
// Hegemonía Core Engine — Type Definitions
// ============================================================

/** World-systems class based on Wallerstein's theory */
export type WorldClass = "core" | "semi" | "periphery";

/** The 6 ideologies, each with unique graph mechanics */
export type Ideology =
  | "mercantilism"
  | "liberalism"
  | "marxism"
  | "nationalism"
  | "conservatism"
  | "absolutism";

/** Trade flow type */
export type TradeType = "raw" | "manufactured" | "luxury";

/** Event type for the game log */
export type EventType = "trade" | "war" | "revolution" | "crisis" | "diplomacy" | "ideology";

/** Social classes within a nation */
export interface SocialClasses {
  elite: number;     // % 0-100
  middle: number;    // % 0-100
  working: number;   // % 0-100
  peasant: number;   // % 0-100
}

/** Resource levels of a nation */
export interface Resources {
  coal: number;      // 0-100
  iron: number;      // 0-100
  grain: number;     // 0-100
  cotton: number;    // 0-100
}

/** A nation node in the world graph */
export interface NationNode {
  id: string;
  name: string;
  flag: string;
  worldClass: WorldClass;
  ideology: Ideology;

  // Economy
  gdp: number;           // billions (arbitrary scale)
  population: number;    // millions
  tradeBalance: number;  // surplus(+)/deficit(-) millions

  // Power dimensions (0-100)
  militaryPower: number;
  culturalPower: number;
  diplomaticPower: number;

  // Graph position (0-100 for rendering)
  x: number;
  y: number;

  // Graph metrics (computed each turn)
  eigenvectorCentrality: number;  // 0-1
  betweennessCentrality: number;  // 0-1

  // Resources
  resources: Resources;

  // Social structure
  socialClasses: SocialClasses;

  // State for NPC AI
  stability: number;      // 0-100, affects revolution risk
  unrest: number;         // 0-100, rises when stability drops
  industrialization: number; // 0-100, tech progress

  // Player control
  isPlayer: boolean;
}

/** A trade edge in the world graph */
export interface TradeEdge {
  id: string;
  from: string;     // nation id
  to: string;       // nation id
  volume: number;   // trade volume in millions
  type: TradeType;
  tariffRate: number; // 0-1, affected by ideology
}

/** An event in the game log */
export interface GameEvent {
  id: string;
  turn: number;
  text: string;
  type: EventType;
  nationId?: string;
}

/** Historical GDP snapshot for charts */
export interface GDPSnapshot {
  turn: number;
  year: number;
  data: Record<string, number>; // nationId -> GDP
}

/** Complete game state */
export interface GameState {
  turn: number;
  year: number;
  nations: NationNode[];
  edges: TradeEdge[];
  events: GameEvent[];
  historicalGDP: GDPSnapshot[];
  isPaused: boolean;
  speed: number; // ms per turn
  lastPhase: string; // for UI display
}

/** NPC action decision */
export interface NPCAction {
  nationId: string;
  action: string;
  targetId?: string;
  utility: number;
  reasoning: string;
}

/** Phase of the game loop */
export type Phase =
  | "production"
  | "trade"
  | "ideological_spread"
  | "class_dynamics"
  | "npc_decisions"
  | "player_decisions"
  | "classification_update"
  | "metrics_update";

export const PHASE_LABELS: Record<Phase, string> = {
  production: "① Producción",
  trade: "② Comercio",
  ideological_spread: "③ Spread Ideológico",
  class_dynamics: "④ Dinámica de Clases",
  npc_decisions: "⑤ Decisiones NPC",
  player_decisions: "⑥ Decisiones Jugador",
  classification_update: "⑦ Clasificación",
  metrics_update: "⑧ Métricas",
};

/** Ideology display info */
export const IDEOLOGY_INFO: Record<Ideology, { name: string; icon: string; color: string; desc: string }> = {
  mercantilism:  { name: "Mercantilismo",  icon: "💰", color: "#f59e0b", desc: "Proteccionismo + acumulación de riqueza" },
  liberalism:    { name: "Liberalismo",    icon: "⚖️", color: "#06b6d4", desc: "Libre comercio + competencia de mercado" },
  marxism:       { name: "Socialismo",     icon: "✊", color: "#10b981", desc: "Clase trabajadora + propiedad colectiva" },
  nationalism:   { name: "Nacionalismo",   icon: "🏛️", color: "#ef4444", desc: "Unificación nacional + poder estatal" },
  conservatism:  { name: "Conservadurismo", icon: "👑", color: "#a855f7", desc: "Tradición + orden jerárquico" },
  absolutism:    { name: "Absolutismo",    icon: "🏰", color: "#64748b", desc: "Poder centralizado + control total" },
};

/** World-class display info */
export const CLASS_INFO: Record<WorldClass, { label: string; color: string; bgColor: string }> = {
  core:       { label: "Core",           color: "#06b6d4", bgColor: "rgba(6,182,212,0.15)" },
  semi:       { label: "Semi-Periferia",  color: "#f59e0b", bgColor: "rgba(245,158,11,0.15)" },
  periphery:  { label: "Periferia",       color: "#64748b", bgColor: "rgba(100,116,139,0.15)" },
};
