// ============================================================
// Hegemonía Core Engine — Graph Algorithms
// ============================================================
// Centrality metrics: eigenvector, betweenness, degree
// Community detection: simplified modularity-based

import type { NationNode, TradeEdge } from "./types";

/**
 * Build adjacency list from edges (bidirectional)
 */
export function buildAdjacency(nations: NationNode[], edges: TradeEdge[]): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  for (const n of nations) adj.set(n.id, new Set());
  for (const e of edges) {
    adj.get(e.from)?.add(e.to);
    adj.get(e.to)?.add(e.from);
  }
  return adj;
}

/**
 * Build weighted adjacency list (trade volumes)
 */
export function buildWeightedAdj(nations: NationNode[], edges: TradeEdge[]): Map<string, Map<string, number>> {
  const adj = new Map<string, Map<string, number>>();
  for (const n of nations) adj.set(n.id, new Map());
  for (const e of edges) {
    const fromMap = adj.get(e.from);
    const toMap = adj.get(e.to);
    if (fromMap) fromMap.set(e.to, (fromMap.get(e.to) ?? 0) + e.volume);
    if (toMap) toMap.set(e.from, (toMap.get(e.from) ?? 0) + e.volume);
  }
  return adj;
}

/**
 * Degree centrality (weighted by trade volume)
 */
export function degreeCentrality(nationId: string, weightedAdj: Map<string, Map<string, number>>, maxVol: number): number {
  const neighbors = weightedAdj.get(nationId);
  if (!neighbors || neighbors.size === 0) return 0;
  let totalVol = 0;
  for (const vol of neighbors.values()) totalVol += vol;
  return Math.min(1, totalVol / (maxVol * 3)); // normalized
}

/**
 * Power Iteration for Eigenvector Centrality
 * Iteratively: x(t+1) = A * x(t) / ||A * x(t)||
 * Where A is the weighted adjacency matrix
 * Converges in ~50 iterations for typical game graphs
 */
export function eigenvectorCentrality(
  nations: NationNode[],
  edges: TradeEdge[],
  iterations: number = 60,
  tolerance: number = 1e-6
): Map<string, number> {
  const ids = nations.map((n) => n.id);
  const n = ids.length;
  if (n === 0) return new Map();

  const weightedAdj = buildWeightedAdj(nations, edges);

  // Initialize: uniform
  const x = new Float64Array(n).fill(1 / n);

  // Row-normalize adjacency for matrix multiply
  const rowNorms = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const neighbors = weightedAdj.get(ids[i]);
    let sum = 0;
    if (neighbors) for (const v of neighbors.values()) sum += v;
    rowNorms[i] = sum || 1;
  }

  for (let iter = 0; iter < iterations; iter++) {
    // x_new = A_normalized^T * x
    const xNew = new Float64Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      const neighbors = weightedAdj.get(ids[j]);
      if (!neighbors) continue;
      for (const [neighborId, weight] of neighbors) {
        const ni = ids.indexOf(neighborId);
        if (ni >= 0) {
          xNew[ni] += x[j] * (weight / rowNorms[j]);
        }
      }
    }

    // Normalize
    let norm = 0;
    for (let i = 0; i < n; i++) norm += xNew[i] * xNew[i];
    norm = Math.sqrt(norm) || 1;
    for (let i = 0; i < n; i++) xNew[i] /= norm;

    // Check convergence
    let diff = 0;
    for (let i = 0; i < n; i++) diff += Math.abs(xNew[i] - x[i]);
    x.set(xNew);

    if (diff < tolerance) break;
  }

  // Normalize to 0-1
  let maxVal = 0;
  for (let i = 0; i < n; i++) maxVal = Math.max(maxVal, x[i]);
  if (maxVal === 0) maxVal = 1;

  const result = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    result.set(ids[i], x[i] / maxVal);
  }
  return result;
}

/**
 * Betweenness Centrality (Brandes algorithm, simplified)
 * Measures how often a node lies on shortest paths between others.
 * Uses BFS-based shortest paths on the weighted graph (inverse weights).
 */
export function betweennessCentrality(nations: NationNode[], edges: TradeEdge[]): Map<string, number> {
  const ids = nations.map((n) => n.id);
  const n = ids.length;
  if (n === 0) return new Map();

  const adj = buildAdjacency(nations, edges);
  const weightedAdj = buildWeightedAdj(nations, edges);

  // Build weight matrix (inverse: higher trade = shorter distance)
  const weights = new Map<string, number>();
  let maxW = 1;
  for (const e of edges) {
    const key = `${e.from}-${e.to}`;
    weights.set(key, e.volume);
    maxW = Math.max(maxW, e.volume);
  }

  const CB = new Float64Array(n).fill(0);

  for (let s = 0; s < n; s++) {
    // BFS from s
    const dist = new Float64Array(n).fill(Infinity);
    const sigma = new Float64Array(n).fill(0);
    const delta = new Float64Array(n).fill(0);
    const pred: number[][] = Array.from({ length: n }, () => []);
    const S: number[] = []; // stack
    const Q: number[] = [s]; // queue

    dist[s] = 0;
    sigma[s] = 1;

    while (Q.length > 0) {
      const v = Q.shift()!;
      S.push(v);
      const neighbors = adj.get(ids[v]);
      if (!neighbors) continue;

      for (const nid of neighbors) {
        const w = ids.indexOf(nid);
        if (w < 0) continue;

        // Use inverse weight for distance (more trade = closer)
        const eKey1 = `${ids[v]}-${nid}`;
        const eKey2 = `${nid}-${ids[v]}`;
        const vol = weights.get(eKey1) ?? weights.get(eKey2) ?? 1;
        const edgeDist = 1 + (maxW - vol) / maxW; // inverse: high vol = low dist

        if (dist[w] > dist[v] + edgeDist) {
          dist[w] = dist[v] + edgeDist;
          sigma[w] = sigma[v];
          pred[w] = [v];
          Q.push(w);
        } else if (Math.abs(dist[w] - (dist[v] + edgeDist)) < 1e-9) {
          sigma[w] += sigma[v];
          pred[w].push(v);
        }
      }
    }

    // Accumulation (back-propagation)
    while (S.length > 0) {
      const w = S.pop()!;
      for (const v of pred[w]) {
        delta[v] += (sigma[v] / (sigma[w] || 1)) * (1 + delta[w]);
      }
      if (w !== s) CB[w] += delta[w];
    }
  }

  // Normalize to 0-1
  let maxCB = 0;
  for (let i = 0; i < n; i++) maxCB = Math.max(maxCB, CB[i]);
  if (maxCB === 0) maxCB = 1;

  const result = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    result.set(ids[i], CB[i] / maxCB);
  }
  return result;
}

/**
 * PageRank centrality (alternative, useful for trade network influence)
 */
export function pageRank(
  nations: NationNode[],
  edges: TradeEdge[],
  damping: number = 0.85,
  iterations: number = 40
): Map<string, number> {
  const ids = nations.map((n) => n.id);
  const n = ids.length;
  if (n === 0) return new Map();

  const weightedAdj = buildWeightedAdj(nations, edges);

  // Out-weight sums
  const outWeight = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const neighbors = weightedAdj.get(ids[i]);
    if (neighbors) for (const v of neighbors.values()) outWeight[i] += v;
  }

  // Initialize
  const pr = new Float64Array(n).fill(1 / n);

  for (let iter = 0; iter < iterations; iter++) {
    const prNew = new Float64Array(n).fill((1 - damping) / n);

    for (let j = 0; j < n; j++) {
      const neighbors = weightedAdj.get(ids[j]);
      if (!neighbors) continue;
      for (const [neighborId, weight] of neighbors) {
        const ni = ids.indexOf(neighborId);
        if (ni >= 0 && outWeight[j] > 0) {
          prNew[ni] += damping * pr[j] * (weight / outWeight[j]);
        }
      }
    }

    pr.set(prNew);
  }

  let maxVal = 0;
  for (let i = 0; i < n; i++) maxVal = Math.max(maxVal, pr[i]);
  if (maxVal === 0) maxVal = 1;

  const result = new Map<string, number>();
  for (let i = 0; i < n; i++) result.set(ids[i], pr[i] / maxVal);
  return result;
}

/**
 * Compute total trade volume for a nation
 */
export function totalTradeVolume(nationId: string, edges: TradeEdge[]): number {
  let total = 0;
  for (const e of edges) {
    if (e.from === nationId || e.to === nationId) total += e.volume;
  }
  return total;
}

/**
 * Compute trade balance for a nation
 */
export function tradeBalance(nationId: string, edges: TradeEdge[]): number {
  let balance = 0;
  for (const e of edges) {
    if (e.from === nationId) balance += e.volume;
    if (e.to === nationId) balance -= e.volume;
  }
  return balance;
}

/**
 * Get trade partners sorted by volume
 */
export function getTopPartners(
  nationId: string,
  edges: TradeEdge[],
  limit: number = 5
): { partnerId: string; volume: number; direction: "in" | "out" }[] {
  const flows: { partnerId: string; volume: number; direction: "in" | "out" }[] = [];
  for (const e of edges) {
    if (e.from === nationId) flows.push({ partnerId: e.to, volume: e.volume, direction: "out" });
    else if (e.to === nationId) flows.push({ partnerId: e.from, volume: e.volume, direction: "in" });
  }
  flows.sort((a, b) => b.volume - a.volume);
  return flows.slice(0, limit);
}
