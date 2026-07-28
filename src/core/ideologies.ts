// ============================================================
// Hegemonía Core Engine — Ideology Mechanics
// ============================================================
// Each of the 6 ideologies has unique graph mechanics that
// modify trade flows, centrality propagation, social dynamics,
// and NPC behavior. Based on Wallerstein, Marx, and Smith.
//
// Ideologies are NOT just stat modifiers — they reshape the
// network topology and emergent behavior of the world-system.

import type { NationNode, TradeEdge, Ideology } from "./types";

// ─── Ideology Profile ───────────────────────────────────────

export interface IdeologyProfile {
  /** Production efficiency multiplier */
  productionMod: number;
  /** Trade openness: 0 = autarky, 1 = free trade */
  openness: number;
  /** Preferred tariff rate */
  idealTariff: number;
  /** How much cultural pressure this ideology exerts on neighbors */
  culturalPressure: number;
  /** How susceptible to incoming ideological pressure */
  susceptibility: number;
  /** Military spending priority (0-1) */
  militaryPriority: number;
  /** Industrialization speed bonus */
  industrialBonus: number;
  /** Social mobility (how fast peasants → working/middle class) */
  socialMobility: number;
  /** Stability bonus (natural order/legitimacy) */
  stabilityBonus: number;
  /** Unrest generation (inherent dissatisfaction) */
  unrestGeneration: number;
  /** Trade type affinity: "raw" = extractive, "manufactured" = industrial, "luxury" = both */
  exportAffinity: "raw" | "manufactured" | "luxury";
  /** Description of graph mechanic */
  graphMechanic: string;
  /** Key modifier: how this ideology changes edge weights */
  edgeWeightModifier: (volume: number, fromClass: string, toClass: string) => number;
  /** Unique per-turn ideological action */
  ideologicalEffect: (nation: NationNode, nations: NationNode[], edges: TradeEdge[]) => IdeologyEffect[];
}

export interface IdeologyEffect {
  type: "trade" | "war" | "revolution" | "crisis" | "diplomacy" | "ideology";
  text: string;
  nationId: string;
}

// ─── Ideology Profiles ──────────────────────────────────────

function mercantilismEdgeMod(volume: number, fromClass: string, _toClass: string): number {
  // Mercantilism: boosts exports to periphery, weakens imports from core competitors
  if (fromClass === "core" || fromClass === "semi") return volume * 1.15;
  return volume * 0.95;
}

function mercantilismEffect(
  nation: NationNode, nations: NationNode[], edges: TradeEdge[]
): IdeologyEffect[] {
  const effects: IdeologyEffect[] = [];

  // Mercantilism: actively seeks trade surplus — raise tariffs on imports
  for (const e of edges) {
    if (e.to === nation.id && e.type === "manufactured") {
      e.tariffRate = Math.min(0.5, e.tariffRate + 0.02);
    }
    if (e.from === nation.id && e.type === "raw") {
      e.tariffRate = Math.max(0.01, e.tariffRate - 0.01);
    }
  }

  // Accumulation: mercantilist nations hoard resources
  if (nation.resources.coal < 50) nation.resources.coal += 0.3;
  if (nation.resources.iron < 50) nation.resources.iron += 0.2;

  // Event: colonial extraction
  if (Math.random() < 0.03) {
    const colonies = nations.filter(
      (n) => n.worldClass === "periphery" && n.id !== nation.id
    );
    if (colonies.length > 0) {
      const colony = colonies[Math.floor(Math.random() * colonies.length)];
      // Extract resources from colony
      colony.resources.grain = Math.max(5, colony.resources.grain - 1);
      colony.resources.cotton = Math.max(5, colony.resources.cotton - 1);
      nation.gdp += 0.01;
      effects.push({
        type: "trade",
        text: `${nation.name}: Extracción colonial de ${colony.name}`,
        nationId: nation.id,
      });
    }
  }

  return effects;
}

function liberalismEdgeMod(volume: number, _fromClass: string, toClass: string): number {
  // Liberalism: free trade benefits everyone, especially core trading with periphery
  if (toClass === "periphery") return volume * 1.1;
  return volume * 1.05;
}

function liberalismEffect(
  nation: NationNode, nations: NationNode[], edges: TradeEdge[]
): IdeologyEffect[] {
  const effects: IdeologyEffect[] = [];

  // Liberalism: lower all tariffs toward free trade
  for (const e of edges) {
    if (e.from === nation.id || e.to === nation.id) {
      e.tariffRate = Math.max(0.01, e.tariffRate * 0.98);
    }
  }

  // Market innovation: faster industrialization through competition
  nation.industrialization = Math.min(100, nation.industrialization + 0.1);

  // Event: trade agreement proposal
  if (Math.random() < 0.04) {
    const potentialPartners = nations.filter(
      (n) => n.id !== nation.id && n.ideology !== "absolutism"
    );
    if (potentialPartners.length > 0) {
      const partner = potentialPartners[Math.floor(Math.random() * potentialPartners.length)];
      // Boost existing trade or note the attempt
      for (const e of edges) {
        if (
          (e.from === nation.id && e.to === partner.id) ||
          (e.to === nation.id && e.from === partner.id)
        ) {
          e.volume = Math.min(1000, e.volume * 1.1);
          effects.push({
            type: "trade",
            text: `${nation.name}: Acuerdo de libre comercio con ${partner.name}`,
            nationId: nation.id,
          });
          return effects;
        }
      }
    }
  }

  return effects;
}

function marxismEdgeMod(volume: number, fromClass: string, toClass: string): number {
  // Marxism: reduces exploitation flows (core ← raw from periphery)
  // Strengths solidarity between periphery nations
  if (fromClass === "periphery" && toClass === "periphery") return volume * 1.3;
  if (fromClass === "periphery" && toClass === "core") return volume * 0.85;
  return volume * 0.9;
}

function marxismEffect(
  nation: NationNode, nations: NationNode[], edges: TradeEdge[]
): IdeologyEffect[] {
  const effects: IdeologyEffect[] = [];

  // Marxism: redistribute wealth, boost working class
  nation.socialClasses.working = Math.min(55, nation.socialClasses.working + 0.3);
  nation.socialClasses.elite = Math.max(2, nation.socialClasses.elite - 0.1);
  nation.stability = Math.min(95, nation.stability + 2);
  nation.unrest = Math.max(0, nation.unrest - 5);

  // Socialist industrialization (collective ownership)
  nation.industrialization = Math.min(100, nation.industrialization + 0.15);

  // Event: inspire revolution in neighbors
  if (nation.culturalPower > 30 && Math.random() < 0.05) {
    const neighbors = new Set<string>();
    for (const e of edges) {
      if (e.from === nation.id) neighbors.add(e.to);
      if (e.to === nation.id) neighbors.add(e.from);
    }
    const affected = nations.filter(
      (n) => neighbors.has(n.id) && n.worldClass === "periphery" && n.unrest > 40
    );
    if (affected.length > 0) {
      const target = affected[Math.floor(Math.random() * affected.length)];
      target.unrest = Math.min(100, target.unrest + 10);
      target.stability = Math.max(5, target.stability - 5);
      effects.push({
        type: "revolution",
        text: `${nation.name}: Propaganda socialista inflama descontento en ${target.name}`,
        nationId: nation.id,
      });
    }
  }

  return effects;
}

function nationalismEdgeMod(volume: number, fromClass: string, _toClass: string): number {
  // Nationalism: prefer domestic production, weaken foreign trade
  // Strengthens within-region trade, weakens long-distance
  return fromClass === "core" ? volume * 0.95 : volume * 0.9;
}

function nationalismEffect(
  nation: NationNode, _nations: NationNode[], edges: TradeEdge[]
): IdeologyEffect[] {
  const effects: IdeologyEffect[] = [];

  // Nationalism: military buildup
  nation.militaryPower = Math.min(100, nation.militaryPower + 1.5);

  // Nationalism: raise tariffs on everyone
  for (const e of edges) {
    if (e.from === nation.id || e.to === nation.id) {
      e.tariffRate = Math.min(0.5, e.tariffRate + 0.015);
    }
  }

  // National identity: cultural power boost
  nation.culturalPower = Math.min(100, nation.culturalPower + 0.5);

  // Event: territorial ambition
  if (Math.random() < 0.02 && nation.militaryPower > 60) {
    effects.push({
      type: "war",
      text: `${nation.name}: Movilización militar — ambición expansionista`,
      nationId: nation.id,
    });
  }

  return effects;
}

function conservatismEdgeMod(volume: number, _fromClass: string, _toClass: string): number {
  // Conservatism: maintains existing trade patterns, slightly resists change
  return volume * 0.98;
}

function conservatismEffect(
  nation: NationNode, _nations: NationNode[], edges: TradeEdge[]
): IdeologyEffect[] {
  const effects: IdeologyEffect[] = [];

  // Conservatism: stability through order
  nation.stability = Math.min(95, nation.stability + 1.5);
  nation.unrest = Math.max(0, nation.unrest - 2);

  // Slow but steady industrialization
  nation.industrialization = Math.min(100, nation.industrialization + 0.05);

  // Maintain traditional tariffs (resist change)
  for (const e of edges) {
    if (e.from === nation.id || e.to === nation.id) {
      // Move toward 0.15 (moderate protectionism)
      e.tariffRate += (0.15 - e.tariffRate) * 0.05;
    }
  }

  // Event: reaction against liberal spread
  if (Math.random() < 0.02 && nation.culturalPower > 50) {
    effects.push({
      type: "ideology",
      text: `${nation.name}: Movimiento conservador resiste cambio liberal`,
      nationId: nation.id,
    });
  }

  return effects;
}

function absolutismEdgeMod(volume: number, fromClass: string, toClass: string): number {
  // Absolutism: concentrates trade through the state
  // Weakens periphery trade (keeps colonies dependent)
  if (fromClass === "periphery") return volume * 0.85;
  if (toClass === "periphery") return volume * 1.05; // extraction
  return volume * 0.95;
}

function absolutismEffect(
  nation: NationNode, nations: NationNode[], edges: TradeEdge[]
): IdeologyEffect[] {
  const effects: IdeologyEffect[] = [];

  // Absolutism: centralize power, suppress dissent
  nation.unrest = Math.max(0, nation.unrest - 8);
  nation.stability = Math.min(95, nation.stability + 3);
  nation.militaryPower = Math.min(100, nation.militaryPower + 0.5);

  // Suppress social mobility
  nation.socialClasses.elite = Math.min(20, nation.socialClasses.elite + 0.1);
  nation.socialClasses.peasant = Math.min(90, nation.socialClasses.peasant + 0.1);

  // Event: autocratic decree
  if (Math.random() < 0.03) {
    // Restrict trade to state-controlled routes
    const nationsToDrop = nations.filter((n) => {
      if (n.id === nation.id) return false;
      return edges.some(
        (e) =>
          ((e.from === nation.id && e.to === n.id) ||
           (e.to === nation.id && e.from === n.id)) &&
          e.volume < 20
      );
    });

    if (nationsToDrop.length > 0) {
      const target = nationsToDrop[Math.floor(Math.random() * nationsToDrop.length)];
      // Reduce weak trade routes
      for (let i = edges.length - 1; i >= 0; i--) {
        const e = edges[i];
        if (
          ((e.from === nation.id && e.to === target.id) ||
           (e.to === nation.id && e.from === target.id)) &&
          e.volume < 20
        ) {
          e.volume = Math.max(1, e.volume - 5);
        }
      }
      effects.push({
        type: "diplomacy",
        text: `${nation.name}: Decreto absolutista restringe comercio con ${target.name}`,
        nationId: nation.id,
      });
    }
  }

  return effects;
}

// ─── Ideology Registry ──────────────────────────────────────

export const IDEOLOGY_PROFILES: Record<Ideology, IdeologyProfile> = {
  mercantilism: {
    productionMod: 1.15,
    openness: 0.4,
    idealTariff: 0.25,
    culturalPressure: 0.8,
    susceptibility: 0.5,
    militaryPriority: 0.6,
    industrialBonus: 0.3,
    socialMobility: 0.4,
    stabilityBonus: 5,
    unrestGeneration: 0.2,
    exportAffinity: "manufactured",
    graphMechanic:
      "Fomenta flujos de exportación a periferia, acumula metales preciosos. " +
      "Aranceles altos a importaciones manufacturadas, bajos a materias primas. " +
      "Genera extracción colonial y competencia por mercados.",
    edgeWeightModifier: mercantilismEdgeMod,
    ideologicalEffect: mercantilismEffect,
  },
  liberalism: {
    productionMod: 1.10,
    openness: 0.9,
    idealTariff: 0.03,
    culturalPressure: 0.9,
    susceptibility: 0.6,
    militaryPriority: 0.3,
    industrialBonus: 0.5,
    socialMobility: 0.8,
    stabilityBonus: -5,
    unrestGeneration: 0.4,
    exportAffinity: "luxury",
    graphMechanic:
      "Reduce aranceles globalmente, acelera flujos comerciales. " +
      "La libre competencia acelera industrialización. " +
      "Crea una red densamente conectada pero vulnerable a crisis.",
    edgeWeightModifier: liberalismEdgeMod,
    ideologicalEffect: liberalismEffect,
  },
  marxism: {
    productionMod: 0.90,
    openness: 0.5,
    idealTariff: 0.15,
    culturalPressure: 1.2,
    susceptibility: 0.2,
    militaryPriority: 0.4,
    industrialBonus: 0.4,
    socialMobility: 1.5,
    stabilityBonus: 10,
    unrestGeneration: -0.3,
    exportAffinity: "manufactured",
    graphMechanic:
      "Fortalece aristas entre periferia (solidaridad internacional). " +
      "Debilita flujos de explotación core←periferia. " +
      "Propaga revolución a vecinos con alto descontento.",
    edgeWeightModifier: marxismEdgeMod,
    ideologicalEffect: marxismEffect,
  },
  nationalism: {
    productionMod: 1.12,
    openness: 0.3,
    idealTariff: 0.30,
    culturalPressure: 0.7,
    susceptibility: 0.3,
    militaryPriority: 0.9,
    industrialBonus: 0.4,
    socialMobility: 0.5,
    stabilityBonus: 8,
    unrestGeneration: 0.1,
    exportAffinity: "manufactured",
    graphMechanic:
      "Debilita aristas internacionales, fortalece identidad nacional. " +
      "Preferencia por producción doméstica sobre importación. " +
      "Riesgo de guerras expansionistas.",
    edgeWeightModifier: nationalismEdgeMod,
    ideologicalEffect: nationalismEffect,
  },
  conservatism: {
    productionMod: 0.95,
    openness: 0.5,
    idealTariff: 0.15,
    culturalPressure: 0.4,
    susceptibility: 0.3,
    militaryPriority: 0.5,
    industrialBonus: 0.15,
    socialMobility: 0.2,
    stabilityBonus: 12,
    unrestGeneration: -0.1,
    exportAffinity: "raw",
    graphMechanic:
      "Mantiene patrones comerciales existentes, resiste el cambio. " +
      "Aranceles moderados, estabilidad social alta. " +
      "Industrialización lenta pero estable, reacciona contra spreads liberales.",
    edgeWeightModifier: conservatismEdgeMod,
    ideologicalEffect: conservatismEffect,
  },
  absolutism: {
    productionMod: 0.85,
    openness: 0.2,
    idealTariff: 0.20,
    culturalPressure: 0.3,
    susceptibility: 0.1,
    militaryPriority: 0.7,
    industrialBonus: 0.1,
    socialMobility: 0.1,
    stabilityBonus: 15,
    unrestGeneration: -0.5,
    exportAffinity: "raw",
    graphMechanic:
      "Concentra comercio a través del estado, debilita periferia. " +
      "Suprime disidencia, mantiene orden jerárquico. " +
      "Red de comercio controlada pero aislada.",
    edgeWeightModifier: absolutismEdgeMod,
    ideologicalEffect: absolutismEffect,
  },
};

// ─── Public API ─────────────────────────────────────────────

/**
 * Get the ideology profile for a nation
 */
export function getIdeologyProfile(ideology: Ideology): IdeologyProfile {
  return IDEOLOGY_PROFILES[ideology];
}

/**
 * Apply all ideological effects to the game world (called after ideological spread phase).
 * Each nation's ideology modifies its edges, stats, and may trigger events.
 */
export function applyIdeologicalEffects(
  nations: NationNode[],
  edges: TradeEdge[]
): IdeologyEffect[] {
  const allEffects: IdeologyEffect[] = [];

  for (const nation of nations) {
    const profile = IDEOLOGY_PROFILES[nation.ideology];

    // Apply edge weight modifiers
    for (const e of edges) {
      if (e.from === nation.id) {
        const toNation = nations.find((n) => n.id === e.to);
        if (toNation) {
          const modified = profile.edgeWeightModifier(e.volume, nation.worldClass, toNation.worldClass);
          e.volume = Math.max(1, e.volume + (modified - e.volume) * 0.02); // gentle drift
        }
      }
    }

    // Apply per-turn ideological effects
    const effects = profile.ideologicalEffect(nation, nations, edges);
    allEffects.push(...effects);

    // Apply passive bonuses
    nation.stability = Math.min(
      95,
      Math.max(5, nation.stability + profile.stabilityBonus * 0.01)
    );
    nation.unrest = Math.min(
      100,
      Math.max(0, nation.unrest + profile.unrestGeneration * 0.5)
    );
  }

  return allEffects;
}

/**
 * Compute ideological affinity between two nations (0-1).
 * Higher = more compatible trade partners.
 */
export function ideologicalAffinity(a: Ideology, b: Ideology): number {
  if (a === b) return 1.0;

  // Compatibility matrix
  const compat: Record<Ideology, Record<Ideology, number>> = {
    mercantilism: {
      mercantilism: 1.0, liberalism: 0.6, marxism: 0.2,
      nationalism: 0.7, conservatism: 0.8, absolutism: 0.9,
    },
    liberalism: {
      mercantilism: 0.6, liberalism: 1.0, marxism: 0.4,
      nationalism: 0.3, conservatism: 0.5, absolutism: 0.2,
    },
    marxism: {
      mercantilism: 0.2, liberalism: 0.4, marxism: 1.0,
      nationalism: 0.3, conservatism: 0.2, absolutism: 0.1,
    },
    nationalism: {
      mercantilism: 0.7, liberalism: 0.3, marxism: 0.3,
      nationalism: 1.0, conservatism: 0.6, absolutism: 0.5,
    },
    conservatism: {
      mercantilism: 0.8, liberalism: 0.5, marxism: 0.2,
      nationalism: 0.6, conservatism: 1.0, absolutism: 0.8,
    },
    absolutism: {
      mercantilism: 0.9, liberalism: 0.2, marxism: 0.1,
      nationalism: 0.5, conservatism: 0.8, absolutism: 1.0,
    },
  };

  return compat[a]?.[b] ?? 0.5;
}

/**
 * Compute the dominant ideology in a nation's trade neighborhood.
 * Used for ideological pressure calculations.
 */
export function neighborhoodIdeologyPressure(
  nation: NationNode,
  nations: NationNode[],
  edges: TradeEdge[]
): Map<Ideology, number> {
  const pressure = new Map<Ideology, number>();

  for (const e of edges) {
    const partnerId = e.from === nation.id ? e.to : e.from;
    if (partnerId === nation.id) continue;

    const partner = nations.find((n) => n.id === partnerId);
    if (!partner) continue;

    const profile = IDEOLOGY_PROFILES[partner.ideology];
    const pressureValue = profile.culturalPressure * Math.sqrt(e.volume) * 0.01;
    pressure.set(
      partner.ideology,
      (pressure.get(partner.ideology) ?? 0) + pressureValue
    );
  }

  return pressure;
}
