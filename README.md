# Diplomacy: The Great Game (1901)

A grand strategy web application bringing the legendary board game **Diplomacy** to life, playable directly in the browser against 6 strategic AI powers.

## 🎖 Features

1. **Authentic European War Room Aesthetic**:
   - Styled after 1900s war offices with dark glassmorphism, brass accents, vintage cartography, and custom typography (`Cinzel`, `Outfit`, `JetBrains Mono`).
   - Dynamic pan & zoom interactive SVG map with all 75 canonical provinces, coastal definitions, and supply centers.
   - Unit tokens with national heraldry colors, distinct army infantry shields and fleet naval anchors.
   - Dynamic tactical order arrows: green curves for moves, dashed blue for supports, amber for convoys, and red crosses for bounces.

2. **Full DATC Adjudication Engine**:
   - Accurate Diplomacy Adjudication Test Cases implementation:
     - Hold, Move, Support Hold, Support Move, Convoy.
     - Support cuts (including DATC rules: attacks from defended provinces do not cut support).
     - Head-to-head collisions and bounce resolutions.
     - Dislodgements and self-dislodgement prevention.
     - Multi-fleet convoy chains and disruption detection.
     - Dislodged unit Retreats & Disbandments.
     - Fall supply center updates, build/disband quotas, and Winter Adjustments.
     - Solo Victory detection at 18 Supply Centers.

3. **Strategic AI Engine**:
   - Canonical 1901 Opening Book heuristics (Northern Opening, Maginot/Iberian, Lepanto, Ottoman Defense, etc.).
   - Tactical threat assessment, supply center targeting, and defensive support coordination.
   - Solo-stop coalition behavior: if any power threatens European hegemony (13+ SCs), other powers prioritize containing them.

4. **Diplomatic Cable Room & AI Negotiation**:
   - Private telegram channels with all European leaders (Lord Salisbury, Théophile Delcassé, Kaiser Wilhelm II, Giovanni Giolitti, Franz Joseph I, Tsar Nicholas II, Sultan Abdul Hamid II).
   - Structured proposals:
     - Demilitarized Zones (DMZs) with automatic pact breach detection and trust penalties.
     - Military support requests.
     - Non-Aggression Pacts and Alliances.
   - Dynamic Trust Matrix (-100 to +100) tracking honor and treachery.
   - Intercepted continental gossip & intelligence wire in the European Gazette.

5. **Audio Synthesis (Web Audio API)**:
   - Procedural military fanfares, artillery combat clashes, naval ship bells, telegraph morse tickers, and tactile clicks with zero external audio dependencies.

6. **Play Modes & Manual**:
   - Single Player: Choose your Great Power vs 6 AI powers.
   - Sandbox / Hotseat: Freely command all 7 powers for tactical analysis and practice.
   - Field Manual: Illustrated in-game rules guide covering supports, convoy bridges, and tactics.

## 🚀 Running Locally

Serve the directory with any local static HTTP server:

```bash
# Using Python
python -m http.server 8080
```

Open `http://localhost:8080` in your web browser.
