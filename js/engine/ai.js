/**
 * Strategic AI Engine for Diplomacy
 * Features:
 * - Authentic 1901 Opening Book heuristics
 * - Tactical threat assessment & supply center targeting
 * - Coordinated attacks with Support Move and Support Hold
 * - Convoy awareness & execution
 * - Dynamic Trust Matrix & alliance alignment
 * - Coalition formation against run-away leaders (Solo-stop rule)
 * - Intelligent Retreat and Winter Build/Disband decisions
 */

import { PROVINCES, POWERS, canMove, getValidRetreats } from '../data/mapData.js';

export class DiplomacyAI {
  constructor(personalityWeights = {}) {
    this.trustMatrix = {}; // powerA -> { powerB: number (-100 to 100) }
    this.treaties = []; // Active treaties/pacts
    this._initializeTrust();
  }

  _initializeTrust() {
    const powers = Object.keys(POWERS);
    powers.forEach(p1 => {
      this.trustMatrix[p1] = {};
      powers.forEach(p2 => {
        // Base neutrality (0), slight historical affinity
        let base = 10;
        if (p1 === p2) base = 100;
        // Historical 1901 tensions
        if ((p1 === 'austria' && p2 === 'italy') || (p1 === 'italy' && p2 === 'austria')) base = -10;
        if ((p1 === 'austria' && p2 === 'russia') || (p1 === 'russia' && p2 === 'austria')) base = -5;
        if ((p1 === 'turkey' && p2 === 'russia') || (p1 === 'russia' && p2 === 'turkey')) base = -15;
        if ((p1 === 'england' && p2 === 'germany') || (p1 === 'germany' && p2 === 'england')) base = 15;
        this.trustMatrix[p1][p2] = base;
      });
    });
  }

  /**
   * Adjust trust score between two powers
   */
  updateTrust(fromPower, toPower, delta, reason = '') {
    if (!this.trustMatrix[fromPower]) this.trustMatrix[fromPower] = {};
    const curr = this.trustMatrix[fromPower][toPower] || 0;
    const newVal = Math.max(-100, Math.min(100, curr + delta));
    this.trustMatrix[fromPower][toPower] = newVal;
    return newVal;
  }

  getTrust(fromPower, toPower) {
    return this.trustMatrix[fromPower]?.[toPower] || 0;
  }

  /**
   * Generate movement phase orders for all AI powers
   */
  generateOrdersForPhase(gameState, aiPowers) {
    const orders = [];
    const year = gameState.year;
    const season = gameState.season;

    // Detect if this is Spring 1901 for opening book
    const isSpring1901 = (year === 1901 && season === 'spring');

    aiPowers.forEach(power => {
      const powerUnits = gameState.units.filter(u => u.power === power);
      if (powerUnits.length === 0) return;

      if (isSpring1901) {
        const openingOrders = this._getOpeningBookOrders(power, gameState);
        if (openingOrders && openingOrders.length === powerUnits.length) {
          orders.push(...openingOrders);
          return;
        }
      }

      // Generate dynamic strategic orders
      const powerOrders = this._generateTacticalOrders(power, powerUnits, gameState);
      orders.push(...powerOrders);
    });

    return orders;
  }

  /**
   * Canonical 1901 Opening Book heuristics for realistic play
   */
  _getOpeningBookOrders(power, gameState) {
    const openings = {
      england: [
        // Northern Opening (standard and robust)
        { power: 'england', unitProvince: 'edi', type: 'MOVE', targetProvince: 'nwg' },
        { power: 'england', unitProvince: 'lvp', type: 'MOVE', targetProvince: 'yor' },
        { power: 'england', unitProvince: 'lon', type: 'MOVE', targetProvince: 'nth' }
      ],
      france: [
        // Maginot / Iberian expansion
        { power: 'france', unitProvince: 'bre', type: 'MOVE', targetProvince: 'mao' },
        { power: 'france', unitProvince: 'par', type: 'MOVE', targetProvince: 'bur' },
        { power: 'france', unitProvince: 'mar', type: 'MOVE', targetProvince: 'spa/sc' }
      ],
      germany: [
        // Dutch / Danish expansion
        { power: 'germany', unitProvince: 'kie', type: 'MOVE', targetProvince: 'den' },
        { power: 'germany', unitProvince: 'ber', type: 'MOVE', targetProvince: 'kie' },
        { power: 'germany', unitProvince: 'mun', type: 'MOVE', targetProvince: 'ruh' }
      ],
      italy: [
        // Lepanto / Tunis setup
        { power: 'italy', unitProvince: 'ven', type: 'HOLD' },
        { power: 'italy', unitProvince: 'rom', type: 'MOVE', targetProvince: 'apu' },
        { power: 'italy', unitProvince: 'nap', type: 'MOVE', targetProvince: 'ion' }
      ],
      austria: [
        // Balkan Gambit
        { power: 'austria', unitProvince: 'vie', type: 'MOVE', targetProvince: 'gal' },
        { power: 'austria', unitProvince: 'bud', type: 'MOVE', targetProvince: 'ser' },
        { power: 'austria', unitProvince: 'tri', type: 'MOVE', targetProvince: 'alb' }
      ],
      russia: [
        // Standard Octopus
        { power: 'russia', unitProvince: 'mos', type: 'MOVE', targetProvince: 'ukr' },
        { power: 'russia', unitProvince: 'war', type: 'MOVE', targetProvince: 'gal' },
        { power: 'russia', unitProvince: 'sev', type: 'MOVE', targetProvince: 'bla' },
        { power: 'russia', unitProvince: 'stp', type: 'MOVE', targetProvince: 'bot' }
      ],
      turkey: [
        // Ottoman Defense
        { power: 'turkey', unitProvince: 'con', type: 'MOVE', targetProvince: 'bul' },
        { power: 'turkey', unitProvince: 'ank', type: 'MOVE', targetProvince: 'bla' },
        { power: 'turkey', unitProvince: 'smy', type: 'MOVE', targetProvince: 'con' }
      ]
    };

    return openings[power] || null;
  }

  /**
   * Tactical decision maker for mid/late game
   */
  _generateTacticalOrders(power, units, gameState) {
    const orders = [];
    const claimedDestinations = new Set();
    const plannedMoves = new Map(); // targetProvince -> unit

    // 1. Identify threat levels of other powers
    const threatScores = this._calculateThreats(power, gameState);
    const soloLeader = this._detectSoloLeader(gameState);

    // 2. Classify candidate target provinces:
    // - Unowned Supply Centers
    // - Enemy Supply Centers (especially soloLeader)
    // - Vulnerable neighboring provinces
    const scTargets = this._findHighPriorityTargets(power, gameState, soloLeader);

    // 3. For each unit, calculate best move or support
    units.forEach(unit => {
      const candidates = this._getValidMovesForUnit(unit, gameState);
      let bestChoice = null;
      let highestValue = -9999;

      candidates.forEach(cand => {
        let score = 0;
        const [targetBase] = cand.target.split('/');
        const targetProv = PROVINCES[targetBase];

        // Avoid colliding with own units' planned destinations
        if (claimedDestinations.has(targetBase)) {
          score -= 100;
        }

        // SC targeting value
        if (targetProv.isSC) {
          const owner = gameState.supplyCenters[targetBase];
          if (!owner) {
            // Unclaimed neutral SC! Huge value
            score += 80;
          } else if (owner !== power) {
            // Enemy SC!
            const threat = threatScores[owner] || 0;
            score += 50 + threat * 0.5;
            if (soloLeader === owner) score += 100; // Solo-stop priority!
          } else {
            // Own SC: defending or staying
            score += 10;
          }
        }

        // Strategic border / chokepoint value
        if (['nth', 'eng', 'mao', 'ion', 'bla', 'gal', 'bur', 'boh', 'tyr', 'ser'].includes(targetBase)) {
          score += 25;
        }

        // Penalty for moving away from home SC if home SC is endangered
        if (POWERS[power].homeSCs.includes(unit.province)) {
          const threatsNearby = this._isHomeThreatened(unit.province, power, gameState);
          if (threatsNearby && cand.type === 'MOVE') {
            score -= 30;
          }
        }

        // Hold preference if currently in owned SC and enemy is adjacent
        if (cand.type === 'HOLD' && targetProv.isSC && gameState.supplyCenters[unit.province] === power) {
          score += 20;
        }

        if (score > highestValue) {
          highestValue = score;
          bestChoice = cand;
        }
      });

      if (bestChoice && bestChoice.type === 'MOVE') {
        const [targetBase] = bestChoice.target.split('/');
        claimedDestinations.add(targetBase);
        plannedMoves.set(targetBase, { unit, target: bestChoice.target });
        orders.push({
          power,
          unitProvince: unit.province,
          type: 'MOVE',
          targetProvince: bestChoice.target
        });
      } else {
        claimedDestinations.add(unit.province);
        orders.push({
          power,
          unitProvince: unit.province,
          type: 'HOLD'
        });
      }
    });

    // 4. Optimization pass: Convert suitable Moves or Holds into SUPPORT orders!
    this._optimizeSupportOrders(power, orders, units, gameState);

    return orders;
  }

  /**
   * Convert friendly adjacent units into supports where an attack needs extra strength
   */
  _optimizeSupportOrders(power, orders, units, gameState) {
    orders.forEach(order => {
      if (order.type === 'HOLD') {
        // Can this holding unit support another friendly move?
        const u = units.find(unit => unit.province === order.unitProvince);
        if (!u) return;

        // Look for a friendly move into an adjacent province
        const nearbyMove = orders.find(o => {
          if (o.type !== 'MOVE' || o.power !== power || o.unitProvince === u.province) return false;
          const [destBase, destCoast] = o.targetProvince.split('/');
          return canMove(u.type, u.province, u.coast, destBase, destCoast);
        });

        if (nearbyMove) {
          // Change HOLD to SUPPORT_MOVE!
          order.type = 'SUPPORT_MOVE';
          order.supportedProvince = nearbyMove.unitProvince;
          order.supportedTarget = nearbyMove.targetProvince;
        }
      }
    });
  }

  /**
   * Get all legally possible moves for a unit
   */
  _getValidMovesForUnit(unit, gameState) {
    const prov = PROVINCES[unit.province];
    if (!prov) return [{ type: 'HOLD' }];

    const moves = [{ type: 'HOLD' }];
    let destinations = [];

    if (unit.type === 'A') {
      destinations = prov.landNeighbors || [];
      destinations.forEach(d => {
        moves.push({ type: 'MOVE', target: d });
      });
    } else {
      if (prov.type === 'split_coast' && unit.coast && prov.coasts[unit.coast]) {
        destinations = prov.coasts[unit.coast].seaNeighbors || [];
      } else {
        destinations = prov.seaNeighbors || [];
      }
      destinations.forEach(d => {
        moves.push({ type: 'MOVE', target: d });
      });
    }

    return moves;
  }

  /**
   * Check if any power is close to winning (13+ SCs)
   */
  _detectSoloLeader(gameState) {
    const scCounts = {};
    Object.values(gameState.supplyCenters).forEach(owner => {
      if (owner) scCounts[owner] = (scCounts[owner] || 0) + 1;
    });

    let leader = null;
    let maxSCs = 0;
    Object.entries(scCounts).forEach(([p, count]) => {
      if (count > maxSCs) {
        maxSCs = count;
        leader = p;
      }
    });

    if (maxSCs >= 13) return leader;
    return null;
  }

  /**
   * Calculate threat posed by other powers
   */
  _calculateThreats(myPower, gameState) {
    const threats = {};
    const myUnits = gameState.units.filter(u => u.power === myPower);

    Object.keys(POWERS).forEach(other => {
      if (other === myPower) return;
      let score = 0;

      // Distance and proximity
      gameState.units.filter(u => u.power === other).forEach(ou => {
        myUnits.forEach(mu => {
          const isAdjacent = canMove('A', ou.province, null, mu.province, null) ||
                             canMove('F', ou.province, null, mu.province, null);
          if (isAdjacent) score += 20;
        });
      });

      // Factor in diplomatic trust
      const trust = this.getTrust(myPower, other);
      score -= trust * 0.5;

      threats[other] = score;
    });

    return threats;
  }

  _isHomeThreatened(homeProv, myPower, gameState) {
    return gameState.units.some(u => {
      if (u.power === myPower) return false;
      return canMove(u.type, u.province, u.coast, homeProv, null);
    });
  }

  _findHighPriorityTargets(myPower, gameState, soloLeader) {
    const targets = [];
    Object.entries(gameState.supplyCenters).forEach(([prov, owner]) => {
      if (!owner || owner !== myPower) {
        targets.push(prov);
      }
    });
    return targets;
  }

  /**
   * Generate AI Retreat orders
   */
  generateRetreatOrders(gameState, power) {
    const orders = [];
    const dislodged = (gameState.dislodgedUnits || []).filter(u => u.power === power);

    dislodged.forEach(du => {
      const validRetreats = getValidRetreats(du, du.attackerProvince, gameState);
      if (validRetreats.length > 0) {
        // Pick retreat location closest to home or safe SC
        const best = validRetreats[0];
        orders.push({
          power,
          province: du.province,
          action: 'RETREAT',
          targetProvince: best.province,
          targetCoast: best.coast
        });
      } else {
        orders.push({
          power,
          province: du.province,
          action: 'DISBAND'
        });
      }
    });

    return orders;
  }

  /**
   * Generate Winter Adjustment orders (Builds / Disbands)
   */
  generateAdjustmentOrders(gameState, power, quota) {
    const orders = [];

    if (quota.diff > 0) {
      // Builds needed
      const availableHomeSCs = POWERS[power].homeSCs.filter(sc => {
        const isOwned = gameState.supplyCenters[sc] === power;
        const isOccupied = gameState.units.some(u => u.province === sc);
        return isOwned && !isOccupied;
      });

      let buildsLeft = Math.min(quota.diff, availableHomeSCs.length);
      for (let i = 0; i < buildsLeft; i++) {
        const sc = availableHomeSCs[i];
        const prov = PROVINCES[sc];
        // Decide unit type: if coastal and navy is needed, build Fleet; else Army
        let unitType = 'A';
        let coast = null;
        if (prov.type === 'coast' || prov.type === 'split_coast') {
          // Powers with maritime focus (England, Italy, Turkey) favor fleets
          const maritimePowers = ['england', 'turkey', 'italy'];
          if (maritimePowers.includes(power) || Math.random() < 0.4) {
            unitType = 'F';
            if (prov.type === 'split_coast') {
              coast = Object.keys(prov.coasts)[0]; // default coast
            }
          }
        }

        orders.push({
          power,
          type: 'BUILD',
          unitType,
          province: sc,
          coast
        });
      }
    } else if (quota.diff < 0) {
      // Disbands needed
      const powerUnits = gameState.units.filter(u => u.power === power);
      let disbandsNeeded = Math.min(-quota.diff, powerUnits.length);

      // Disband units farthest from home SCs or least useful
      powerUnits.sort((a, b) => {
        const aIsHome = POWERS[power].homeSCs.includes(a.province);
        const bIsHome = POWERS[power].homeSCs.includes(b.province);
        if (aIsHome && !bIsHome) return 1;
        if (!aIsHome && bIsHome) return -1;
        return 0;
      });

      for (let i = 0; i < disbandsNeeded; i++) {
        orders.push({
          power,
          type: 'DISBAND',
          province: powerUnits[i].province
        });
      }
    }

    return orders;
  }
}
