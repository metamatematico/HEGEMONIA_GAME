// ============================================================
// Hegemonía Core Engine — Ideology Mechanics
// ============================================================
// Each of the 12 ideologies has unique graph mechanics that
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
      (n) => n.id !== nation.id && n.primaryIdeology !== "absolutism"
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

function imperialismEdgeMod(volume: number, fromClass: string, _toClass: string): number {
  // Imperialism: boosts extraction from periphery (colonial exploitation)
  if (fromClass === "periphery") return volume * 1.2;
  return volume * 1.0;
}

function imperialismEffect(
  nation: NationNode, nations: NationNode[], edges: TradeEdge[]
): IdeologyEffect[] {
  const effects: IdeologyEffect[] = [];

  // Imperialism: actively extract resources from periphery neighbors
  for (const e of edges) {
    if (e.from === nation.id) {
      const toNation = nations.find((n) => n.id === e.to);
      if (toNation && toNation.worldClass === "periphery") {
        // Increase extraction volume
        e.volume = Math.min(500, e.volume * 1.03);
      }
    }
  }

  // Military buildup for imperial power
  nation.militaryPower = Math.min(100, nation.militaryPower + 1.0);

  // Reduce colonial stability in periphery neighbors
  const neighbors = new Set<string>();
  for (const e of edges) {
    if (e.from === nation.id) neighbors.add(e.to);
    if (e.to === nation.id) neighbors.add(e.from);
  }
  for (const neighborId of neighbors) {
    const neighbor = nations.find((n) => n.id === neighborId);
    if (neighbor && neighbor.worldClass === "periphery") {
      neighbor.stability = Math.max(5, neighbor.stability - 0.5);
    }
  }

  // Event: colonial expansion / resource seizure
  if (Math.random() < 0.03 && nation.militaryPower > 40) {
    const colonies = nations.filter(
      (n) => n.worldClass === "periphery" && n.id !== nation.id && neighbors.has(n.id)
    );
    if (colonies.length > 0) {
      const colony = colonies[Math.floor(Math.random() * colonies.length)];
      colony.resources.grain = Math.max(5, colony.resources.grain - 2);
      colony.resources.coal = Math.max(5, colony.resources.coal - 1);
      colony.stability = Math.max(5, colony.stability - 3);
      nation.gdp += 0.02;
      effects.push({
        type: "trade",
        text: `${nation.name}: Extracción imperialista de recursos en ${colony.name}`,
        nationId: nation.id,
      });
    }
  }

  return effects;
}

function constitutionalismEdgeMod(_volume: number, _fromClass: string, _toClass: string): number {
  // Constitutionalism: slight general boost from rule-of-law stability
  return _volume * 1.03;
}

function constitutionalismEffect(
  nation: NationNode, nations: NationNode[], edges: TradeEdge[]
): IdeologyEffect[] {
  const effects: IdeologyEffect[] = [];

  // Constitutionalism: gradual industrialization through rule of law
  nation.industrialization = Math.min(100, nation.industrialization + 0.12);
  nation.stability = Math.min(95, nation.stability + 1.0);

  // Stable tariffs: gently move toward ideal
  for (const e of edges) {
    if (e.from === nation.id || e.to === nation.id) {
      e.tariffRate += (0.10 - e.tariffRate) * 0.03;
    }
  }

  // Social mobility: constitutional protections
  nation.socialClasses.middle = Math.min(40, nation.socialClasses.middle + 0.1);
  nation.socialClasses.peasant = Math.max(5, nation.socialClasses.peasant - 0.05);

  // Event: constitutional reform strengthening trade
  if (Math.random() < 0.03) {
    const partners = nations.filter(
      (n) => n.id !== nation.id && edges.some(
        (e) => (e.from === nation.id && e.to === n.id) || (e.to === nation.id && e.from === n.id)
      )
    );
    if (partners.length > 0) {
      const partner = partners[Math.floor(Math.random() * partners.length)];
      for (const e of edges) {
        if (
          (e.from === nation.id && e.to === partner.id) ||
          (e.to === nation.id && e.from === partner.id)
        ) {
          e.volume = Math.min(500, e.volume * 1.08);
          effects.push({
            type: "diplomacy",
            text: `${nation.name}: Reforma constitucional fortalece comercio con ${partner.name}`,
            nationId: nation.id,
          });
          return effects;
        }
      }
    }
  }

  return effects;
}

function progressivismEdgeMod(volume: number, fromClass: string, toClass: string): number {
  // Progressivism: boosts trade between core and semi (reform-driven integration)
  if (
    (fromClass === "core" && toClass === "semi") ||
    (fromClass === "semi" && toClass === "core")
  ) return volume * 1.05;
  return volume * 1.0;
}

function progressivismEffect(
  nation: NationNode, _nations: NationNode[], edges: TradeEdge[]
): IdeologyEffect[] {
  const effects: IdeologyEffect[] = [];

  // Progressivism: social mobility boost
  nation.socialClasses.working = Math.min(55, nation.socialClasses.working + 0.2);
  nation.socialClasses.middle = Math.min(40, nation.socialClasses.middle + 0.15);
  nation.socialClasses.peasant = Math.max(5, nation.socialClasses.peasant - 0.15);

  // Industrialization through reform
  nation.industrialization = Math.min(100, nation.industrialization + 0.15);

  // Progressive tariffs: lower barriers
  for (const e of edges) {
    if (e.from === nation.id || e.to === nation.id) {
      e.tariffRate = Math.max(0.01, e.tariffRate * 0.97);
    }
  }

  // Event: social reform
  if (Math.random() < 0.04) {
    nation.unrest = Math.max(0, nation.unrest - 5);
    nation.stability = Math.min(95, nation.stability + 2);
    effects.push({
      type: "ideology",
      text: `${nation.name}: Reforma progresiva reduce descontento social`,
      nationId: nation.id,
    });
  }

  return effects;
}

function anarchismEdgeMod(volume: number, fromClass: string, toClass: string): number {
  // Anarchism: strengthens periphery-periphery solidarity, weakens core involvement
  if (fromClass === "periphery" && toClass === "periphery") return volume * 1.2;
  if (fromClass === "core" || toClass === "core") return volume * 0.85;
  return volume * 1.0;
}

function anarchismEffect(
  nation: NationNode, nations: NationNode[], edges: TradeEdge[]
): IdeologyEffect[] {
  const effects: IdeologyEffect[] = [];

  // Anarchism: massive social mobility
  nation.socialClasses.working = Math.min(55, nation.socialClasses.working + 0.3);
  nation.socialClasses.middle = Math.min(40, nation.socialClasses.middle + 0.2);
  nation.socialClasses.elite = Math.max(2, nation.socialClasses.elite - 0.15);
  nation.socialClasses.peasant = Math.max(5, nation.socialClasses.peasant - 0.25);

  // Unrest reduction through mutual aid
  nation.unrest = Math.max(0, nation.unrest - 3);
  nation.stability = Math.min(95, nation.stability + 0.5);

  // Near-zero tariffs (anti-state)
  for (const e of edges) {
    if (e.from === nation.id || e.to === nation.id) {
      e.tariffRate = Math.max(0.01, e.tariffRate * 0.95);
    }
  }

  // Event: mutual aid network with periphery
  if (Math.random() < 0.04) {
    const neighbors = new Set<string>();
    for (const e of edges) {
      if (e.from === nation.id) neighbors.add(e.to);
      if (e.to === nation.id) neighbors.add(e.from);
    }
    const peripheryAllies = nations.filter(
      (n) => neighbors.has(n.id) && n.worldClass === "periphery"
    );
    if (peripheryAllies.length > 0) {
      const ally = peripheryAllies[Math.floor(Math.random() * peripheryAllies.length)];
      ally.unrest = Math.max(0, ally.unrest - 5);
      ally.stability = Math.min(95, ally.stability + 2);
      for (const e of edges) {
        if (
          (e.from === nation.id && e.to === ally.id) ||
          (e.to === nation.id && e.from === ally.id)
        ) {
          e.volume = Math.min(500, e.volume * 1.15);
        }
      }
      effects.push({
        type: "trade",
        text: `${nation.name}: Red de ayuda mutua con ${ally.name}`,
        nationId: nation.id,
      });
    }
  }

  return effects;
}

function theocracyEdgeMod(_volume: number, _fromClass: string, _toClass: string): number {
  // Theocracy: neutral trade modifier — power comes from stability and culture, not trade
  return _volume * 1.0;
}

function theocracyEffect(
  nation: NationNode, nations: NationNode[], edges: TradeEdge[]
): IdeologyEffect[] {
  const effects: IdeologyEffect[] = [];

  // Theocracy: massive stability from religious authority
  nation.stability = Math.min(95, nation.stability + 2.5);
  nation.unrest = Math.max(0, nation.unrest - 4);

  // Cultural power growth through religious institutions
  nation.culturalPower = Math.min(100, nation.culturalPower + 1.0);

  // Suppress social mobility (rigid hierarchy)
  nation.socialClasses.peasant = Math.min(90, nation.socialClasses.peasant + 0.1);
  nation.socialClasses.elite = Math.min(20, nation.socialClasses.elite + 0.05);

  // Maintain moderate tariffs
  for (const e of edges) {
    if (e.from === nation.id || e.to === nation.id) {
      e.tariffRate += (0.18 - e.tariffRate) * 0.04;
    }
  }

  // Event: religious mission / cultural spread to neighbors
  if (Math.random() < 0.04 && nation.culturalPower > 40) {
    const neighbors = new Set<string>();
    for (const e of edges) {
      if (e.from === nation.id) neighbors.add(e.to);
      if (e.to === nation.id) neighbors.add(e.from);
    }
    const targets = nations.filter(
      (n) => neighbors.has(n.id) && n.id !== nation.id
    );
    if (targets.length > 0) {
      const target = targets[Math.floor(Math.random() * targets.length)];
      // Religious influence spreads
      target.culturalPower = Math.min(100, target.culturalPower * 1.05);
      if (target.worldClass === "periphery") {
        target.stability = Math.min(95, target.stability + 2);
      }
      effects.push({
        type: "ideology",
        text: `${nation.name}: Misión religiosa extiende influencia en ${target.name}`,
        nationId: nation.id,
      });
    }
  }

  return effects;
}

function syndicalismEdgeMod(volume: number, fromClass: string, toClass: string): number {
  // Syndicalism: boosts trade between periphery nations (worker solidarity)
  if (fromClass === "periphery" || toClass === "periphery") return volume * 1.15;
  return volume * 1.0;
}

function syndicalismEffect(
  nation: NationNode, nations: NationNode[], edges: TradeEdge[]
): IdeologyEffect[] {
  const effects: IdeologyEffect[] = [];

  // Syndicalism: boost working class, reduce elite
  nation.socialClasses.working = Math.min(55, nation.socialClasses.working + 0.25);
  nation.socialClasses.elite = Math.max(2, nation.socialClasses.elite - 0.1);

  // Industrial growth through worker-owned production
  nation.industrialization = Math.min(100, nation.industrialization + 0.13);

  // Moderate tariffs for self-sufficiency
  for (const e of edges) {
    if (e.from === nation.id || e.to === nation.id) {
      e.tariffRate += (0.12 - e.tariffRate) * 0.03;
    }
  }

  // Stability from worker satisfaction
  nation.stability = Math.min(95, nation.stability + 1.0);
  nation.unrest = Math.max(0, nation.unrest - 2);

  // Event: workers' council strengthens solidarity
  if (Math.random() < 0.04) {
    const neighbors = new Set<string>();
    for (const e of edges) {
      if (e.from === nation.id) neighbors.add(e.to);
      if (e.to === nation.id) neighbors.add(e.from);
    }
    const workerAllies = nations.filter(
      (n) => neighbors.has(n.id) && n.worldClass === "periphery"
    );
    if (workerAllies.length > 0) {
      const ally = workerAllies[Math.floor(Math.random() * workerAllies.length)];
      ally.socialClasses.working = Math.min(55, ally.socialClasses.working + 0.5);
      ally.unrest = Math.max(0, ally.unrest - 3);
      for (const e of edges) {
        if (
          (e.from === nation.id && e.to === ally.id) ||
          (e.to === nation.id && e.from === ally.id)
        ) {
          e.volume = Math.min(500, e.volume * 1.1);
        }
      }
      effects.push({
        type: "trade",
        text: `${nation.name}: Consejo obrero fortalece solidaridad con ${ally.name}`,
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
  imperialism: {
    productionMod: 1.10,
    openness: 0.35,
    idealTariff: 0.20,
    culturalPressure: 0.6,
    susceptibility: 0.2,
    militaryPriority: 0.95,
    industrialBonus: 0.3,
    socialMobility: 0.3,
    stabilityBonus: 5,
    unrestGeneration: 0.3,
    exportAffinity: "raw",
    graphMechanic:
      "Extrae activamente recursos de la periferia colonial. " +
      "Fortalecimiento militar continuo, reduce estabilidad colonial. " +
      "Flujos de extracción amplificados desde periferia (×1.2).",
    edgeWeightModifier: imperialismEdgeMod,
    ideologicalEffect: imperialismEffect,
  },
  constitutionalism: {
    productionMod: 1.05,
    openness: 0.7,
    idealTariff: 0.10,
    culturalPressure: 0.7,
    susceptibility: 0.4,
    militaryPriority: 0.4,
    industrialBonus: 0.35,
    socialMobility: 0.7,
    stabilityBonus: 8,
    unrestGeneration: 0.1,
    exportAffinity: "manufactured",
    graphMechanic:
      "Industrialización gradual a través del estado de derecho. " +
      "Aranceles estables y predecibles, reforma constitucional. " +
      "Ligero boost general al comercio (×1.03).",
    edgeWeightModifier: constitutionalismEdgeMod,
    ideologicalEffect: constitutionalismEffect,
  },
  progressivism: {
    productionMod: 1.08,
    openness: 0.6,
    idealTariff: 0.08,
    culturalPressure: 0.8,
    susceptibility: 0.5,
    militaryPriority: 0.3,
    industrialBonus: 0.5,
    socialMobility: 1.2,
    stabilityBonus: 3,
    unrestGeneration: -0.2,
    exportAffinity: "manufactured",
    graphMechanic:
      "Impulso de movilidad social e industrialización por reformas. " +
      "Fortalece comercio entre core y semi-periferia (×1.05). " +
      "Reduce aranceles progresivamente.",
    edgeWeightModifier: progressivismEdgeMod,
    ideologicalEffect: progressivismEffect,
  },
  anarchism: {
    productionMod: 0.75,
    openness: 0.95,
    idealTariff: 0.01,
    culturalPressure: 1.3,
    susceptibility: 0.1,
    militaryPriority: 0.1,
    industrialBonus: 0.2,
    socialMobility: 2.0,
    stabilityBonus: -5,
    unrestGeneration: -0.4,
    exportAffinity: "luxury",
    graphMechanic:
      "Movilidad social masiva, redes de ayuda mutua. " +
      "Fortalece periferia-periferia (×1.2), debilita vínculos core (×0.85). " +
      "Reducción de descontento a través de la solidaridad.",
    edgeWeightModifier: anarchismEdgeMod,
    ideologicalEffect: anarchismEffect,
  },
  theocracy: {
    productionMod: 0.88,
    openness: 0.3,
    idealTariff: 0.18,
    culturalPressure: 1.0,
    susceptibility: 0.15,
    militaryPriority: 0.6,
    industrialBonus: 0.1,
    socialMobility: 0.15,
    stabilityBonus: 15,
    unrestGeneration: -0.6,
    exportAffinity: "raw",
    graphMechanic:
      "Estabilidad masiva desde la autoridad religiosa. " +
      "Crecimiento del poder cultural, jerarquía rígida. " +
      "Trade neutral — el poder viene de la estabilidad, no del comercio.",
    edgeWeightModifier: theocracyEdgeMod,
    ideologicalEffect: theocracyEffect,
  },
  syndicalism: {
    productionMod: 0.85,
    openness: 0.55,
    idealTariff: 0.12,
    culturalPressure: 0.9,
    susceptibility: 0.25,
    militaryPriority: 0.35,
    industrialBonus: 0.4,
    socialMobility: 1.3,
    stabilityBonus: 7,
    unrestGeneration: -0.3,
    exportAffinity: "manufactured",
    graphMechanic:
      "Fortalece clase trabajadora, crecimiento industrial colectivo. " +
      "Solidaridad obrera con periferia (×1.15). " +
      "Consejos obreros fortalecen la cooperación internacional.",
    edgeWeightModifier: syndicalismEdgeMod,
    ideologicalEffect: syndicalismEffect,
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
    const profile = IDEOLOGY_PROFILES[nation.primaryIdeology];

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

  // Compatibility matrix (12 ideologies)
  const compat: Record<Ideology, Record<Ideology, number>> = {
    mercantilism: {
      mercantilism: 1.0, liberalism: 0.6, marxism: 0.2,
      nationalism: 0.7, conservatism: 0.8, absolutism: 0.9,
      imperialism: 0.95, constitutionalism: 0.5, progressivism: 0.3,
      anarchism: 0.1, theocracy: 0.6, syndicalism: 0.15,
    },
    liberalism: {
      mercantilism: 0.6, liberalism: 1.0, marxism: 0.4,
      nationalism: 0.3, conservatism: 0.5, absolutism: 0.2,
      imperialism: 0.3, constitutionalism: 0.9, progressivism: 0.85,
      anarchism: 0.5, theocracy: 0.2, syndicalism: 0.35,
    },
    marxism: {
      mercantilism: 0.2, liberalism: 0.4, marxism: 1.0,
      nationalism: 0.3, conservatism: 0.2, absolutism: 0.1,
      imperialism: 0.1, constitutionalism: 0.4, progressivism: 0.7,
      anarchism: 0.6, theocracy: 0.05, syndicalism: 0.85,
    },
    nationalism: {
      mercantilism: 0.7, liberalism: 0.3, marxism: 0.3,
      nationalism: 1.0, conservatism: 0.6, absolutism: 0.5,
      imperialism: 0.8, constitutionalism: 0.4, progressivism: 0.3,
      anarchism: 0.15, theocracy: 0.5, syndicalism: 0.25,
    },
    conservatism: {
      mercantilism: 0.8, liberalism: 0.5, marxism: 0.2,
      nationalism: 0.6, conservatism: 1.0, absolutism: 0.8,
      imperialism: 0.7, constitutionalism: 0.75, progressivism: 0.4,
      anarchism: 0.05, theocracy: 0.85, syndicalism: 0.15,
    },
    absolutism: {
      mercantilism: 0.9, liberalism: 0.2, marxism: 0.1,
      nationalism: 0.5, conservatism: 0.8, absolutism: 1.0,
      imperialism: 0.85, constitutionalism: 0.3, progressivism: 0.15,
      anarchism: 0.05, theocracy: 0.9, syndicalism: 0.1,
    },
    imperialism: {
      mercantilism: 0.95, liberalism: 0.3, marxism: 0.1,
      nationalism: 0.8, conservatism: 0.7, absolutism: 0.85,
      imperialism: 1.0, constitutionalism: 0.35, progressivism: 0.2,
      anarchism: 0.05, theocracy: 0.55, syndicalism: 0.1,
    },
    constitutionalism: {
      mercantilism: 0.5, liberalism: 0.9, marxism: 0.4,
      nationalism: 0.4, conservatism: 0.75, absolutism: 0.3,
      imperialism: 0.35, constitutionalism: 1.0, progressivism: 0.85,
      anarchism: 0.3, theocracy: 0.35, syndicalism: 0.4,
    },
    progressivism: {
      mercantilism: 0.3, liberalism: 0.85, marxism: 0.7,
      nationalism: 0.3, conservatism: 0.4, absolutism: 0.15,
      imperialism: 0.2, constitutionalism: 0.85, progressivism: 1.0,
      anarchism: 0.55, theocracy: 0.15, syndicalism: 0.7,
    },
    anarchism: {
      mercantilism: 0.1, liberalism: 0.5, marxism: 0.6,
      nationalism: 0.15, conservatism: 0.05, absolutism: 0.05,
      imperialism: 0.05, constitutionalism: 0.3, progressivism: 0.55,
      anarchism: 1.0, theocracy: 0.05, syndicalism: 0.6,
    },
    theocracy: {
      mercantilism: 0.6, liberalism: 0.2, marxism: 0.05,
      nationalism: 0.5, conservatism: 0.85, absolutism: 0.9,
      imperialism: 0.55, constitutionalism: 0.35, progressivism: 0.15,
      anarchism: 0.05, theocracy: 1.0, syndicalism: 0.1,
    },
    syndicalism: {
      mercantilism: 0.15, liberalism: 0.35, marxism: 0.85,
      nationalism: 0.25, conservatism: 0.15, absolutism: 0.1,
      imperialism: 0.1, constitutionalism: 0.4, progressivism: 0.7,
      anarchism: 0.6, theocracy: 0.1, syndicalism: 1.0,
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

    const profile = IDEOLOGY_PROFILES[partner.primaryIdeology];
    const pressureValue = profile.culturalPressure * Math.sqrt(e.volume) * 0.01;
    pressure.set(
      partner.primaryIdeology,
      (pressure.get(partner.primaryIdeology) ?? 0) + pressureValue
    );
  }

  return pressure;
}
