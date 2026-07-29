// ============================================================
// Hegemonía Core Engine — Initial World State (Year 1847)
// ============================================================
// 20 nations inspired by historical circa 1847
// Now includes: culturalTrait, secondaryIdeologies

import type { NationNode, TradeEdge } from "./types";

export function createInitialNations(): NationNode[] {
  return [
    { id: "gb", name: "Gran Bretaña", flag: "🇬🇧", worldClass: "core", primaryIdeology: "mercantilism", secondaryIdeologies: ["liberalism", "imperialism"], gdp: 4.2, population: 27.4, tradeBalance: 320, militaryPower: 90, culturalPower: 88, diplomaticPower: 90, x: 46, y: 20, eigenvectorCentrality: 0.94, betweennessCentrality: 0.87, resources: { coal: 85, iron: 78, grain: 35, cotton: 15 }, socialClasses: { elite: 8, middle: 22, working: 45, peasant: 25 }, stability: 72, unrest: 15, industrialization: 75, isPlayer: false, culturalTrait: "seafaring" },
    { id: "fr", name: "Francia", flag: "🇫🇷", worldClass: "core", primaryIdeology: "liberalism", secondaryIdeologies: ["nationalism"], gdp: 3.6, population: 36.0, tradeBalance: 180, militaryPower: 85, culturalPower: 92, diplomaticPower: 85, x: 48, y: 29, eigenvectorCentrality: 0.89, betweennessCentrality: 0.78, resources: { coal: 45, iron: 55, grain: 72, cotton: 20 }, socialClasses: { elite: 6, middle: 18, working: 38, peasant: 38 }, stability: 55, unrest: 35, industrialization: 55, isPlayer: false, culturalTrait: "scholarly" },
    { id: "de", name: "Prusia", flag: "🇩🇪", worldClass: "core", primaryIdeology: "nationalism", secondaryIdeologies: ["absolutism"], gdp: 2.8, population: 34.0, tradeBalance: 95, militaryPower: 92, culturalPower: 80, diplomaticPower: 72, x: 51, y: 23, eigenvectorCentrality: 0.82, betweennessCentrality: 0.74, resources: { coal: 92, iron: 88, grain: 65, cotton: 8 }, socialClasses: { elite: 5, middle: 15, working: 50, peasant: 30 }, stability: 68, unrest: 20, industrialization: 65, isPlayer: false, culturalTrait: "warlike" },
    { id: "nl", name: "Países Bajos", flag: "🇳🇱", worldClass: "core", primaryIdeology: "mercantilism", secondaryIdeologies: ["constitutionalism"], gdp: 1.2, population: 3.1, tradeBalance: 85, militaryPower: 40, culturalPower: 75, diplomaticPower: 80, x: 48, y: 21, eigenvectorCentrality: 0.71, betweennessCentrality: 0.65, resources: { coal: 30, iron: 20, grain: 15, cotton: 5 }, socialClasses: { elite: 10, middle: 35, working: 35, peasant: 20 }, stability: 75, unrest: 10, industrialization: 60, isPlayer: false, culturalTrait: "mercantile" },
    { id: "be", name: "Bélgica", flag: "🇧🇪", worldClass: "core", primaryIdeology: "liberalism", secondaryIdeologies: [], gdp: 0.9, population: 4.6, tradeBalance: 42, militaryPower: 32, culturalPower: 58, diplomaticPower: 48, x: 49, y: 23, eigenvectorCentrality: 0.60, betweennessCentrality: 0.52, resources: { coal: 75, iron: 82, grain: 22, cotton: 12 }, socialClasses: { elite: 7, middle: 20, working: 55, peasant: 18 }, stability: 65, unrest: 18, industrialization: 70, isPlayer: false, culturalTrait: "industrial" },
    { id: "es", name: "España", flag: "🇪🇸", worldClass: "semi", primaryIdeology: "conservatism", secondaryIdeologies: ["theocracy"], gdp: 1.1, population: 15.5, tradeBalance: -30, militaryPower: 50, culturalPower: 60, diplomaticPower: 55, x: 44, y: 33, eigenvectorCentrality: 0.48, betweennessCentrality: 0.55, resources: { coal: 22, iron: 18, grain: 40, cotton: 0 }, socialClasses: { elite: 12, middle: 10, working: 18, peasant: 60 }, stability: 45, unrest: 40, industrialization: 20, isPlayer: false, culturalTrait: "spiritual" },
    { id: "pt", name: "Portugal", flag: "🇵🇹", worldClass: "semi", primaryIdeology: "conservatism", secondaryIdeologies: [], gdp: 0.4, population: 3.8, tradeBalance: -15, militaryPower: 22, culturalPower: 35, diplomaticPower: 32, x: 43, y: 35, eigenvectorCentrality: 0.32, betweennessCentrality: 0.28, resources: { coal: 5, iron: 8, grain: 18, cotton: 0 }, socialClasses: { elite: 15, middle: 8, working: 12, peasant: 65 }, stability: 50, unrest: 35, industrialization: 10, isPlayer: false, culturalTrait: "seafaring" },
    { id: "it", name: "Piamonte", flag: "🇮🇹", worldClass: "semi", primaryIdeology: "nationalism", secondaryIdeologies: ["liberalism"], gdp: 0.7, population: 24.0, tradeBalance: -22, militaryPower: 42, culturalPower: 70, diplomaticPower: 48, x: 52, y: 33, eigenvectorCentrality: 0.45, betweennessCentrality: 0.42, resources: { coal: 12, iron: 25, grain: 48, cotton: 0 }, socialClasses: { elite: 10, middle: 12, working: 20, peasant: 58 }, stability: 42, unrest: 38, industrialization: 25, isPlayer: false, culturalTrait: "diplomatic" },
    { id: "at", name: "Austria", flag: "🇦🇹", worldClass: "semi", primaryIdeology: "conservatism", secondaryIdeologies: ["absolutism"], gdp: 1.3, population: 34.0, tradeBalance: 10, militaryPower: 60, culturalPower: 75, diplomaticPower: 68, x: 53, y: 27, eigenvectorCentrality: 0.58, betweennessCentrality: 0.60, resources: { coal: 35, iron: 30, grain: 55, cotton: 0 }, socialClasses: { elite: 8, middle: 14, working: 22, peasant: 56 }, stability: 48, unrest: 32, industrialization: 30, isPlayer: false, culturalTrait: "fortified" },
    { id: "se", name: "Suecia", flag: "🇸🇪", worldClass: "semi", primaryIdeology: "liberalism", secondaryIdeologies: [], gdp: 0.5, population: 3.5, tradeBalance: 28, militaryPower: 35, culturalPower: 40, diplomaticPower: 38, x: 51, y: 16, eigenvectorCentrality: 0.35, betweennessCentrality: 0.30, resources: { coal: 15, iron: 72, grain: 20, cotton: 0 }, socialClasses: { elite: 6, middle: 18, working: 35, peasant: 41 }, stability: 78, unrest: 8, industrialization: 45, isPlayer: false, culturalTrait: "innovative" },
    { id: "ru", name: "Rusia", flag: "🇷🇺", worldClass: "semi", primaryIdeology: "absolutism", secondaryIdeologies: ["imperialism"], gdp: 1.8, population: 68.0, tradeBalance: 65, militaryPower: 75, culturalPower: 52, diplomaticPower: 70, x: 68, y: 20, eigenvectorCentrality: 0.65, betweennessCentrality: 0.72, resources: { coal: 40, iron: 55, grain: 85, cotton: 0 }, socialClasses: { elite: 4, middle: 6, working: 15, peasant: 75 }, stability: 55, unrest: 30, industrialization: 15, isPlayer: false, culturalTrait: "agrarian" },
    { id: "ot", name: "Imperio Otomano", flag: "🇹🇷", worldClass: "semi", primaryIdeology: "conservatism", secondaryIdeologies: ["theocracy"], gdp: 0.9, population: 36.0, tradeBalance: -40, militaryPower: 45, culturalPower: 42, diplomaticPower: 38, x: 58, y: 36, eigenvectorCentrality: 0.40, betweennessCentrality: 0.52, resources: { coal: 18, iron: 22, grain: 60, cotton: 35 }, socialClasses: { elite: 3, middle: 5, working: 12, peasant: 80 }, stability: 35, unrest: 50, industrialization: 8, isPlayer: false, culturalTrait: "fortified" },
    { id: "us", name: "Estados Unidos", flag: "🇺🇸", worldClass: "semi", primaryIdeology: "liberalism", secondaryIdeologies: ["constitutionalism"], gdp: 2.4, population: 23.2, tradeBalance: -80, militaryPower: 48, culturalPower: 45, diplomaticPower: 52, x: 20, y: 28, eigenvectorCentrality: 0.55, betweennessCentrality: 0.45, resources: { coal: 50, iron: 40, grain: 90, cotton: 88 }, socialClasses: { elite: 8, middle: 20, working: 25, peasant: 47 }, stability: 70, unrest: 15, industrialization: 40, isPlayer: false, culturalTrait: "expansionist" },
    { id: "br", name: "Brasil", flag: "🇧🇷", worldClass: "periphery", primaryIdeology: "conservatism", secondaryIdeologies: [], gdp: 0.5, population: 8.0, tradeBalance: -55, militaryPower: 18, culturalPower: 22, diplomaticPower: 18, x: 30, y: 56, eigenvectorCentrality: 0.22, betweennessCentrality: 0.18, resources: { coal: 5, iron: 10, grain: 42, cotton: 72 }, socialClasses: { elite: 4, middle: 3, working: 8, peasant: 85 }, stability: 40, unrest: 45, industrialization: 5, isPlayer: false, culturalTrait: "agrarian" },
    { id: "mx", name: "México", flag: "🇲🇽", worldClass: "periphery", primaryIdeology: "conservatism", secondaryIdeologies: [], gdp: 0.3, population: 7.8, tradeBalance: -35, militaryPower: 16, culturalPower: 15, diplomaticPower: 12, x: 16, y: 42, eigenvectorCentrality: 0.18, betweennessCentrality: 0.12, resources: { coal: 8, iron: 15, grain: 38, cotton: 15 }, socialClasses: { elite: 5, middle: 4, working: 6, peasant: 85 }, stability: 30, unrest: 55, industrialization: 3, isPlayer: false, culturalTrait: "spiritual" },
    { id: "ar", name: "Argentina", flag: "🇦🇷", worldClass: "periphery", primaryIdeology: "liberalism", secondaryIdeologies: [], gdp: 0.2, population: 1.8, tradeBalance: -20, militaryPower: 10, culturalPower: 14, diplomaticPower: 10, x: 27, y: 66, eigenvectorCentrality: 0.15, betweennessCentrality: 0.10, resources: { coal: 2, iron: 5, grain: 65, cotton: 10 }, socialClasses: { elite: 6, middle: 5, working: 9, peasant: 80 }, stability: 50, unrest: 25, industrialization: 4, isPlayer: false, culturalTrait: "agrarian" },
    { id: "in", name: "India", flag: "🇮🇳", worldClass: "periphery", primaryIdeology: "conservatism", secondaryIdeologies: [], gdp: 1.2, population: 180.0, tradeBalance: -220, militaryPower: 12, culturalPower: 32, diplomaticPower: 8, x: 71, y: 44, eigenvectorCentrality: 0.30, betweennessCentrality: 0.38, resources: { coal: 28, iron: 35, grain: 80, cotton: 92 }, socialClasses: { elite: 1, middle: 2, working: 7, peasant: 90 }, stability: 25, unrest: 60, industrialization: 3, isPlayer: false, culturalTrait: "spiritual" },
    { id: "cn", name: "China", flag: "🇨🇳", worldClass: "periphery", primaryIdeology: "conservatism", secondaryIdeologies: ["absolutism"], gdp: 1.5, population: 380.0, tradeBalance: -150, militaryPower: 38, culturalPower: 62, diplomaticPower: 28, x: 79, y: 34, eigenvectorCentrality: 0.35, betweennessCentrality: 0.32, resources: { coal: 55, iron: 45, grain: 88, cotton: 70 }, socialClasses: { elite: 3, middle: 5, working: 12, peasant: 80 }, stability: 40, unrest: 40, industrialization: 2, isPlayer: false, culturalTrait: "scholarly" },
    { id: "jp", name: "Japón", flag: "🇯🇵", worldClass: "periphery", primaryIdeology: "conservatism", secondaryIdeologies: ["absolutism"], gdp: 0.3, population: 33.0, tradeBalance: -8, militaryPower: 25, culturalPower: 52, diplomaticPower: 15, x: 84, y: 28, eigenvectorCentrality: 0.20, betweennessCentrality: 0.15, resources: { coal: 20, iron: 15, grain: 55, cotton: 0 }, socialClasses: { elite: 8, middle: 10, working: 12, peasant: 70 }, stability: 80, unrest: 5, industrialization: 5, isPlayer: false, culturalTrait: "fortified" },
    { id: "eg", name: "Egipto", flag: "🇪🇬", worldClass: "periphery", primaryIdeology: "conservatism", secondaryIdeologies: [], gdp: 0.15, population: 5.0, tradeBalance: -18, militaryPower: 8, culturalPower: 28, diplomaticPower: 10, x: 55, y: 40, eigenvectorCentrality: 0.14, betweennessCentrality: 0.18, resources: { coal: 0, iron: 3, grain: 50, cotton: 78 }, socialClasses: { elite: 3, middle: 4, working: 8, peasant: 85 }, stability: 35, unrest: 45, industrialization: 2, isPlayer: false, culturalTrait: "agrarian" },
    { id: "co", name: "Colombia", flag: "🇨🇴", worldClass: "periphery", primaryIdeology: "conservatism", secondaryIdeologies: [], gdp: 0.12, population: 3.0, tradeBalance: -12, militaryPower: 6, culturalPower: 8, diplomaticPower: 6, x: 24, y: 48, eigenvectorCentrality: 0.10, betweennessCentrality: 0.08, resources: { coal: 5, iron: 3, grain: 25, cotton: 8 }, socialClasses: { elite: 4, middle: 3, working: 8, peasant: 85 }, stability: 38, unrest: 42, industrialization: 2, isPlayer: false, culturalTrait: "agrarian" },
  ];
}

export function createInitialEdges(): TradeEdge[] {
  return [
    { id: "e1",  from: "gb", to: "fr", volume: 280, type: "manufactured", tariffRate: 0.12 },
    { id: "e2",  from: "gb", to: "de", volume: 240, type: "manufactured", tariffRate: 0.10 },
    { id: "e3",  from: "gb", to: "nl", volume: 180, type: "manufactured", tariffRate: 0.05 },
    { id: "e4",  from: "gb", to: "be", volume: 150, type: "manufactured", tariffRate: 0.08 },
    { id: "e5",  from: "gb", to: "us", volume: 200, type: "raw", tariffRate: 0.15 },
    { id: "e6",  from: "gb", to: "in", volume: 310, type: "raw", tariffRate: 0.02 },
    { id: "e7",  from: "gb", to: "br", volume: 95, type: "raw", tariffRate: 0.05 },
    { id: "e8",  from: "gb", to: "cn", volume: 120, type: "luxury", tariffRate: 0.08 },
    { id: "e9",  from: "gb", to: "ar", volume: 45, type: "raw", tariffRate: 0.05 },
    { id: "e10", from: "fr", to: "de", volume: 160, type: "manufactured", tariffRate: 0.10 },
    { id: "e11", from: "fr", to: "es", volume: 90, type: "manufactured", tariffRate: 0.12 },
    { id: "e12", from: "fr", to: "it", volume: 75, type: "manufactured", tariffRate: 0.10 },
    { id: "e13", from: "fr", to: "ot", volume: 65, type: "luxury", tariffRate: 0.08 },
    { id: "e14", from: "fr", to: "ru", volume: 110, type: "luxury", tariffRate: 0.10 },
    { id: "e15", from: "fr", to: "eg", volume: 55, type: "raw", tariffRate: 0.05 },
    { id: "e16", from: "de", to: "at", volume: 130, type: "manufactured", tariffRate: 0.08 },
    { id: "e17", from: "de", to: "ru", volume: 85, type: "manufactured", tariffRate: 0.10 },
    { id: "e18", from: "de", to: "se", volume: 60, type: "manufactured", tariffRate: 0.07 },
    { id: "e19", from: "de", to: "nl", volume: 140, type: "manufactured", tariffRate: 0.05 },
    { id: "e20", from: "us", to: "gb", volume: 220, type: "raw", tariffRate: 0.15 },
    { id: "e21", from: "us", to: "fr", volume: 85, type: "raw", tariffRate: 0.12 },
    { id: "e22", from: "mx", to: "gb", volume: 40, type: "raw", tariffRate: 0.08 },
    { id: "e23", from: "mx", to: "us", volume: 55, type: "raw", tariffRate: 0.05 },
    { id: "e24", from: "br", to: "gb", volume: 88, type: "raw", tariffRate: 0.05 },
    { id: "e25", from: "br", to: "fr", volume: 35, type: "raw", tariffRate: 0.08 },
    { id: "e26", from: "br", to: "pt", volume: 50, type: "raw", tariffRate: 0.03 },
    { id: "e27", from: "in", to: "gb", volume: 300, type: "raw", tariffRate: 0.02 },
    { id: "e28", from: "in", to: "fr", volume: 80, type: "raw", tariffRate: 0.05 },
    { id: "e29", from: "in", to: "ot", volume: 45, type: "raw", tariffRate: 0.05 },
    { id: "e30", from: "cn", to: "gb", volume: 130, type: "luxury", tariffRate: 0.08 },
    { id: "e31", from: "cn", to: "fr", volume: 70, type: "luxury", tariffRate: 0.10 },
    { id: "e32", from: "cn", to: "jp", volume: 25, type: "luxury", tariffRate: 0.02 },
    { id: "e33", from: "es", to: "gb", volume: 55, type: "raw", tariffRate: 0.12 },
    { id: "e34", from: "es", to: "fr", volume: 48, type: "raw", tariffRate: 0.10 },
    { id: "e35", from: "pt", to: "gb", volume: 42, type: "raw", tariffRate: 0.08 },
    { id: "e36", from: "co", to: "gb", volume: 22, type: "raw", tariffRate: 0.05 },
    { id: "e37", from: "co", to: "us", volume: 18, type: "raw", tariffRate: 0.06 },
    { id: "e38", from: "eg", to: "gb", volume: 52, type: "raw", tariffRate: 0.05 },
    { id: "e39", from: "eg", to: "fr", volume: 35, type: "raw", tariffRate: 0.06 },
    { id: "e40", from: "jp", to: "cn", volume: 22, type: "raw", tariffRate: 0.02 },
    { id: "e41", from: "ru", to: "gb", volume: 75, type: "raw", tariffRate: 0.10 },
    { id: "e42", from: "ru", to: "fr", volume: 60, type: "raw", tariffRate: 0.10 },
    { id: "e43", from: "ru", to: "de", volume: 55, type: "raw", tariffRate: 0.10 },
    { id: "e44", from: "at", to: "ot", volume: 40, type: "manufactured", tariffRate: 0.08 },
    { id: "e45", from: "ot", to: "gb", volume: 50, type: "raw", tariffRate: 0.08 },
    { id: "e46", from: "ot", to: "fr", volume: 42, type: "raw", tariffRate: 0.08 },
  ];
}
