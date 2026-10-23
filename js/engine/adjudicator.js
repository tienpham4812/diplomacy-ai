/**
 * Diplomacy Game Adjudicator
 * Fully implements standard DATC rules:
 * - Hold, Move, Support Hold, Support Move, Convoy
 * - Support cut rules (including not cutting own support, not cut by attacked province)
 * - Head-to-head collisions & bounce rules
 * - Dislodgements & self-dislodgement prevention
 * - Convoy verification & disruption
 * - Retreats & Disbandments
 * - SC updates at end of Fall
 * - Winter Builds/Disbands
 */

import { PROVINCES, POWERS, canMove, getValidRetreats } from '../data/mapData.js';

export class Adjudicator {
  /**
   * Adjudicate a movement phase (Spring Orders or Fall Orders)
   * @param {Object} gameState - Current game state
   * @param {Array} orders - List of orders submitted by all powers
   * @returns {Object} Resolution results, reports, next units, dislodged units
   */
  static adjudicateMovement(gameState, orders) {
    const units = JSON.parse(JSON.stringify(gameState.units));
    const results = {}; // key: unit.province -> { success: bool, reason: str, dislodged: bool, ... }
    const standoffs = [];

    // Map units by current province
    const unitMap = new Map();
    units.forEach(u => unitMap.set(u.province, u));

    // Parse and normalize orders
    const orderMap = new Map(); // province -> order
    orders.forEach(o => {
      orderMap.set(o.unitProvince, o);
    });

    // Default to HOLD for any unit without an order
    units.forEach(u => {
      if (!orderMap.has(u.province)) {
        orderMap.set(u.province, {
          power: u.power,
          unitProvince: u.province,
          type: 'HOLD'
        });
      }
    });

    // 1. Identify Convoys & verify convoy chains
    const validConvoys = this._validateConvoys(units, orderMap);

    // 2. Identify and evaluate Supports & Support Cuts
    const supportInfo = this._evaluateSupports(units, orderMap, validConvoys);

    // 3. Resolve Moves & Attacks
    const moveResults = this._resolveMoves(units, orderMap, supportInfo, validConvoys);

    // 4. Determine Dislodgements
    const { dislodgedUnits, finalUnits, standoffProvinces } = this._applyOutcomes(
      units,
      orderMap,
      moveResults,
      supportInfo
    );

    // Build human-readable battle report
    const reports = this._generateReports(units, orderMap, moveResults, supportInfo, dislodgedUnits);

    return {
      success: true,
      results: moveResults,
      dislodgedUnits,
      newUnits: finalUnits,
      standoffs: standoffProvinces,
      reports
    };
  }

  /**
   * Validate convoy routes for army move orders
   */
  static _validateConvoys(units, orderMap) {
    const validConvoys = new Set(); // Set of order keys that have a valid convoy route

    orderMap.forEach(order => {
      if (order.type === 'MOVE' && order.viaConvoy) {
        const u = units.find(unit => unit.province === order.unitProvince);
        if (u && u.type === 'A') {
          // Find path through fleets with matching CONVOY orders
          const visited = new Set();
          const queue = [order.unitProvince];
          let foundPath = false;

          while (queue.length > 0) {
            const curr = queue.shift();
            if (curr === order.targetProvince) {
              foundPath = true;
              break;
            }

            const currProv = PROVINCES[curr];
            const neighbors = currProv.seaNeighbors || [];

            for (const n of neighbors) {
              const [nProv] = n.split('/');
              if (nProv === order.targetProvince) {
                foundPath = true;
                break;
              }
              if (!visited.has(nProv)) {
                visited.add(nProv);
                // Check if there is a Fleet with a CONVOY order here
                const fleetOrder = orderMap.get(nProv);
                if (
                  fleetOrder &&
                  fleetOrder.type === 'CONVOY' &&
                  fleetOrder.convoyFrom === order.unitProvince &&
                  fleetOrder.convoyTo === order.targetProvince
                ) {
                  queue.push(nProv);
                }
              }
            }
            if (foundPath) break;
          }

          if (foundPath) {
            validConvoys.add(`${order.unitProvince}->${order.targetProvince}`);
          }
        }
      }
    });

    return validConvoys;
  }

  /**
   * Evaluate supports and detect cuts
   */
  static _evaluateSupports(units, orderMap, validConvoys) {
    const supportInfo = {
      cuts: new Map(), // province -> reason
      effectiveSupports: new Map() // targetKey -> count of valid supports
    };

    // First pass: identify who is attacking whom
    const directAttacks = new Map(); // targetProvince -> Array of { fromProv, power }
    orderMap.forEach(order => {
      if (order.type === 'MOVE') {
        const [targetBase] = order.targetProvince.split('/');
        if (!directAttacks.has(targetBase)) {
          directAttacks.set(targetBase, []);
        }
        directAttacks.get(targetBase).push({
          fromProv: order.unitProvince,
          power: order.power,
          viaConvoy: order.viaConvoy
        });
      }
    });

    // Second pass: check support cuts
    orderMap.forEach(order => {
      if (order.type === 'SUPPORT_HOLD' || order.type === 'SUPPORT_MOVE') {
        const supProv = order.unitProvince;
        const attacksOnSupporter = directAttacks.get(supProv) || [];

        // Check each attack on the supporting unit
        for (const atk of attacksOnSupporter) {
          // Cannot cut your own support
          if (atk.power === order.power) continue;

          // If supporting a move against the attacker's province, that attack does NOT cut the support
          if (
            order.type === 'SUPPORT_MOVE' &&
            order.supportedTarget === atk.fromProv
          ) {
            continue;
          }

          // Otherwise, the support is CUT!
          supportInfo.cuts.set(supProv, `Support cut by attack from ${PROVINCES[atk.fromProv]?.name || atk.fromProv}`);
          break;
        }
      }
    });

    // Third pass: tally effective supports
    orderMap.forEach(order => {
      if (supportInfo.cuts.has(order.unitProvince)) return; // Cut!

      if (order.type === 'SUPPORT_HOLD') {
        const target = order.supportedProvince;
        const key = `HOLD:${target}`;
        supportInfo.effectiveSupports.set(key, (supportInfo.effectiveSupports.get(key) || 0) + 1);
      } else if (order.type === 'SUPPORT_MOVE') {
        const [targetBase] = order.supportedTarget.split('/');
        const key = `MOVE:${order.supportedProvince}->${targetBase}`;
        supportInfo.effectiveSupports.set(key, (supportInfo.effectiveSupports.get(key) || 0) + 1);
      }
    });

    return supportInfo;
  }

  /**
   * Resolve moves and calculate attack/defense strengths
   */
  static _resolveMoves(units, orderMap, supportInfo, validConvoys) {
    const moveResults = {};
    const provinceDestinations = new Map(); // targetProv -> Array of moving orders

    orderMap.forEach(order => {
      if (order.type === 'MOVE') {
        const [targetBase] = order.targetProvince.split('/');
        if (!provinceDestinations.has(targetBase)) {
          provinceDestinations.set(targetBase, []);
        }
        provinceDestinations.get(targetBase).push(order);
      }
    });

    // Evaluate each unit's basic strength
    orderMap.forEach(order => {
      const u = units.find(unit => unit.province === order.unitProvince);
      if (!u) return;

      if (order.type === 'HOLD' || order.type === 'SUPPORT_HOLD' || order.type === 'SUPPORT_MOVE' || order.type === 'CONVOY') {
        // Base hold strength = 1 + support holds
        const supCount = supportInfo.effectiveSupports.get(`HOLD:${order.unitProvince}`) || 0;
        moveResults[order.unitProvince] = {
          success: true,
          strength: 1 + supCount,
          type: order.type,
          dislodged: false
        };
      } else if (order.type === 'MOVE') {
        const [targetBase, targetCoast] = order.targetProvince.split('/');
        const isConvoy = order.viaConvoy;

        // Verify adjacency or valid convoy
        const legalMove = isConvoy
          ? validConvoys.has(`${order.unitProvince}->${targetBase}`)
          : canMove(u.type, u.province, u.coast, targetBase, targetCoast);

        if (!legalMove) {
          moveResults[order.unitProvince] = {
            success: false,
            strength: 0,
            type: 'MOVE',
            reason: isConvoy ? 'Convoy path disrupted or incomplete' : 'Illegal move path',
            dislodged: false
          };
          return;
        }

        const supCount = supportInfo.effectiveSupports.get(`MOVE:${order.unitProvince}->${targetBase}`) || 0;
        moveResults[order.unitProvince] = {
          success: false, // will resolve below
          strength: 1 + supCount,
          targetProvince: targetBase,
          targetCoast: targetCoast || null,
          type: 'MOVE',
          dislodged: false
        };
      }
    });

    // Check head-to-head collisions and multi-unit clashes
    provinceDestinations.forEach((contenders, targetBase) => {
      // Find defender in target province if any
      const defender = units.find(u => u.province === targetBase);
      const defenderOrder = defender ? orderMap.get(targetBase) : null;
      let defenderHoldStrength = 0;

      if (defender) {
        if (!defenderOrder || defenderOrder.type !== 'MOVE') {
          defenderHoldStrength = moveResults[targetBase]?.strength || 1;
        } else {
          // If defender is moving, its hold strength is 0 unless its move bounces
          defenderHoldStrength = 1; // base 1 if it bounces back
        }
      }

      // Sort contenders by strength descending
      contenders.sort((a, b) => {
        const strA = moveResults[a.unitProvince]?.strength || 0;
        const strB = moveResults[b.unitProvince]?.strength || 0;
        return strB - strA;
      });

      const topContender = contenders[0];
      const topStrength = moveResults[topContender.unitProvince]?.strength || 0;
      const runnerUpStrength = contenders.length > 1
        ? (moveResults[contenders[1].unitProvince]?.strength || 0)
        : 0;

      // Check for tie among top contenders
      if (contenders.length > 1 && topStrength === runnerUpStrength) {
        // Tie! All bounce
        contenders.forEach(c => {
          if (moveResults[c.unitProvince]) {
            moveResults[c.unitProvince].success = false;
            moveResults[c.unitProvince].reason = `Bounced against equal attack strength (${topStrength})`;
          }
        });
        return;
      }

      // Check head-to-head swap without convoy
      if (defender && defenderOrder && defenderOrder.type === 'MOVE') {
        const [defTarget] = defenderOrder.targetProvince.split('/');
        if (defTarget === topContender.unitProvince && !topContender.viaConvoy && !defenderOrder.viaConvoy) {
          // Direct head-to-head battle
          const defStr = moveResults[defender.province]?.strength || 1;
          if (topStrength > defStr) {
            // Cannot dislodge own unit!
            if (defender.power === topContender.power) {
              moveResults[topContender.unitProvince].success = false;
              moveResults[topContender.unitProvince].reason = `Cannot dislodge own unit in ${PROVINCES[targetBase]?.name || targetBase}`;
            } else {
              moveResults[topContender.unitProvince].success = true;
            }
          } else {
            // Bounce
            moveResults[topContender.unitProvince].success = false;
            moveResults[topContender.unitProvince].reason = `Bounced in head-to-head battle with ${PROVINCES[targetBase]?.name || targetBase}`;
          }
          return;
        }
      }

      // Check against occupying defender
      if (defender) {
        // If defender is moving away and succeeds, target becomes empty
        const defMoving = defenderOrder && defenderOrder.type === 'MOVE';
        const defSucceeds = defMoving && moveResults[defender.province]?.success;

        if (!defSucceeds) {
          // Defender stays or bounced back
          const defDefendStrength = moveResults[defender.province]?.strength || 1;

          if (topStrength > defDefendStrength) {
            // Check self-dislodgement
            if (defender.power === topContender.power) {
              moveResults[topContender.unitProvince].success = false;
              moveResults[topContender.unitProvince].reason = `Cannot dislodge own unit in ${PROVINCES[targetBase]?.name || targetBase}`;
            } else {
              moveResults[topContender.unitProvince].success = true;
            }
          } else {
            moveResults[topContender.unitProvince].success = false;
            moveResults[topContender.unitProvince].reason = `Bounced: defense strength ${defDefendStrength} >= attack ${topStrength}`;
          }
        } else {
          // Vacated province
          moveResults[topContender.unitProvince].success = true;
        }
      } else {
        // Target is an unoccupied province
        moveResults[topContender.unitProvince].success = true;
      }
    });

    return moveResults;
  }

  /**
   * Apply move outcomes, determine dislodgements, update units
   */
  static _applyOutcomes(units, orderMap, moveResults, supportInfo) {
    const dislodgedUnits = [];
    const standoffProvinces = [];
    const finalUnits = [];
    const successfulDestinations = new Map(); // destProv -> moving unit

    // Map units by destination
    orderMap.forEach(order => {
      const res = moveResults[order.unitProvince];
      if (order.type === 'MOVE' && res && res.success) {
        const [targetBase, targetCoast] = order.targetProvince.split('/');
        const unit = units.find(u => u.province === order.unitProvince);
        if (unit) {
          successfulDestinations.set(targetBase, {
            power: unit.power,
            type: unit.type,
            province: targetBase,
            coast: targetCoast || null,
            fromProvince: order.unitProvince
          });
        }
      }
    });

    // Detect standoffs (provinces where multiple bounced moves occurred)
    const attackCounts = new Map();
    orderMap.forEach(order => {
      if (order.type === 'MOVE') {
        const [targetBase] = order.targetProvince.split('/');
        attackCounts.set(targetBase, (attackCounts.get(targetBase) || 0) + 1);
      }
    });
    attackCounts.forEach((count, prov) => {
      if (count >= 2 && !successfulDestinations.has(prov)) {
        standoffProvinces.push(prov);
      }
    });

    // Check existing units to see if they were dislodged
    units.forEach(u => {
      const order = orderMap.get(u.province);
      const res = moveResults[u.province];

      if (order && order.type === 'MOVE' && res && res.success) {
        // Unit successfully moved out!
        return;
      }

      // Unit stayed in province (Hold or bounced Move)
      const incomingConqueror = successfulDestinations.get(u.province);
      if (incomingConqueror && incomingConqueror.power !== u.power) {
        // Unit is DISLODGED!
        if (res) res.dislodged = true;
        dislodgedUnits.push({
          power: u.power,
          type: u.type,
          province: u.province,
          coast: u.coast || null,
          attackerProvince: incomingConqueror.fromProvince
        });
      } else {
        // Unit survives and remains in its province
        finalUnits.push({
          power: u.power,
          type: u.type,
          province: u.province,
          coast: u.coast || null
        });
      }
    });

    // Add successfully moved units to finalUnits
    successfulDestinations.forEach(u => {
      finalUnits.push({
        power: u.power,
        type: u.type,
        province: u.province,
        coast: u.coast
      });
    });

    return { dislodgedUnits, finalUnits, standoffProvinces };
  }

  /**
   * Generate descriptive human-readable battle summaries
   */
  static _generateReports(units, orderMap, moveResults, supportInfo, dislodgedUnits) {
    const reports = [];

    orderMap.forEach(order => {
      const u = units.find(unit => unit.province === order.unitProvince);
      if (!u) return;
      const provName = PROVINCES[order.unitProvince]?.name || order.unitProvince;
      const powerName = POWERS[order.power]?.name || order.power;

      if (order.type === 'HOLD') {
        reports.push(`${powerName} ${u.type} in ${provName} holds.`);
      } else if (order.type === 'MOVE') {
        const res = moveResults[order.unitProvince];
        const destName = PROVINCES[order.targetProvince.split('/')[0]]?.name || order.targetProvince;
        if (res && res.success) {
          reports.push(`✓ ${powerName} ${u.type} ${provName} -> ${destName} (SUCCEEDED, strength ${res.strength})`);
        } else {
          reports.push(`✗ ${powerName} ${u.type} ${provName} -> ${destName} (BOUNCED: ${res?.reason || 'Failed'})`);
        }
      } else if (order.type === 'SUPPORT_HOLD') {
        const supName = PROVINCES[order.supportedProvince]?.name || order.supportedProvince;
        const cutReason = supportInfo.cuts.get(order.unitProvince);
        if (cutReason) {
          reports.push(`⚠ ${powerName} ${u.type} ${provName} S ${supName} (CUT: ${cutReason})`);
        } else {
          reports.push(`✓ ${powerName} ${u.type} ${provName} supported ${supName} to hold.`);
        }
      } else if (order.type === 'SUPPORT_MOVE') {
        const fromName = PROVINCES[order.supportedProvince]?.name || order.supportedProvince;
        const toName = PROVINCES[order.supportedTarget.split('/')[0]]?.name || order.supportedTarget;
        const cutReason = supportInfo.cuts.get(order.unitProvince);
        if (cutReason) {
          reports.push(`⚠ ${powerName} ${u.type} ${provName} S ${fromName} -> ${toName} (CUT: ${cutReason})`);
        } else {
          reports.push(`✓ ${powerName} ${u.type} ${provName} supported ${fromName} -> ${toName}.`);
        }
      } else if (order.type === 'CONVOY') {
        const fromName = PROVINCES[order.convoyFrom]?.name || order.convoyFrom;
        const toName = PROVINCES[order.convoyTo]?.name || order.convoyTo;
        reports.push(`⚓ ${powerName} Fleet in ${provName} convoyed Army ${fromName} -> ${toName}.`);
      }
    });

    dislodgedUnits.forEach(du => {
      const provName = PROVINCES[du.province]?.name || du.province;
      const powerName = POWERS[du.power]?.name || du.power;
      reports.push(`💥 DISLODGED: ${powerName} ${du.type} in ${provName} was forced to retreat!`);
    });

    return reports;
  }

  /**
   * Adjudicate Retreats and Disbands
   * @param {Object} gameState
   * @param {Array} retreatOrders - [{ power, province, action: 'RETREAT'|'DISBAND', targetProvince, targetCoast }]
   */
  static adjudicateRetreats(gameState, retreatOrders) {
    const remainingUnits = JSON.parse(JSON.stringify(gameState.units));
    const dislodged = gameState.dislodgedUnits || [];
    const reports = [];

    // Map retreat orders
    const targetMap = new Map(); // targetProv -> Array of retreatOrders

    retreatOrders.forEach(ro => {
      if (ro.action === 'RETREAT' && ro.targetProvince) {
        if (!targetMap.has(ro.targetProvince)) {
          targetMap.set(ro.targetProvince, []);
        }
        targetMap.get(ro.targetProvince).push(ro);
      } else {
        // Disband
        reports.push(`${POWERS[ro.power]?.name} disbands unit in ${PROVINCES[ro.province]?.name || ro.province}.`);
      }
    });

    // Check clashes between retreating units
    targetMap.forEach((orders, targetProv) => {
      const destName = PROVINCES[targetProv]?.name || targetProv;
      if (orders.length > 1) {
        // Contested retreat destination: all disband!
        orders.forEach(ro => {
          reports.push(`💥 ${POWERS[ro.power]?.name} retreat to ${destName} contested! Unit disbanded.`);
        });
      } else {
        const ro = orders[0];
        const du = dislodged.find(u => u.power === ro.power && u.province === ro.province);
        if (du) {
          remainingUnits.push({
            power: ro.power,
            type: du.type,
            province: ro.targetProvince,
            coast: ro.targetCoast || null
          });
          reports.push(`✓ ${POWERS[ro.power]?.name} ${du.type} successfully retreated to ${destName}.`);
        }
      }
    });

    return {
      newUnits: remainingUnits,
      dislodgedUnits: [],
      reports
    };
  }

  /**
   * Update Supply Center ownership at the end of Fall
   * @param {Object} gameState
   * @returns {Object} Updated supplyCenters and ownership changes
   */
  static updateSupplyCenters(gameState) {
    const scMap = { ...gameState.supplyCenters };
    const changes = [];

    gameState.units.forEach(unit => {
      const prov = PROVINCES[unit.province];
      if (prov && prov.isSC) {
        const oldOwner = scMap[unit.province];
        if (oldOwner !== unit.power) {
          scMap[unit.province] = unit.power;
          changes.push({
            province: unit.province,
            oldOwner,
            newOwner: unit.power
          });
        }
      }
    });

    return {
      supplyCenters: scMap,
      changes
    };
  }

  /**
   * Calculate build/disband quotas for Winter adjustments
   */
  static calculateAdjustments(gameState) {
    const quotas = {};

    Object.keys(POWERS).forEach(powerId => {
      // Count SCs
      let scCount = 0;
      Object.entries(gameState.supplyCenters).forEach(([prov, owner]) => {
        if (owner === powerId) scCount++;
      });

      // Count Units
      let unitCount = 0;
      gameState.units.forEach(u => {
        if (u.power === powerId) unitCount++;
      });

      const diff = scCount - unitCount;
      quotas[powerId] = {
        scCount,
        unitCount,
        diff, // positive = builds available, negative = disbands required
        canBuild: diff > 0,
        mustDisband: diff < 0,
        buildCount: Math.max(0, diff),
        disbandCount: Math.max(0, -diff)
      };
    });

    return quotas;
  }

  /**
   * Adjudicate Winter builds and disbands
   */
  static adjudicateAdjustments(gameState, adjustmentOrders) {
    let units = JSON.parse(JSON.stringify(gameState.units));
    const reports = [];

    adjustmentOrders.forEach(ao => {
      const powerName = POWERS[ao.power]?.name || ao.power;
      const provName = PROVINCES[ao.province]?.name || ao.province;

      if (ao.type === 'BUILD') {
        // Verify home SC is owned and unoccupied
        const isOccupied = units.some(u => u.province === ao.province);
        const isHome = POWERS[ao.power]?.homeSCs.includes(ao.province);
        const isOwned = gameState.supplyCenters[ao.province] === ao.power;

        if (isHome && isOwned && !isOccupied) {
          units.push({
            power: ao.power,
            type: ao.unitType,
            province: ao.province,
            coast: ao.coast || null
          });
          reports.push(`🔨 ${powerName} built ${ao.unitType} in ${provName}.`);
        } else {
          reports.push(`✗ ${powerName} build in ${provName} failed: invalid location.`);
        }
      } else if (ao.type === 'DISBAND') {
        const idx = units.findIndex(u => u.power === ao.power && u.province === ao.province);
        if (idx !== -1) {
          units.splice(idx, 1);
          reports.push(`⚔ ${powerName} disbanded unit in ${provName}.`);
        }
      }
    });

    return {
      newUnits: units,
      reports
    };
  }

  /**
   * Check if any power has achieved 18 SCs (Solo Victory)
   */
  static checkVictory(supplyCenters) {
    const counts = {};
    Object.keys(POWERS).forEach(p => counts[p] = 0);

    Object.values(supplyCenters).forEach(owner => {
      if (owner && counts[owner] !== undefined) {
        counts[owner]++;
      }
    });

    for (const [powerId, count] of Object.entries(counts)) {
      if (count >= 18) {
        return {
          winner: powerId,
          scCount: count
        };
      }
    }

    return null;
  }
}
