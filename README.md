# 🌐 HEGEMONÍA: El Grafo de los Mundos

> Simulador de estrategía basado en grafos, inspirado en la teoría de sistemas-mundo de Immanuel Wallerstein. Encarna una nación en 1847 y compite por la hegemonía global.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)](https://hegemonia-game.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**▶ Jugar ahora:** [hegemonia-game.vercel.app](https://hegemonia-game.vercel.app/)

---

## 🎬 Introducción al Juego

Hegemonía es un simulador por turnos donde el mundo es un **grafo dinámico** de naciones conectadas por rutas comerciales, alianzas diplomáticas y conflictos ideológicos. Cada nodo (nación) afecta a todos los demás a través del flujo de comercio, propagación ideológica y dinámicas de clase social.

Inspirado en:
- **Immanuel Wallerstein** — Teoría de Sistemas-Mundo (Core / Semi-Periferia / Periferia)
- **Karl Marx** — Lucha de clases y dinámica económica
- **Adam Smith** — Comercio y ventajas comparativas

El mundo comienza en **1847**: la Revolución Industrial transforma Europa, el imperialismo divide África y Asia, y las ideologías chocan mientras el equilibrio de poder global se redefine.

---

## 🎮 Cómo Jugar

### Pantalla de Inicio (Cortinilla Cinematográfica)

Al cargar el juego, una secuencia animada de 6 escenas presenta el mundo de Hegemonía:
1. Expansión cósmica inicial
2. Año 1847 — "El mundo se transforma"
3. Título principal: **HEGEMONÍA — El Grafo de los Mundos**
4. Grafo mundial animado con las 20 naciones
5. Descripción del juego con mecánicas clave
6. Pantalla de inicio con versión

### Configuración de Partida (4 Pasos)

1. **Elige tu Nación** — 20 naciones históricas con stats únicos
2. **Elige tu Ideología** — 1 primaria + 0-2 secundarias (históricamente realista)
3. **Elige tu Rasgo Cultural** — 12 rasgos que definen bonuses únicos
4. **Elige tu Enfoque Estratégico** — 10 caminos hacia la victoria

### Fases de Turno (8 por Turno)

Cada turno ejecuta 8 fases secuenciales:

| # | Fase | Descripción |
|---|------|-------------|
| ① | **Producción** | Cada nación produce según recursos + industrialización + modificador ideológico |
| ② | **Comercio** | Se resuelven flujos comerciales, se calculan balanzas, rutas aparecen/desaparecen |
| ③ | **Spread Ideológico** | Ideologías se propagan por rutas comerciales según poder cultural |
| ④ | **Dinámica de Clases** | Industrialización transforma campesinos en obreros; revoluciones posibles |
| ⑤ | **Decisiones NPC** | Cada nación AI evalúa y ejecuta la mejor acción por utilidad |
| ⑥ | **Decisiones Jugador** | Se ejecutan las acciones encoladas del jugador |
| ⑦ | **Clasificación** | Reclasificación Wallerstein (Core/Semi/Periferia) según patrones comerciales |
| ⑧ | **Métricas** | Recálculo de centralidad (eigenvector/betweenness) y poderes |

---

## 🏛️ 12 Ideologías Políticas

Cada ideología **reescribe la topología del grafo** — no son simples modificadores de stats.

| Ideología | Icono | Descripción | Mecánica de Grafo |
|-----------|-------|-------------|-------------------|
| **Mercantilismo** | 💰 | Proteccionismo y acumulación de riqueza | Aranceles altos, bonifica exportaciones |
| **Liberalismo** | ⚖️ | Libre comercio y competencia | Baja aranceles, maximiza rutas |
| **Socialismo** | ✊ | Clase trabajadora y propiedad colectiva | Bonifica estabilidad obrera |
| **Nacionalismo** | 🏛️ | Unificación nacional y poder estatal | +20% poder militar |
| **Conservadurismo** | 👑 | Tradición, orden jerárquico | +25% estabilidad base |
| **Absolutismo** | 🏰 | Poder centralizado total | +3 acciones por turno |
| **Imperialismo** | 🏴 | Dominio colonial y extracción | +40% extracción colonial |
| **Constitucionalismo** | 📜 | Monarquía constitucional | +20% estabilidad sostenida |
| **Progresismo** | 🔧 | Reforma social gradual | +25% industrialización |
| **Anarquismo** | 🔥 | Anti-estado, acción directa | -30% descontento base |
| **Teocracia** | ☪️ | Gobierno religioso | +30% estabilidad si alta |
| **Sindicalismo** | ⚒️ | Autogestión obrera | +35% poder obrero |

### Sistema Multi-Ideología

Históricamente realista: puedes elegir **1 ideología primaria + hasta 2 secundarias**. Las combinaciones crean **sinergias** (bonus) y **conflictos** (penalties):

**Sinergias destacadas:**
- Mercantilismo + Imperialismo → +colonial
- Liberalismo + Progresismo → +reformas
- Socialismo + Sindicalismo → +obrero
- Conservadurismo + Teocracia → +estabilidad

**Conflictos peligrosos:**
- Liberalismo + Absolutismo → choque institucional
- Anarquismo + Imperialismo → resistencia total
- Socialismo + Conservadurismo → lucha de clases

---

## 🎭 12 Rasgos Culturales

| Rasgo | Icono | Efecto |
|-------|-------|--------|
| **Tradición Marítima** | ⚓ | +25% volumen de rutas marítimas |
| **Espíritu Innovador** | 💡 | Industrialización 30% más rápida |
| **Tradición Bélica** | 🗡️ | +15% poder militar base |
| **Instinto Comerciante** | 🪙 | +20% GDP por ruta comercial |
| **Herencia Espiritual** | 🕉️ | +20 estabilidad, descontento sube más lento |
| **Fervor Expansionista** | 🧭 | +30% extracción colonial |
| **Raíces Agrarias** | 🌾 | +25% producción de grano |
| **Fuerza Industrial** | ⚙️ | +20% eficiencia manufacturera |
| **Saber Académico** | 📚 | +20% poder cultural |
| **Tradición Nómada** | 🐎 | +15% velocidad militar |
| **Habilidad Diplomática** | 🕊️ | +20% poder diplomático |
| **Fortaleza Ancestral** | 🏰 | +25% defensa |

---

## 🎯 10 Enfoques Estratégicos

| Enfoque | Icono | Especialidad | Penalidad |
|---------|-------|-------------|-----------|
| **Industrialista** | 🏭 | +15% industrialización | Militar -10% |
| **Militarista** | ⚔️ | +20% poder militar | Cultural -10% |
| **Diplomático** | 🤝 | +20% poder diplomático | Militar +15% costo |
| **Culturalista** | 🎭 | +20% poder cultural, +25% spread | Militar +15% costo |
| **Equilibrado** | ⚖️ | -10% costo todo, sin debilidad | Sin bonuses fuertes |
| **Colonialista** | 🏴 | +30% extracción colonial | -10% estabilidad |
| **Científico** | 🔬 | +25% industrialización, +30% tech | Militar +10% costo |
| **Comerciante** | 💰 | +25% GDP por ruta | -10% militar |
| **Revolucionario** | 🔥 | +40% spread ideológico | -15% estabilidad |
| **Aislacionista** | 🏔️ | +25% defensa, +20% estabilidad | -20% comercio |

---

## 🌍 20 Naciones (Año 1847)

### Core (Centro)
| Nación | GDP | Población | Ideología | Rasgo |
|--------|-----|-----------|-----------|-------|
| 🇬🇧 Gran Bretaña | 4.2B | 27.4M | Mercantilismo | Marítima |
| 🇫🇷 Francia | 3.6B | 36.0M | Liberalismo | Académica |
| 🇩🇪 Prusia | 2.8B | 34.0M | Nacionalismo | Bélica |
| 🇳🇱 Países Bajos | 1.2B | 3.1M | Mercantilismo | Comerciante |
| 🇧🇪 Bélgica | 0.9B | 4.6M | Liberalismo | Industrial |

### Semi-Periferia
| Nación | GDP | Población | Ideología | Rasgo |
|--------|-----|-----------|-----------|-------|
| 🇪🇸 España | 1.1B | 15.5M | Conservadurismo | Espiritual |
| 🇵🇹 Portugal | 0.4B | 3.8M | Conservadurismo | Marítima |
| 🇮🇹 Piamonte | 0.7B | 24.0M | Nacionalismo | Diplomática |
| 🇦🇹 Austria | 1.3B | 34.0M | Conservadurismo | Fortaleza |
| 🇸🇪 Suecia | 0.5B | 3.5M | Liberalismo | Innovador |
| 🇷🇺 Rusia | 1.8B | 68.0M | Absolutismo | Agraria |
| 🇹🇷 Imperio Otomano | 0.9B | 36.0M | Conservadurismo | Fortaleza |
| 🇺🇸 Estados Unidos | 2.4B | 23.2M | Liberalismo | Expansionista |

### Periferia
| Nación | GDP | Población | Ideología | Rasgo |
|--------|-----|-----------|-----------|-------|
| 🇧🇷 Brasil | 0.5B | 8.0M | Conservadurismo | Agraria |
| 🇲🇽 México | 0.3B | 7.8M | Conservadurismo | Espiritual |
| 🇦🇷 Argentina | 0.2B | 1.8M | Liberalismo | Agraria |
| 🇮🇳 India | 1.2B | 180.0M | Conservadurismo | Espiritual |
| 🇨🇳 China | 1.5B | 380.0M | Conservadurismo | Académica |
| 🇯🇵 Japón | 0.3B | 33.0M | Conservadurismo | Fortaleza |
| 🇪🇬 Egipto | 0.15B | 5.0M | Conservadurismo | Agraria |
| 🇨🇴 Colombia | 0.12B | 3.0M | Conservadurismo | Agraria |

---

## 🏆 Condiciones de Victoria (8)

| Condición | Requisito |
|-----------|-----------|
| **Dominación Económica** | GDP > 35% del mundial |
| **Hegemonía Total** | #1 en militar, cultural Y diplomático |
| **Victoria Ideológica** | >60% de naciones comparten tu ideología |
| **Supremacía Científica** | Industrialización > 90 Y clasificación Core |
| **Imperio Comercial** | >8 rutas comerciales Y volumen > 500 |
| **Hegemonía Diplomática** | Poder diplomático > 90 |
| **Dominación Cultural** | Poder cultural > 90 |
| **Imperio Colonial** | Comercio con >75% de la periferia |

## 💀 Condiciones de Derrota (7)

| Condición | Requisito |
|-----------|-----------|
| **Revolución Interna** | Estabilidad < 10 por 8+ turnos consecutivos |
| **Ruina Económica** | GDP < 0.05 |
| **Colapso Periférico** | Atrapado en periferia por 20+ turnos |
| **Conquista Militar** | Poder militar < 5 por 10+ turnos consecutivos |
| **Aislamiento Comercial** | Cero rutas por 15+ turnos consecutivos |
| **Sobreextensión** | Balance comercial < -50, estabilidad < 30, GDP < 0.1 |
| **Crisis de Deuda** | GDP < 0.02 Y balance < -30 |

---

## 🤖 NPC AI v2.0 — Sistema de Utilidad

Cada nación controlada por AI evalúa 8 acciones posibles usando **scoring de utilidad**:
1. `boost_production` — Cerrar brecha de GDP con el promedio
2. `boost_military` — Responder a amenazas militares globales
3. `boost_diplomacy` — Superar aislamiento comercial
4. `boost_culture` — Aumentar poder cultural
5. `change_tariff` — Ajustar aranceles a ideal ideológico
6. `seek_trade` — Abrir rutas con vecinos cercanos
7. `spread_ideology` — Presionar ideológicamente vecinos diferentes
8. `suppress_unrest` — Restaurar orden cuando descontento > 40

La AI es consciente de **ideologías secundarias** (ej: un mercantilista con secundaria liberal busca aranceles más bajos que uno puro).

---

## ⚔️ 47+ Acciones del Jugador

### Base (10 acciones)
`invest_industry` · `build_military` · `lower_tariffs` · `raise_tariffs` · `seek_trade` · `spread_ideology` · `suppress_unrest` · `build_infrastructure` · `diplomatic_pressure` · `colonial_expansion`

### Por Rasgo Cultural (~30 acciones desbloqueables)
- **Espiritual**: evangelize, religious_festival, missionary_schools, holy_war, spiritual_retreat, pilgrimage_routes
- **Marítimo**: naval_expedition, blockade, naval_base, pirate_suppression, overseas_colony
- **Innovador**: fund_research, patent_office, technical_exchange, industrial_espionage, universities
- **Bélico**: declare_war, fortify_borders, military_alliance, coercion, scorched_earth
- **Comerciante**: trade_monopoly, merchant_guilds, free_port, tariff_war, smugglers
- **Expansionista**: territorial_claim, manifest_destiny, settlers, resource_extraction, treaty_annexation

### Por Ideología (12 acciones únicas)
`redistribute_wealth` · `propaganda_campaign` · `traditional_reforms` · `royal_decree` · `free_trade_agreement` · `mercantilist_monopoly` · `colonial_dominion` · `constitutional_reform` · `social_programs` · `commune_uprising` · `divine_proclamation` · `general_strike`

---

## 🏗️ Arquitectura Técnica

```
src/
├── app/
│   └── page.tsx              # Dashboard principal + orquestador de pantallas
├── components/
│   └── hegemonia/
│       ├── GameIntroScreen.tsx  # Cortinilla cinematográfica (6 escenas)
│       └── NationSetupScreen.tsx # Configuración de partida (4 pasos)
├── core/
│   ├── types.ts             # Definiciones de tipos (v3.0)
│   ├── ideologies.ts        # 12 perfiles ideológicos + mecánicas de grafo
│   ├── player-actions.ts    # 47+ acciones del jugador
│   ├── npc-ai.ts            # AI v2.0 (utilidad + traits + ideologías)
│   ├── simulation.ts        # Game loop principal (8 fases)
│   ├── economy.ts           # Producción, comercio, clases sociales
│   ├── initial-data.ts      # 20 naciones + 46 rutas comerciales (1847)
│   └── algorithms.ts        # Centralidad de eigenvector/betweenness
└── store/
    └── hegemonia-store.ts    # Zustand state management
```

### Stack Tecnológico

| Tecnología | Uso |
|-----------|-----|
| **Next.js 16** | Framework React con App Router |
| **TypeScript 5** | Tipado estático estricto |
| **Tailwind CSS 4** | Sistema de estilos utility-first |
| **Zustand** | Estado global del juego |
| **Framer Motion** | Animaciones (intro, transiciones) |
| **Recharts** | Gráficas (GDP histórico, rankings) |

---

## 🚀 Instalación y Desarrollo

```bash
# Clonar
git clone https://github.com/metamatematico/HEGEMONIA_GAME.git
cd HEGEMONIA_GAME

# Instalar dependencias
npm install

# Desarrollo local
npm run dev
# Abre http://localhost:3000

# Build producción
npm run build
npm start
```

---

## 📊 Métricas del Mundo

- **20 naciones** con stats históricamente inspirados
- **46 rutas comerciales** iniciales (3 tipos: raw, manufactured, luxury)
- **8 fases** por turno
- **47+ acciones** del jugador (base + rasgo + ideología)
- **12 ideologías** con mecánicas de grafo únicas
- **12 rasgos culturales** con bonuses específicos
- **10 enfoques estratégicos** con trade-offs
- **8 condiciones de victoria** / **7 de derrota**
- **NPC AI v2.0** con scoring de utilidad
- **Clasificación Wallerstein** dinámica (Core/Semi/Periferia)

---

## 📝 Licencia

MIT — Proyecto de código abierto desarrollado por Leonardo Jiménez Martínez.

---

*Hegemonía v3.0 — 20 naciones · 12 ideologías · 12 rasgos · 10 enfoques · 8 victorias · 7 derrotas*
