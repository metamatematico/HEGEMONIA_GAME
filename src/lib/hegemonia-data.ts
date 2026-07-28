// ============================================================
// Hegemonía: El Grafo de los Mundos — Mock Data for Dashboard
// ============================================================

export interface Nation {
  id: string;
  name: string;
  flag: string;
  class: "core" | "semi" | "periphery";
  ideology: string;
  gdp: number; // billions USD (1850 equivalent)
  population: number; // millions
  militaryPower: number; // 0-100
  culturalPower: number; // 0-100
  diplomaticPower: number; // 0-100
  x: number; // graph position 0-100
  y: number; // graph position 0-100
  eigenvectorCentrality: number; // 0-1
  betweennessCentrality: number; // 0-1
  tradeBalance: number; // surplus(+)/deficit(-) millions
  resources: { coal: number; iron: number; grain: number; cotton: number };
  socialStructure: { elite: number; middle: number; working: number; peasant: number };
}

export interface TradeFlow {
  from: string;
  to: string;
  volume: number; // millions
  type: "raw" | "manufactured" | "luxury";
}

export interface GameEvent {
  turn: number;
  text: string;
  type: "trade" | "war" | "revolution" | "crisis" | "diplomacy" | "ideology";
  nation?: string;
}

export interface HistoricalGDP {
  turn: number;
  year: number;
  data: Record<string, number>; // nation id -> GDP
}

// ---- NATIONS ----
export const nations: Nation[] = [
  { id: "gb", name: "Gran Bretaña", flag: "🇬🇧", class: "core", ideology: "Mercantilismo", gdp: 4.2, population: 27.4, militaryPower: 95, culturalPower: 88, diplomaticPower: 90, x: 46, y: 20, eigenvectorCentrality: 0.94, betweennessCentrality: 0.87, tradeBalance: 320, resources: { coal: 85, iron: 78, grain: 35, cotton: 15 }, socialStructure: { elite: 8, middle: 22, working: 45, peasant: 25 } },
  { id: "fr", name: "Francia", flag: "🇫🇷", class: "core", ideology: "Liberalismo", gdp: 3.6, population: 36.0, militaryPower: 88, culturalPower: 95, diplomaticPower: 85, x: 48, y: 29, eigenvectorCentrality: 0.89, betweennessCentrality: 0.78, tradeBalance: 180, resources: { coal: 45, iron: 55, grain: 72, cotton: 20 }, socialStructure: { elite: 6, middle: 18, working: 38, peasant: 38 } },
  { id: "de", name: "Prusia/Alemania", flag: "🇩🇪", class: "core", ideology: "Nacionalismo", gdp: 2.8, population: 34.0, militaryPower: 92, culturalPower: 82, diplomaticPower: 72, x: 51, y: 23, eigenvectorCentrality: 0.82, betweennessCentrality: 0.74, tradeBalance: 95, resources: { coal: 92, iron: 88, grain: 65, cotton: 8 }, socialStructure: { elite: 5, middle: 15, working: 50, peasant: 30 } },
  { id: "nl", name: "Países Bajos", flag: "🇳🇱", class: "core", ideology: "Mercantilismo", gdp: 1.2, population: 3.1, militaryPower: 42, culturalPower: 75, diplomaticPower: 80, x: 48, y: 21, eigenvectorCentrality: 0.71, betweennessCentrality: 0.65, tradeBalance: 85, resources: { coal: 30, iron: 20, grain: 15, cotton: 5 }, socialStructure: { elite: 10, middle: 35, working: 35, peasant: 20 } },
  { id: "be", name: "Bélgica", flag: "🇧🇪", class: "core", ideology: "Liberalismo", gdp: 0.9, population: 4.6, militaryPower: 35, culturalPower: 58, diplomaticPower: 48, x: 49, y: 23, eigenvectorCentrality: 0.60, betweennessCentrality: 0.52, tradeBalance: 42, resources: { coal: 75, iron: 82, grain: 22, cotton: 12 }, socialStructure: { elite: 7, middle: 20, working: 55, peasant: 18 } },
  { id: "es", name: "España", flag: "🇪🇸", class: "semi", ideology: "Conservadurismo", gdp: 1.1, population: 15.5, militaryPower: 55, culturalPower: 62, diplomaticPower: 58, x: 44, y: 33, eigenvectorCentrality: 0.48, betweennessCentrality: 0.55, tradeBalance: -30, resources: { coal: 22, iron: 18, grain: 40, cotton: 0 }, socialStructure: { elite: 12, middle: 10, working: 18, peasant: 60 } },
  { id: "pt", name: "Portugal", flag: "🇵🇹", class: "semi", ideology: "Conservadurismo", gdp: 0.4, population: 3.8, militaryPower: 25, culturalPower: 38, diplomaticPower: 35, x: 43, y: 35, eigenvectorCentrality: 0.32, betweennessCentrality: 0.28, tradeBalance: -15, resources: { coal: 5, iron: 8, grain: 18, cotton: 0 }, socialStructure: { elite: 15, middle: 8, working: 12, peasant: 65 } },
  { id: "it", name: "Piamonte/Italia", flag: "🇮🇹", class: "semi", ideology: "Nacionalismo", gdp: 0.7, population: 24.0, militaryPower: 45, culturalPower: 72, diplomaticPower: 50, x: 52, y: 33, eigenvectorCentrality: 0.45, betweennessCentrality: 0.42, tradeBalance: -22, resources: { coal: 12, iron: 25, grain: 48, cotton: 0 }, socialStructure: { elite: 10, middle: 12, working: 20, peasant: 58 } },
  { id: "at", name: "Austria", flag: "🇦🇹", class: "semi", ideology: "Conservadurismo", gdp: 1.3, population: 34.0, militaryPower: 62, culturalPower: 78, diplomaticPower: 70, x: 53, y: 27, eigenvectorCentrality: 0.58, betweennessCentrality: 0.60, tradeBalance: 10, resources: { coal: 35, iron: 30, grain: 55, cotton: 0 }, socialStructure: { elite: 8, middle: 14, working: 22, peasant: 56 } },
  { id: "se", name: "Suecia", flag: "🇸🇪", class: "semi", ideology: "Liberalismo", gdp: 0.5, population: 3.5, militaryPower: 38, culturalPower: 42, diplomaticPower: 40, x: 51, y: 16, eigenvectorCentrality: 0.35, betweennessCentrality: 0.30, tradeBalance: 28, resources: { coal: 15, iron: 72, grain: 20, cotton: 0 }, socialStructure: { elite: 6, middle: 18, working: 35, peasant: 41 } },
  { id: "ru", name: "Rusia", flag: "🇷🇺", class: "semi", ideology: "Absolutismo", gdp: 1.8, population: 68.0, militaryPower: 78, culturalPower: 55, diplomaticPower: 72, x: 68, y: 20, eigenvectorCentrality: 0.65, betweennessCentrality: 0.72, tradeBalance: 65, resources: { coal: 40, iron: 55, grain: 85, cotton: 0 }, socialStructure: { elite: 4, middle: 6, working: 15, peasant: 75 } },
  { id: "ot", name: "Imperio Otomano", flag: "🇹🇷", class: "semi", ideology: "Conservadurismo", gdp: 0.9, population: 36.0, militaryPower: 48, culturalPower: 45, diplomaticPower: 40, x: 58, y: 36, eigenvectorCentrality: 0.40, betweennessCentrality: 0.52, tradeBalance: -40, resources: { coal: 18, iron: 22, grain: 60, cotton: 35 }, socialStructure: { elite: 3, middle: 5, working: 12, peasant: 80 } },
  { id: "us", name: "Estados Unidos", flag: "🇺🇸", class: "semi", ideology: "Liberalismo", gdp: 2.4, population: 23.2, militaryPower: 52, culturalPower: 48, diplomaticPower: 55, x: 20, y: 28, eigenvectorCentrality: 0.55, betweennessCentrality: 0.45, tradeBalance: -80, resources: { coal: 50, iron: 40, grain: 90, cotton: 88 }, socialStructure: { elite: 8, middle: 20, working: 25, peasant: 47 } },
  { id: "br", name: "Brasil", flag: "🇧🇷", class: "periphery", ideology: "Conservadurismo", gdp: 0.5, population: 8.0, militaryPower: 22, culturalPower: 25, diplomaticPower: 20, x: 30, y: 56, eigenvectorCentrality: 0.22, betweennessCentrality: 0.18, tradeBalance: -55, resources: { coal: 5, iron: 10, grain: 42, cotton: 72 }, socialStructure: { elite: 4, middle: 3, working: 8, peasant: 85 } },
  { id: "mx", name: "México", flag: "🇲🇽", class: "periphery", ideology: "Conservadurismo", gdp: 0.3, population: 7.8, militaryPower: 20, culturalPower: 18, diplomaticPower: 15, x: 16, y: 42, eigenvectorCentrality: 0.18, betweennessCentrality: 0.12, tradeBalance: -35, resources: { coal: 8, iron: 15, grain: 38, cotton: 15 }, socialStructure: { elite: 5, middle: 4, working: 6, peasant: 85 } },
  { id: "ar", name: "Argentina", flag: "🇦🇷", class: "periphery", ideology: "Liberalismo", gdp: 0.2, population: 1.8, militaryPower: 12, culturalPower: 15, diplomaticPower: 12, x: 27, y: 66, eigenvectorCentrality: 0.15, betweennessCentrality: 0.10, tradeBalance: -20, resources: { coal: 2, iron: 5, grain: 65, cotton: 10 }, socialStructure: { elite: 6, middle: 5, working: 9, peasant: 80 } },
  { id: "in", name: "India (británica)", flag: "🇮🇳", class: "periphery", ideology: "Conservadurismo", gdp: 1.2, population: 180.0, militaryPower: 15, culturalPower: 35, diplomaticPower: 10, x: 71, y: 44, eigenvectorCentrality: 0.30, betweennessCentrality: 0.38, tradeBalance: -220, resources: { coal: 28, iron: 35, grain: 80, cotton: 92 }, socialStructure: { elite: 1, middle: 2, working: 7, peasant: 90 } },
  { id: "cn", name: "China (Qing)", flag: "🇨🇳", class: "periphery", ideology: "Conservadurismo", gdp: 1.5, population: 380.0, militaryPower: 40, culturalPower: 65, diplomaticPower: 30, x: 79, y: 34, eigenvectorCentrality: 0.35, betweennessCentrality: 0.32, tradeBalance: -150, resources: { coal: 55, iron: 45, grain: 88, cotton: 70 }, socialStructure: { elite: 3, middle: 5, working: 12, peasant: 80 } },
  { id: "jp", name: "Japón (Tokugawa)", flag: "🇯🇵", class: "periphery", ideology: "Conservadurismo", gdp: 0.3, population: 33.0, militaryPower: 28, culturalPower: 55, diplomaticPower: 18, x: 84, y: 28, eigenvectorCentrality: 0.20, betweennessCentrality: 0.15, tradeBalance: -8, resources: { coal: 20, iron: 15, grain: 55, cotton: 0 }, socialStructure: { elite: 8, middle: 10, working: 12, peasant: 70 } },
  { id: "eg", name: "Egipto", flag: "🇪🇬", class: "periphery", ideology: "Conservadurismo", gdp: 0.15, population: 5.0, militaryPower: 10, culturalPower: 30, diplomaticPower: 12, x: 55, y: 40, eigenvectorCentrality: 0.14, betweennessCentrality: 0.18, tradeBalance: -18, resources: { coal: 0, iron: 3, grain: 50, cotton: 78 }, socialStructure: { elite: 3, middle: 4, working: 8, peasant: 85 } },
  { id: "co", name: "Colombia", flag: "🇨🇴", class: "periphery", ideology: "Conservadurismo", gdp: 0.12, population: 3.0, militaryPower: 8, culturalPower: 10, diplomaticPower: 8, x: 24, y: 48, eigenvectorCentrality: 0.10, betweennessCentrality: 0.08, tradeBalance: -12, resources: { coal: 5, iron: 3, grain: 25, cotton: 8 }, socialStructure: { elite: 4, middle: 3, working: 8, peasant: 85 } },
];

// ---- TRADE FLOWS ----
export const tradeFlows: TradeFlow[] = [
  { from: "gb", to: "fr", volume: 280, type: "manufactured" },
  { from: "gb", to: "de", volume: 240, type: "manufactured" },
  { from: "gb", to: "nl", volume: 180, type: "manufactured" },
  { from: "gb", to: "be", volume: 150, type: "manufactured" },
  { from: "gb", to: "us", volume: 200, type: "manufactured" },
  { from: "gb", to: "in", volume: 310, type: "raw" },
  { from: "gb", to: "br", volume: 95, type: "raw" },
  { from: "gb", to: "cn", volume: 120, type: "luxury" },
  { from: "gb", to: "ar", volume: 45, type: "raw" },
  { from: "fr", to: "de", volume: 160, type: "manufactured" },
  { from: "fr", to: "es", volume: 90, type: "manufactured" },
  { from: "fr", to: "it", volume: 75, type: "manufactured" },
  { from: "fr", to: "ot", volume: 65, type: "luxury" },
  { from: "fr", to: "ru", volume: 110, type: "luxury" },
  { from: "fr", to: "eg", volume: 55, type: "raw" },
  { from: "de", to: "at", volume: 130, type: "manufactured" },
  { from: "de", to: "ru", volume: 85, type: "manufactured" },
  { from: "de", to: "se", volume: 60, type: "manufactured" },
  { from: "de", to: "nl", volume: 140, type: "manufactured" },
  { from: "nl", to: "id", volume: 0, type: "raw" },
  { from: "us", to: "gb", volume: 220, type: "raw" },
  { from: "us", to: "fr", volume: 85, type: "raw" },
  { from: "mx", to: "gb", volume: 40, type: "raw" },
  { from: "mx", to: "us", volume: 55, type: "raw" },
  { from: "br", to: "gb", volume: 88, type: "raw" },
  { from: "br", to: "fr", volume: 35, type: "raw" },
  { from: "br", to: "pt", volume: 50, type: "raw" },
  { from: "in", to: "gb", volume: 300, type: "raw" },
  { from: "in", to: "fr", volume: 80, type: "raw" },
  { from: "in", to: "ot", volume: 45, type: "raw" },
  { from: "cn", to: "gb", volume: 130, type: "luxury" },
  { from: "cn", to: "fr", volume: 70, type: "luxury" },
  { from: "cn", to: "jp", volume: 25, type: "luxury" },
  { from: "es", to: "gb", volume: 55, type: "raw" },
  { from: "es", to: "fr", volume: 48, type: "raw" },
  { from: "pt", to: "gb", volume: 42, type: "raw" },
  { from: "co", to: "gb", volume: 22, type: "raw" },
  { from: "co", to: "us", volume: 18, type: "raw" },
  { from: "eg", to: "gb", volume: 52, type: "raw" },
  { from: "eg", to: "fr", volume: 35, type: "raw" },
  { from: "jp", to: "cn", volume: 22, type: "raw" },
  { from: "ru", to: "gb", volume: 75, type: "raw" },
  { from: "ru", to: "fr", volume: 60, type: "raw" },
  { from: "ru", to: "de", volume: 55, type: "raw" },
  { from: "at", to: "ot", volume: 40, type: "manufactured" },
  { from: "ot", to: "gb", volume: 50, type: "raw" },
  { from: "ot", to: "fr", volume: 42, type: "raw" },
];

// ---- EVENTS LOG ----
export const gameEvents: GameEvent[] = [
  { turn: 12, text: "Gran Bretaña firma tratado de libre comercio con Prusia", type: "trade", nation: "gb" },
  { turn: 12, text: "NPC Francia: Prioriza industrialización textil (Utilidad: 0.87)", type: "diplomacy", nation: "fr" },
  { turn: 12, text: "Motín en colonia brasileña — descontento campesino crece", type: "revolution", nation: "br" },
  { turn: 12, text: "Rusia aumenta producción de hierro un 15% este turno", type: "crisis", nation: "ru" },
  { turn: 11, text: "Estados Unidos: Expansión ferroviaria conecta nuevas regiones", type: "trade", nation: "us" },
  { turn: 11, text: "NPC Gran Bretaña: Fortalece flota mercante (Acción #4)", type: "diplomacy", nation: "gb" },
  { turn: 11, text: "Crisis alimentaria en Irlanda — hambruna de papa", type: "crisis", nation: "gb" },
  { turn: 11, text: "China rechaza acuerdo comercial con Gran Bretaña", type: "diplomacy", nation: "cn" },
  { turn: 11, text: "Propagación liberal en España — burguesía gaining influence", type: "ideology", nation: "es" },
  { turn: 10, text: "Guerra comercial: Francia vs. Prusia por mercados textiles", type: "war", nation: "fr" },
  { turn: 10, text: "NPC Japón: Aísla comercio exterior (Sakoku reforzado)", type: "diplomacy", nation: "jp" },
  { turn: 10, text: "India británica: Rebelión sepoy — tropas desplegadas", type: "revolution", nation: "in" },
  { turn: 10, text: "Revoluciones 1848: Ondas de protesta en Austria", type: "revolution", nation: "at" },
  { turn: 9, text: "Gran Bretaña alcanza mayor centralidad eigenvector (0.94)", type: "trade", nation: "gb" },
  { turn: 9, text: "México pierda territorio — balanza comercial en déficit", type: "crisis", nation: "mx" },
  { turn: 9, text: "NPC Rusia: Invierte en infraestructura militar (Acción #2)", type: "diplomacy", nation: "ru" },
  { turn: 8, text: "Tratado de navegación: Países Bajos + Gran Bretaña", type: "trade", nation: "nl" },
  { turn: 8, text: "Conservadurismo se fortalece en Imperio Otomano", type: "ideology", nation: "ot" },
  { turn: 7, text: "Argentina: Boom exportador de ganado y cereales", type: "trade", nation: "ar" },
  { turn: 6, text: "Suecia desarrolla industria siderúrgica — sube a Semi-Periferia", type: "ideology", nation: "se" },
];

// ---- HISTORICAL GDP DATA (turns 1-12) ----
export const historicalGDP: HistoricalGDP[] = [
  { turn: 1, year: 1835, data: { gb: 2.8, fr: 2.4, de: 1.6, nl: 0.8, us: 1.2, ru: 1.2, cn: 1.8, in: 1.4 } },
  { turn: 2, year: 1836, data: { gb: 3.0, fr: 2.5, de: 1.7, nl: 0.85, us: 1.3, ru: 1.3, cn: 1.75, in: 1.35 } },
  { turn: 3, year: 1837, data: { gb: 3.1, fr: 2.6, de: 1.8, nl: 0.88, us: 1.5, ru: 1.35, cn: 1.7, in: 1.3 } },
  { turn: 4, year: 1838, data: { gb: 3.3, fr: 2.7, de: 1.9, nl: 0.92, us: 1.6, ru: 1.4, cn: 1.65, in: 1.28 } },
  { turn: 5, year: 1839, data: { gb: 3.5, fr: 2.8, de: 2.0, nl: 0.95, us: 1.7, ru: 1.45, cn: 1.6, in: 1.25 } },
  { turn: 6, year: 1840, data: { gb: 3.6, fr: 2.9, de: 2.1, nl: 0.98, us: 1.8, ru: 1.5, cn: 1.58, in: 1.24 } },
  { turn: 7, year: 1841, data: { gb: 3.8, fr: 3.0, de: 2.2, nl: 1.02, us: 1.9, ru: 1.55, cn: 1.55, in: 1.22 } },
  { turn: 8, year: 1842, data: { gb: 3.9, fr: 3.1, de: 2.4, nl: 1.05, us: 2.0, ru: 1.6, cn: 1.52, in: 1.21 } },
  { turn: 9, year: 1843, data: { gb: 4.0, fr: 3.2, de: 2.5, nl: 1.08, us: 2.1, ru: 1.65, cn: 1.52, in: 1.20 } },
  { turn: 10, year: 1844, data: { gb: 4.1, fr: 3.3, de: 2.6, nl: 1.1, us: 2.2, ru: 1.7, cn: 1.50, in: 1.20 } },
  { turn: 11, year: 1845, data: { gb: 4.15, fr: 3.45, de: 2.7, nl: 1.15, us: 2.3, ru: 1.75, cn: 1.50, in: 1.20 } },
  { turn: 12, year: 1846, data: { gb: 4.2, fr: 3.6, de: 2.8, nl: 1.2, us: 2.4, ru: 1.8, cn: 1.50, in: 1.20 } },
];

// ---- GAME STATE ----
export const gameState = {
  turn: 12,
  year: 1847,
  playerIdeology: "Mercantilismo",
  speed: 1, // turns per minute
  isPaused: true,
  totalGDP: 28.4,
  totalTrade: 12.6,
  totalPopulation: 1085,
  coreCount: 5,
  semiCount: 7,
  peripheryCount: 8,
};

// ---- HELPER: get nation by id ----
export function getNation(id: string): Nation | undefined {
  return nations.find((n) => n.id === id);
}

// ---- HELPER: get nation flag ----
export function getNationName(id: string): string {
  return nations.find((n) => n.id === id)?.name ?? id;
}

// ---- HELPER: class color ----
export function classColor(cls: string): string {
  switch (cls) {
    case "core": return "#06b6d4";       // cyan
    case "semi": return "#f59e0b";       // amber
    case "periphery": return "#64748b";  // slate
    default: return "#475569";
  }
}

export function classBgColor(cls: string): string {
  switch (cls) {
    case "core": return "rgba(6,182,212,0.15)";
    case "semi": return "rgba(245,158,11,0.15)";
    case "periphery": return "rgba(100,116,139,0.15)";
    default: return "rgba(71,85,105,0.15)";
  }
}

export function classLabel(cls: string): string {
  switch (cls) {
    case "core": return "Core";
    case "semi": return "Semi-Periferia";
    case "periphery": return "Periferia";
    default: return cls;
  }
}

// ---- HELPER: event type icon ----
export function eventIcon(type: GameEvent["type"]): string {
  switch (type) {
    case "trade": return "📦";
    case "war": return "⚔️";
    case "revolution": return "🔥";
    case "crisis": return "⚠️";
    case "diplomacy": return "🤝";
    case "ideology": return "💭";
    default: return "📌";
  }
}

// ---- HELPER: event type color ----
export function eventColor(type: GameEvent["type"]): string {
  switch (type) {
    case "trade": return "#06b6d4";
    case "war": return "#ef4444";
    case "revolution": return "#f97316";
    case "crisis": return "#eab308";
    case "diplomacy": return "#10b981";
    case "ideology": return "#a855f7";
    default: return "#64748b";
  }
}
