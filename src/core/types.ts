// ============================================================
// Hegemonía Core Engine — Type Definitions v3.0
// ============================================================
// Expanded: 12 ideologies (multi-select), 12 cultural traits,
// 10 strategic focuses, victory/defeat conditions

/** World-systems class based on Wallerstein's theory */
export type WorldClass = "core" | "semi" | "periphery";

/** The 12 ideologies — each reshapes the graph differently */
export type Ideology =
  // ─── Original 6 ───
  | "mercantilism"     // State-protected trade, accumulation
  | "liberalism"        // Free markets, constitutional government
  | "marxism"           // Workers' revolution, collective ownership
  | "nationalism"       // National unity, military strength
  | "conservatism"      // Tradition, hierarchy, order
  | "absolutism"        // Absolute monarchy, centralized power
  // ─── New 6 ───
  | "imperialism"       // Colonial empire, extraction from periphery
  | "constitutionalism"// Constitutional monarchy, balance of powers
  | "progressivism"     // Social reform, gradual modernization
  | "anarchism"         // Anti-state, direct action, mutual aid
  | "theocracy"         // Religious law, divine mandate
  | "syndicalism";      // Trade unions, workers' self-management

/** Ideology synergy/conflict pairs */
export const IDEOLOGY_SYNERGIES: [Ideology, Ideology][] = [
  ["mercantilism", "imperialism"],
  ["liberalism", "constitutionalism"],
  ["liberalism", "progressivism"],
  ["marxism", "syndicalism"],
  ["marxism", "anarchism"],
  ["nationalism", "imperialism"],
  ["conservatism", "theocracy"],
  ["conservatism", "constitutionalism"],
  ["progressivism", "syndicalism"],
  ["anarchism", "syndicalism"],
  ["absolutism", "theocracy"],
  ["absolutism", "imperialism"],
  ["mercantilism", "conservatism"],
  ["liberalism", "anarchism"],
  ["nationalism", "conservatism"],
  ["progressivism", "constitutionalism"],
];

export const IDEOLOGY_CONFLICTS: [Ideology, Ideology][] = [
  ["liberalism", "absolutism"],
  ["marxism", "mercantilism"],
  ["marxism", "conservatism"],
  ["anarchism", "absolutism"],
  ["anarchism", "imperialism"],
  ["liberalism", "theocracy"],
  ["nationalism", "anarchism"],
  ["syndicalism", "absolutism"],
  ["progressivism", "absolutism"],
  ["progressivism", "theocracy"],
  ["constitutionalism", "absolutism"],
  ["marxism", "nationalism"],
  ["imperialism", "anarchism"],
  ["theocracy", "liberalism"],
  ["conservatism", "anarchism"],
];

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
  primaryIdeology: Ideology;
  secondaryIdeologies: Ideology[];  // 0-2 additional ideologies (coalitions)

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

  // Cultural trait (NPC-inferred or player-chosen)
  culturalTrait: CulturalTrait;
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

// ─── Victory / Defeat ────────────────────────────────────────

export type VictoryCondition =
  | "dominación_económica"
  | "hegemonía_total"
  | "victoria_ideológica"
  | "supremacía_científica"
  | "imperio_comercial"
  | "hegemonía_diplomática"
  | "dominación_cultural"
  | "imperio_colonial";

export type DefeatCondition =
  | "revolución_interna"
  | "ruina_económica"
  | "colapso_periférico"
  | "conquista_militar"
  | "aislamiento_comercial"
  | "sobreextensión"
  | "crisis_de_deuda";

export interface GameOverResult {
  type: "victory" | "defeat";
  condition: string;
  reason: string;
  score: number;
  rank: number;
  totalNations: number;
  turn: number;
  year: number;
}

// ─── Game Mode & Difficulty ──────────────────────────────────

export type GameMode = "ai" | "human";
export type AIDifficulty = "easy" | "normal" | "hard" | "expert";

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

  // Game mode
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;

  // Player state
  playerActionQueue: PlayerAction[];
  playerCooldowns: CooldownMap;
  playerActionsUsedThisTurn: number;
  maxActionsPerTurn: number;

  // Game Over
  gameOver: GameOverResult | null;

  // Player Profile
  playerProfile: PlayerProfile | null;

  // Stability tracking for defeat conditions
  lowStabilityTurns: number;
  zeroTradeTurns: number;
  peripheryTurns: number;
  lowMilitaryTurns: number;

  // NPC AI tracking
  lastNPCActions: NPCAction[];
}

/** NPC action decision */
export interface NPCAction {
  nationId: string;
  action: string;
  targetId?: string;
  utility: number;
  reasoning: string;
  turn?: number;
}

// ─── Player Action System ─────────────────────────────────────

export type PlayerActionType =
  // ─── BASE (10) ───
  | "invest_industry"
  | "build_military"
  | "lower_tariffs"
  | "raise_tariffs"
  | "seek_trade"
  | "spread_ideology"
  | "suppress_unrest"
  | "build_infrastructure"
  | "diplomatic_pressure"
  | "colonial_expansion"
  // ─── SPIRITUAL (trait) ───
  | "evangelize"
  | "religious_festival"
  | "missionary_schools"
  | "holy_war"
  | "spiritual_retreat"
  | "pilgrimage_routes"
  // ─── MARITIME (trait) ───
  | "naval_expedition"
  | "blockade"
  | "naval_base"
  | "pirate_suppression"
  | "overseas_colony"
  // ─── INNOVATIVE (trait) ───
  | "fund_research"
  | "patent_office"
  | "technical_exchange"
  | "industrial_espionage"
  | "universities"
  // ─── WARLIKE (trait) ───
  | "declare_war"
  | "fortify_borders"
  | "military_alliance"
  | "coercion"
  | "scorched_earth"
  // ─── MERCANTILE (trait) ───
  | "trade_monopoly"
  | "merchant_guilds"
  | "free_port"
  | "tariff_war"
  | "smugglers"
  // ─── EXPANSIONIST (trait) ───
  | "territorial_claim"
  | "manifest_destiny"
  | "settlers"
  | "resource_extraction"
  | "treaty_annexation"
  // ─── IDEOLOGY-SPECIFIC (1 per ideology) ───
  | "redistribute_wealth"
  | "propaganda_campaign"
  | "traditional_reforms"
  | "royal_decree"
  | "free_trade_agreement"
  | "mercantilist_monopoly"
  | "colonial_dominion"
  | "constitutional_reform"
  | "social_programs"
  | "commune uprising"
  | "divine_proclamation"
  | "general_strike";

export interface PlayerAction {
  id: string;
  type: PlayerActionType;
  targetId?: string;
  queuedTurn: number;
}

export type CooldownMap = Partial<Record<PlayerActionType, number>>;

export type ActionOrigin = "base" | "trait" | "ideology";

export interface PlayerActionMeta {
  type: PlayerActionType;
  label: string;
  icon: string;
  description: string;
  cost: number;
  cooldown: number;
  requiresTarget: boolean;
  category: "economy" | "military" | "diplomacy" | "ideology" | "control"
    | "spiritual" | "naval" | "science" | "conquest" | "trade" | "expansion";
  minStability?: number;
  ideologyBonus?: Ideology[];
  origin: ActionOrigin;
  traitRequired?: CulturalTrait;
  ideologyRequired?: Ideology;
  categoryLabel: string;
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

// ─── Ideology Display Info (12) ──────────────────────────────

export const IDEOLOGY_INFO: Record<Ideology, { name: string; icon: string; color: string; desc: string; era: string }> = {
  mercantilism:       { name: "Mercantilismo",       icon: "💰", color: "#f59e0b", desc: "Proteccionismo y acumulación de riqueza",                    era: "XVI-XIX" },
  liberalism:         { name: "Liberalismo",         icon: "⚖️", color: "#06b6d4", desc: "Libre comercio y competencia de mercado",                   era: "XVIII-XX" },
  marxism:            { name: "Socialismo",          icon: "✊", color: "#10b981", desc: "Clase trabajadora y propiedad colectiva",                    era: "XIX-XX" },
  nationalism:        { name: "Nacionalismo",        icon: "🏛️", color: "#ef4444", desc: "Unificación nacional y poder estatal",                     era: "XIX-XX" },
  conservatism:       { name: "Conservadurismo",     icon: "👑", color: "#a855f7", desc: "Tradición, orden jerárquico y estabilidad",                   era: "XVIII-XX" },
  absolutism:         { name: "Absolutismo",         icon: "🏰", color: "#64748b", desc: "Poder centralizado y control total",                        era: "XVI-XIX" },
  imperialism:        { name: "Imperialismo",        icon: "🏴", color: "#dc2626", desc: "Dominio colonial y extracción de periferias",               era: "XIX-XX" },
  constitutionalism:  { name: "Constitucionalismo", icon: "📜", color: "#8b5cf6", desc: "Monarquía constitucional, equilibrio de poderes",            era: "XIX-XX" },
  progressivism:      { name: "Progresismo",        icon: "🔧", color: "#14b8a6", desc: "Reforma social y modernización gradual",                    era: "XIX-XX" },
  anarchism:          { name: "Anarquismo",          icon: "🔥", color: "#f97316", desc: "Anti-estado, acción directa y ayuda mutua",                era: "XIX-XX" },
  theocracy:          { name: "Teocracia",           icon: "☪️", color: "#eab308", desc: "Gobierno religioso y mandato divino",                      era: "varios" },
  syndicalism:        { name: "Sindicalismo",        icon: "⚒️", color: "#84cc16", desc: "Sindicatos y autogestión obrera",                         era: "XIX-XX" },
};

// ─── World-class display info ────────────────────────────────

export const CLASS_INFO: Record<WorldClass, { label: string; color: string; bgColor: string }> = {
  core:       { label: "Core",           color: "#06b6d4", bgColor: "rgba(6,182,212,0.15)" },
  semi:       { label: "Semi-Periferia",  color: "#f59e0b", bgColor: "rgba(245,158,11,0.15)" },
  periphery:  { label: "Periferia",       color: "#64748b", bgColor: "rgba(100,116,139,0.15)" },
};

// ─── Player Profile ────────────────────────────────────────────

export type StrategicFocus =
  | "industrialist"   // GDP + industrialization focus
  | "militarist"      // Military + conquest
  | "diplomat"         // Trade + alliances
  | "culturalist"      // Ideology + cultural spread
  | "balanced"         // No particular bias
  | "colonialist"      // Extraction + expansion
  | "scientist"        // Research + innovation
  | "merchant"         // Pure trade maximization
  | "revolutionary"    // Spread ideology + destabilize rivals
  | "isolationist";    // Defense + self-sufficiency

export type CulturalTrait =
  | "seafaring"        // +trade range, bonus to seek_trade
  | "innovative"       // +industrialization speed
  | "warlike"          // +military power growth
  | "mercantile"       // +GDP from trade routes
  | "spiritual"        // +stability, -unrest
  | "expansionist"     // +colonial efficiency
  | "agrarian"         // +food production, population growth
  | "industrial"       // +manufacturing efficiency
  | "scholarly"        // +cultural power, research speed
  | "nomadic"          // +military mobility, border flexibility
  | "diplomatic"       // +diplomatic power, alliance bonus
  | "fortified";       // +defense, stability under siege

export type GameDifficulty = "facil" | "normal" | "dificil" | "hegemon";

export type OpponentType = "ia" | "humano";

export const DIFFICULTY_INFO: Record<GameDifficulty, {
  label: string; icon: string; color: string; desc: string;
  npcBonus: number; playerBonus: number; npcAggression: number;
}> = {
  facil: {
    label: "Fácil", icon: "🟢", color: "#10b981",
    desc: "NPCs con bonuses reducidos. Ideal para aprender.",
    npcBonus: 0.6, playerBonus: 1.3, npcAggression: 0.3,
  },
  normal: {
    label: "Normal", icon: "🟡", color: "#f59e0b",
    desc: "Equilibrio justo. Todos juegan con las mismas reglas.",
    npcBonus: 1.0, playerBonus: 1.0, npcAggression: 0.5,
  },
  dificil: {
    label: "Difícil", icon: "🔴", color: "#ef4444",
    desc: "NPCs más agresivos y eficientes. Desafío real.",
    npcBonus: 1.3, playerBonus: 1.0, npcAggression: 0.75,
  },
  hegemon: {
    label: "Hegemón", icon: "💀", color: "#a855f7",
    desc: "Máxima dificultad. NPCs optimizados sin piedad.",
    npcBonus: 1.5, playerBonus: 0.85, npcAggression: 0.95,
  },
};

export const OPPONENT_INFO: Record<OpponentType, {
  label: string; icon: string; color: string; desc: string;
}> = {
  ia: {
    label: "vs IA", icon: "🤖", color: "#06b6d4",
    desc: "Todas las demás naciones son controladas por inteligencia artificial.",
  },
  humano: {
    label: "vs Humano", icon: "👤", color: "#f59e0b",
    desc: "Modo hot-seat: dos jugadores humanos se turnan en el mismo dispositivo.",
  },
};

export interface PlayerProfile {
  nationId: string;
  primaryIdeology: Ideology;
  secondaryIdeologies: Ideology[];  // 0-2 more
  focus: StrategicFocus;
  trait: CulturalTrait;
  difficulty: GameDifficulty;
  opponentType: OpponentType;
}

// ─── Extended Info for Setup Screen ──────────────────────────

export const IDEOLOGY_EXTENDED: Record<Ideology, {
  name: string; icon: string; color: string; desc: string;
  philosophy: string; economicModel: string; militaryPolicy: string;
  bonuses: string[]; penalties: string[];
  synergies: Ideology[]; conflicts: Ideology[];
}> = {
  mercantilism: {
    name: "Mercantilismo", icon: "💰", color: "#f59e0b",
    desc: "Proteccionismo y acumulación de riqueza nacional",
    philosophy: "La riqueza se mide por reservas de oro y balanza comercial positiva.",
    economicModel: "Aranceles altos, exportaciones maximizadas, importaciones minimizadas.",
    militaryPolicy: "Fuerza naval para proteger rutas comerciales.",
    bonuses: ["+20% efectividad de aranceles", "+15% GDP de exportaciones"],
    penalties: ["-10% crecimiento por falta de competencia"],
    synergies: ["imperialism", "conservatism"], conflicts: ["marxism", "anarchism"],
  },
  liberalism: {
    name: "Liberalismo", icon: "⚖️", color: "#06b6d4",
    desc: "Libre comercio y competencia de mercado",
    philosophy: "El libre intercambio enriquece a todas las naciones.",
    economicModel: "Aranceles bajos, libre competencia, inversiones extranjeras.",
    militaryPolicy: "Ejército profesional limitado; alianzas como disuasión.",
    bonuses: ["+25% crecimiento de rutas comerciales", "+10% GDP por comercio"],
    penalties: ["-15% efectividad de aranceles"],
    synergies: ["constitutionalism", "progressivism", "anarchism"], conflicts: ["absolutism", "theocracy"],
  },
  marxism: {
    name: "Socialismo", icon: "✊", color: "#10b981",
    desc: "Clase trabajadora y propiedad colectiva",
    philosophy: "La lucha de clases es el motor de la historia.",
    economicModel: "Control estatal de industrias clave, redistribución.",
    militaryPolicy: "Ejército popular; apoyo de las clases trabajadoras.",
    bonuses: ["+30% estabilidad si clases trabajadoras fuertes", "+20% clase obrera"],
    penalties: ["-10% GDP por ineficiencia estatal"],
    synergies: ["syndicalism", "anarchism", "progressivism"], conflicts: ["mercantilism", "conservatism", "nationalism"],
  },
  nationalism: {
    name: "Nacionalismo", icon: "🏛️", color: "#ef4444",
    desc: "Unificación nacional y poder estatal",
    philosophy: "La nación es la unidad política suprema.",
    economicModel: "Desarrollo industrial orientado por el estado.",
    militaryPolicy: "Ejército fuerte como prioridad absoluta.",
    bonuses: ["+20% poder militar base", "+15% fuerza bélica"],
    penalties: ["-10% poder diplomático"],
    synergies: ["imperialism", "conservatism", "absolutism"], conflicts: ["anarchism", "marxism"],
  },
  conservatism: {
    name: "Conservadurismo", icon: "👑", color: "#a855f7",
    desc: "Tradición, orden jerárquico y estabilidad",
    philosophy: "El cambio gradual preserva el orden social.",
    economicModel: "Economía mixta con énfasis en lo establecido.",
    militaryPolicy: "Fuerzas armadas tradicionales; defensa del orden.",
    bonuses: ["+25% estabilidad base", "+20% resistencia a revoluciones"],
    penalties: ["-15% velocidad de industrialización"],
    synergies: ["theocracy", "constitutionalism", "mercantilism", "nationalism"], conflicts: ["anarchism", "marxism", "progressivism"],
  },
  absolutism: {
    name: "Absolutismo", icon: "🏰", color: "#64748b",
    desc: "Poder centralizado y control total",
    philosophy: "El poder absoluto del gobernante es necesario.",
    economicModel: "Control total del estado sobre la economía.",
    militaryPolicy: "Ejército leal al soberano; poder coercitivo máximo.",
    bonuses: ["+3 acciones por turno", "+20% poder diplomático"],
    penalties: ["-30% estabilidad base"],
    synergies: ["theocracy", "imperialism"], conflicts: ["liberalism", "anarchism", "constitutionalism", "progressivism"],
  },
  imperialism: {
    name: "Imperialismo", icon: "🏴", color: "#dc2626",
    desc: "Dominio colonial y extracción de periferias",
    philosophy: "Las naciones fuertes deben expandir su civilización.",
    economicModel: "Extracción masiva de recursos coloniales.",
    militaryPolicy: "Proyección de fuerza global; armada y ejército coloniales.",
    bonuses: ["+40% extracción colonial", "+25% volumen de rutas a periferia"],
    penalties: ["-15% estabilidad por resistencia colonial"],
    synergies: ["mercantilism", "nationalism", "absolutism"], conflicts: ["anarchism", "marxism", "syndicalism"],
  },
  constitutionalism: {
    name: "Constitucionalismo", icon: "📜", color: "#8b5cf6",
    desc: "Monarquía constitucional, equilibrio de poderes",
    philosophy: "El poder debe estar limitado por leyes fundamentales.",
    economicModel: "Mercado regulado con protecciones legales.",
    militaryPolicy: "Fuerzas armadas bajo control civil parlamentario.",
    bonuses: ["+20% estabilidad", "+15% crecimiento sostenido"],
    penalties: ["Decisiones más lentas (mayor costo de acciones)"],
    synergies: ["liberalism", "conservatism", "progressivism"], conflicts: ["absolutism"],
  },
  progressivism: {
    name: "Progresismo", icon: "🔧", color: "#14b8a6",
    desc: "Reforma social y modernización gradual",
    philosophy: "El progreso se logra mediante reformas institucionales.",
    economicModel: "Reformas laborales, educación pública, infraestructura.",
    militaryPolicy: "Defensa limitada; inversión en bienestar social.",
    bonuses: ["+25% industrialización", "+20% movilidad social"],
    penalties: ["-10% poder militar"],
    synergies: ["liberalism", "constitutionalism", "marxism", "syndicalism"], conflicts: ["absolutism", "theocracy", "conservatism"],
  },
  anarchism: {
    name: "Anarquismo", icon: "🔥", color: "#f97316",
    desc: "Anti-estado, acción directa y ayuda mutua",
    philosophy: "Toda jerarquía coercitiva es illegítima.",
    economicModel: "Cooperativas, intercambio libre, autogestión.",
    militaryPolicy: "Milicias populares voluntarias; defensa horizontal.",
    bonuses: ["-30% descontento base", "+20% resistencia a imposición"],
    penalties: ["-20% GDP por falta de planificación central"],
    synergies: ["marxism", "syndicalism", "liberalism"], conflicts: ["absolutism", "imperialism", "nationalism", "theocracy"],
  },
  theocracy: {
    name: "Teocracia", icon: "☪️", color: "#eab308",
    desc: "Gobierno religioso y mandato divino",
    philosophy: "El poder viene de lo divino. La ley sagrada es suprema.",
    economicModel: "Economía regulada por preceptos religiosos.",
    militaryPolicy: "Guerra santa cuando sea necesario; ejército de fieles.",
    bonuses: ["+30% estabilidad si estabilidad > 60", "+25% poder cultural"],
    penalties: ["-20% tolerancia a ideologías ajenas"],
    synergies: ["conservatism", "absolutism"], conflicts: ["liberalism", "anarchism", "progressivism"],
  },
  syndicalism: {
    name: "Sindicalismo", icon: "⚒️", color: "#84cc16",
    desc: "Sindicatos y autogestión obrera",
    philosophy: "Los trabajadores deben controlar los medios de producción.",
    economicModel: "Industrias manejadas por sindicatos; producción para necesidad.",
    militaryPolicy: "Milicias obreras; huelga general como arma.",
    bonuses: ["+35% poder de clase trabajadora", "+20% estabilidad obrera"],
    penalties: ["-15% GDP por ineficiencia burocrática sindical"],
    synergies: ["marxism", "anarchism", "progressivism"], conflicts: ["absolutism", "imperialism"],
  },
};

export const FOCUS_INFO: Record<StrategicFocus, {
  name: string; icon: string; color: string;
  desc: string;
  bonuses: { stat: string; value: string }[];
  penalty: string;
}> = {
  industrialist: {
    name: "Industrialista", icon: "🏭", color: "#f59e0b",
    desc: "Prioridad: industrialización y crecimiento económico.",
    bonuses: [
      { stat: "Industrialización", value: "+15%" },
      { stat: "Inversión en industria", value: "-20% costo" },
      { stat: "Infraestructura", value: "+10% GDP extra" },
    ],
    penalty: "Poder militar crece 10% más lento",
  },
  militarist: {
    name: "Militarista", icon: "⚔️", color: "#ef4444",
    desc: "El poder bélico es tu camino hacia la hegemonía.",
    bonuses: [
      { stat: "Poder militar base", value: "+20%" },
      { stat: "Construir militar", value: "-25% costo" },
      { stat: "Presión diplomática", value: "+15% fuerza" },
    ],
    penalty: "Poder cultural crece 10% más lento",
  },
  diplomat: {
    name: "Diplomático", icon: "🤝", color: "#06b6d4",
    desc: "Las alianzas y el comercio son tu arma principal.",
    bonuses: [
      { stat: "Poder diplomático", value: "+20%" },
      { stat: "Buscar socios", value: "-20% cooldown" },
      { stat: "Rutas comerciales", value: "+15% volumen" },
    ],
    penalty: "Acciones militares cuestan 15% más",
  },
  culturalist: {
    name: "Culturalista", icon: "🎭", color: "#a855f7",
    desc: "Expande tu ideología y cultura por el mundo.",
    bonuses: [
      { stat: "Poder cultural", value: "+20%" },
      { stat: "Spread ideológico", value: "+25% efectividad" },
      { stat: "Resistencia ideológica", value: "+30%" },
    ],
    penalty: "Acciones militares cuestan 15% más",
  },
  balanced: {
    name: "Equilibrado", icon: "⚖️", color: "#10b981",
    desc: "Sin especialización. Flexibilidad total.",
    bonuses: [
      { stat: "Costo de acciones", value: "-10%" },
      { stat: "Cooldown global", value: "-1 turno" },
      { stat: "Adaptabilidad", value: "Sin debilidad" },
    ],
    penalty: "Sin bonuses fuertes en ninguna área",
  },
  colonialist: {
    name: "Colonialista", icon: "🏴", color: "#dc2626",
    desc: "Extraer recursos de la periferia para alimentar tu industria.",
    bonuses: [
      { stat: "Extracción colonial", value: "+30%" },
      { stat: "Expansiones", value: "-25% costo" },
      { stat: "Recursos ganados", value: "+20%" },
    ],
    penalty: "-10% estabilidad por tensión colonial",
  },
  scientist: {
    name: "Científico", icon: "🔬", color: "#eab308",
    desc: "La investigación y la innovación son la clave del poder.",
    bonuses: [
      { stat: "Industrialización", value: "+25%" },
      { stat: "Velocidad tech", value: "+30%" },
      { stat: "Intercambio técnico", value: "-20% cooldown" },
    ],
    penalty: "Acciones militares cuestan 10% más",
  },
  merchant: {
    name: "Comerciante", icon: "💰", color: "#14b8a6",
    desc: "Maximiza el comercio y las rutas comerciales.",
    bonuses: [
      { stat: "GDP por ruta", value: "+25%" },
      { stat: "Nuevas rutas", value: "-30% cooldown" },
      { stat: "Volumen comercial", value: "+15%" },
    ],
    penalty: "-10% poder militar",
  },
  revolutionary: {
    name: "Revolucionario", icon: "🔥", color: "#f97316",
    desc: "Destabiliza rivales y propaga tu ideología agresivamente.",
    bonuses: [
      { stat: "Spread ideológico", value: "+40%" },
      { stat: "Desestabilizar rivales", value: "+30%" },
      { stat: "Poder cultural", value: "+15%" },
    ],
    penalty: "-15% estabilidad, más vulnerable a revoluciones",
  },
  isolationist: {
    name: "Aislacionista", icon: "🏔️", color: "#64748b",
    desc: "Fortalece defensas y busca autosuficiencia.",
    bonuses: [
      { stat: "Estabilidad", value: "+20%" },
      { stat: "Defensa", value: "+25% poder militar defensivo" },
      { stat: "Auto-suficiencia", value: "+15% producción interna" },
    ],
    penalty: "-20% volumen de comercio internacional",
  },
};

export const TRAIT_INFO: Record<CulturalTrait, {
  name: string; icon: string; color: string;
  desc: string; effect: string;
}> = {
  seafaring:     { name: "Tradición Marítima",    icon: "⚓", color: "#06b6d4", desc: "Tu pueblo domina los mares.",                    effect: "+25% volumen de rutas marítimas. Bonus al buscar socios." },
  innovative:    { name: "Espíritu Innovador",    icon: "💡", color: "#f59e0b", desc: "Tu sociedad valora el progreso.",               effect: "Industrialización avanza 30% más rápido." },
  warlike:       { name: "Tradición Bélica",      icon: "🗡️", color: "#ef4444", desc: "La guerra forja tu pueblo.",                    effect: "+15% poder militar base. Regenera estabilidad al ganar conflictos." },
  mercantile:    { name: "Instinto Comerciante",   icon: "🪙", color: "#10b981", desc: "El comercio es tu lenguaje.",                   effect: "+20% GDP por cada ruta comercial activa." },
  spiritual:     { name: "Herencia Espiritual",    icon: "🕉️", color: "#a855f7", desc: "Tradiciones espirituales unen a tu pueblo.",   effect: "+20 estabilidad base. Descontento sube 20% más lento." },
  expansionist:  { name: "Fervor Expansionista",   icon: "🧭", color: "#f97316", desc: "Tu destino es expandir fronteras.",              effect: "+30% extracción colonial, -20% costo de expansión." },
  agrarian:      { name: "Raíces Agrarias",       icon: "🌾", color: "#84cc16", desc: "La tierra es tu riqueza ancestral.",            effect: "+25% producción de grano, +10% crecimiento poblacional." },
  industrial:    { name: "Fuerza Industrial",       icon: "⚙️", color: "#eab308", desc: "Las fábricas son el corazón de tu nación.",     effect: "+20% eficiencia manufacturera, +10% industrialización." },
  scholarly:     { name: "Saber Académico",        icon: "📚", color: "#8b5cf6", desc: "El conocimiento es poder.",                     effect: "+20% poder cultural, +15% velocidad de investigación." },
  nomadic:       { name: "Tradición Nómada",       icon: "🐎", color: "#f97316", desc: "La movilidad define tu pueblo.",                effect: "+15% velocidad militar, +10% flexibilidad de fronteras." },
  diplomatic:    { name: "Habilidad Diplomática",   icon: "🕊️", color: "#06b6d4", desc: "Las palabras resuelven más que las armas.",      effect: "+20% poder diplomático, +15% bonus en alianzas." },
  fortified:    { name: "Fortaleza Ancestral",    icon: "🏰", color: "#64748b", desc: "Tus defensas son legendarias.",                 effect: "+25% defensa, estabilidad no baja de 30 bajo asedio." },
};
