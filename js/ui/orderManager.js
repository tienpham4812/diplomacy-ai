/**
 * Order Manager & Interactive Order Creator UI
 * Manages player orders, validations, highlights, and order list panel
 */

import { PROVINCES, POWERS, canMove, getValidRetreats } from '../data/mapData.js';

export class OrderManager {
  constructor(options = {}) {
    this.orders = []; // Active player orders
    this.selectedUnit = null;
    this.currentAction = null; // 'MOVE' | 'SUPPORT_HOLD' | 'SUPPORT_MOVE' | 'CONVOY'
    this.onOrdersChanged = options.onOrdersChanged || (() => {});
    this.onSelectionChanged = options.onSelectionChanged || (() => {});
    this.soundFX = options.soundFX;
  }

  clear() {
    this.orders = [];
    this.selectedUnit = null;
    this.currentAction = null;
    this.onOrdersChanged(this.orders);
    this.onSelectionChanged(null, []);
  }

  /**
   * Handle unit selection
   */
  selectUnit(unit, gameState, playerPower, isSandbox = false) {
    if (!isSandbox && unit.power !== playerPower) {
      // Cannot order foreign units (unless in sandbox)
      this.selectedUnit = null;
      this.currentAction = null;
      this.onSelectionChanged(null, []);
      return;
    }

    if (this.selectedUnit && this.selectedUnit.province === unit.province) {
      // Toggle deselect
      this.selectedUnit = null;
      this.currentAction = null;
      this.onSelectionChanged(null, []);
      return;
    }

    this.selectedUnit = unit;
    this.currentAction = null;
    const highlighted = this._getValidTargetsForUnit(unit, gameState);
    this.onSelectionChanged(this.selectedUnit, highlighted);
    this.soundFX?.playClick();
  }

  /**
   * Quick-click or province target click
   */
  handleProvinceClick(targetProvId, gameState, playerPower, isSandbox = false) {
    if (!this.selectedUnit) return;

    // Phase: Retreats
    if (gameState.phase === 'retreats') {
      const du = (gameState.dislodgedUnits || []).find(u => u.province === this.selectedUnit.province);
      if (du) {
        const validRetreats = getValidRetreats(du, du.attackerProvince, gameState);
        const match = validRetreats.find(r => r.province === targetProvId);
        if (match) {
          this.setOrder({
            power: du.power,
            province: du.province,
            action: 'RETREAT',
            targetProvince: match.province,
            targetCoast: match.coast
          });
          this.selectedUnit = null;
          this.onSelectionChanged(null, []);
        }
      }
      return;
    }

    // Phase: Movement
    const u = this.selectedUnit;
    const prov = PROVINCES[targetProvId];
    if (!prov) return;

    // Check if target has split coasts
    let targetCoast = null;
    if (prov.type === 'split_coast' && u.type === 'F') {
      // Find matching coast
      const validCoasts = Object.keys(prov.coasts).filter(c =>
        canMove(u.type, u.province, u.coast, targetProvId, c)
      );
      if (validCoasts.length > 0) {
        targetCoast = validCoasts[0]; // pick first valid coast
      }
    }

    // Verify move validity
    const isAdjacent = canMove(u.type, u.province, u.coast, targetProvId, targetCoast);
    if (isAdjacent) {
      const targetKey = targetCoast ? `${targetProvId}/${targetCoast}` : targetProvId;
      this.setOrder({
        power: u.power,
        unitProvince: u.province,
        type: 'MOVE',
        targetProvince: targetKey
      });
      this.selectedUnit = null;
      this.onSelectionChanged(null, []);
      this.soundFX?.playClick();
    }
  }

  setOrder(newOrder) {
    // Remove existing order for this unit
    const provKey = newOrder.unitProvince || newOrder.province;
    this.orders = this.orders.filter(o => (o.unitProvince || o.province) !== provKey);
    this.orders.push(newOrder);
    this.onOrdersChanged(this.orders);
  }

  removeOrder(unitProvince) {
    this.orders = this.orders.filter(o => (o.unitProvince || o.province) !== unitProvince);
    this.onOrdersChanged(this.orders);
    this.soundFX?.playClick();
  }

  /**
   * Quick action buttons (Hold, Support, Convoy)
   */
  setOrderAction(actionType, extraData = {}) {
    if (!this.selectedUnit) return;
    const u = this.selectedUnit;

    if (actionType === 'HOLD') {
      this.setOrder({
        power: u.power,
        unitProvince: u.province,
        type: 'HOLD'
      });
      this.selectedUnit = null;
      this.onSelectionChanged(null, []);
      this.soundFX?.playClick();
    } else if (actionType === 'SUPPORT_HOLD') {
      this.setOrder({
        power: u.power,
        unitProvince: u.province,
        type: 'SUPPORT_HOLD',
        supportedProvince: extraData.supportedProvince
      });
      this.selectedUnit = null;
      this.onSelectionChanged(null, []);
      this.soundFX?.playClick();
    } else if (actionType === 'SUPPORT_MOVE') {
      this.setOrder({
        power: u.power,
        unitProvince: u.province,
        type: 'SUPPORT_MOVE',
        supportedProvince: extraData.supportedProvince,
        supportedTarget: extraData.supportedTarget
      });
      this.selectedUnit = null;
      this.onSelectionChanged(null, []);
      this.soundFX?.playClick();
    } else if (actionType === 'CONVOY') {
      this.setOrder({
        power: u.power,
        unitProvince: u.province,
        type: 'CONVOY',
        convoyFrom: extraData.convoyFrom,
        convoyTo: extraData.convoyTo
      });
      this.selectedUnit = null;
      this.onSelectionChanged(null, []);
      this.soundFX?.playClick();
    } else if (actionType === 'DISBAND') {
      this.setOrder({
        power: u.power,
        province: u.province,
        action: 'DISBAND'
      });
      this.selectedUnit = null;
      this.onSelectionChanged(null, []);
      this.soundFX?.playClick();
    }
  }

  _getValidTargetsForUnit(unit, gameState) {
    const prov = PROVINCES[unit.province];
    if (!prov) return [];

    const valid = [];
    if (unit.type === 'A') {
      (prov.landNeighbors || []).forEach(n => valid.push(n));
    } else {
      let neighbors = [];
      if (prov.type === 'split_coast' && unit.coast && prov.coasts[unit.coast]) {
        neighbors = prov.coasts[unit.coast].seaNeighbors || [];
      } else {
        neighbors = prov.seaNeighbors || [];
      }
      neighbors.forEach(n => {
        const [base] = n.split('/');
        valid.push(base);
      });
    }

    return valid;
  }
}
