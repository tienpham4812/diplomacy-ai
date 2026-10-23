/**
 * Game Controller & Turn Orchestrator
 * Coordinates game loop, phase advancement, AI turns, history snapshots, and victory
 */

import { INITIAL_UNITS, INITIAL_SUPPLY_CENTERS, POWERS, PROVINCES } from '../data/mapData.js';
import { Adjudicator } from '../engine/adjudicator.js';
import { DiplomacyAI } from '../engine/ai.js';
import { DiplomacyChat } from '../engine/diplomacyChat.js';

export class GameController {
  constructor(options = {}) {
    this.soundFX = options.soundFX;
    this.onStateChanged = options.onStateChanged || (() => {});
    this.onAdjudicationReport = options.onAdjudicationReport || (() => {});
    this.onGameOver = options.onGameOver || (() => {});

    this.ai = new DiplomacyAI();
    this.chat = new DiplomacyChat(this.ai);

    this.history = []; // Array of { year, season, phase, units, supplyCenters, orders, reports }
    this.historyIndex = -1; // -1 means viewing current live turn

    this.initGame('england', 'single');
  }

  initGame(playerPower = 'england', gameMode = 'single') {
    this.gameState = {
      year: 1901,
      season: 'spring', // 'spring' | 'fall' | 'winter'
      phase: 'orders',   // 'orders' | 'retreats' | 'adjustments'
      units: JSON.parse(JSON.stringify(INITIAL_UNITS)),
      supplyCenters: JSON.parse(JSON.stringify(INITIAL_SUPPLY_CENTERS)),
      dislodgedUnits: [],
      standoffs: [],
      playerPower,
      gameMode, // 'single' | 'sandbox'
      winner: null
    };

    this.ai = new DiplomacyAI();
    this.chat = new DiplomacyChat(this.ai);
    this.history = [];
    this.historyIndex = -1;

    // Save initial state snapshot
    this._saveHistorySnapshot([], ['Spring 1901 begins. All Great Powers mobilize across Europe.']);
    this.onStateChanged(this.gameState);
  }

  _saveHistorySnapshot(orders, reports) {
    this.history.push({
      year: this.gameState.year,
      season: this.gameState.season,
      phase: this.gameState.phase,
      units: JSON.parse(JSON.stringify(this.gameState.units)),
      supplyCenters: JSON.parse(JSON.stringify(this.gameState.supplyCenters)),
      dislodgedUnits: JSON.parse(JSON.stringify(this.gameState.dislodgedUnits || [])),
      orders: JSON.parse(JSON.stringify(orders)),
      reports: [...reports]
    });
  }

  /**
   * Process and resolve the current turn
   * @param {Array} playerOrders
   */
  resolveTurn(playerOrders = []) {
    if (this.gameState.winner) return;

    if (this.gameState.phase === 'orders') {
      this._resolveMovementPhase(playerOrders);
    } else if (this.gameState.phase === 'retreats') {
      this._resolveRetreatsPhase(playerOrders);
    } else if (this.gameState.phase === 'adjustments') {
      this._resolveAdjustmentsPhase(playerOrders);
    }

    this.onStateChanged(this.gameState);
  }

  /**
   * Resolve Spring/Fall Movement
   */
  _resolveMovementPhase(playerOrders) {
    // Determine AI powers
    const allPowers = Object.keys(POWERS);
    const aiPowers = this.gameState.gameMode === 'sandbox'
      ? []
      : allPowers.filter(p => p !== this.gameState.playerPower);

    // Generate AI orders
    const aiOrders = this.ai.generateOrdersForPhase(this.gameState, aiPowers);
    const allOrders = [...playerOrders, ...aiOrders];

    // Adjudicate
    const outcome = Adjudicator.adjudicateMovement(this.gameState, allOrders);

    // Check sounds
    if (outcome.dislodgedUnits.length > 0) {
      this.soundFX?.playArtillery();
    } else {
      this.soundFX?.playPhaseFanfare();
    }

    // Update game state
    this.gameState.units = outcome.newUnits;
    this.gameState.dislodgedUnits = outcome.dislodgedUnits;
    this.gameState.standoffs = outcome.standoffs;

    // Check pact breaches
    const violations = this.chat.checkPactViolations(this.gameState, outcome.results);
    violations.forEach(v => {
      outcome.reports.unshift(`⚡ ${v.message}`);
    });

    // Generate European intelligence gazette
    this.chat.generateEuropeanGazette(this.gameState);

    // Save snapshot
    this._saveHistorySnapshot(allOrders, outcome.reports);

    // Display report to player
    this.onAdjudicationReport(outcome.reports);

    // Phase transition
    if (outcome.dislodgedUnits.length > 0) {
      // Must resolve retreats first!
      this.gameState.phase = 'retreats';
    } else {
      this._advanceSeasonAfterMovement();
    }
  }

  /**
   * Advance after movement (or retreats)
   */
  _advanceSeasonAfterMovement() {
    if (this.gameState.season === 'spring') {
      // Spring moves to Fall orders
      this.gameState.season = 'fall';
      this.gameState.phase = 'orders';
      this.gameState.standoffs = [];
    } else if (this.gameState.season === 'fall') {
      // Fall ends: Update Supply Center ownership!
      const scUpdate = Adjudicator.updateSupplyCenters(this.gameState);
      this.gameState.supplyCenters = scUpdate.supplyCenters;
      this.gameState.standoffs = [];

      // Check Victory
      const victory = Adjudicator.checkVictory(this.gameState.supplyCenters);
      if (victory) {
        this.gameState.winner = victory.winner;
        this.onGameOver(victory);
        return;
      }

      // Check Winter adjustments
      const quotas = Adjudicator.calculateAdjustments(this.gameState);
      const adjustmentsNeeded = Object.values(quotas).some(q => q.diff !== 0);

      if (adjustmentsNeeded) {
        this.gameState.season = 'winter';
        this.gameState.phase = 'adjustments';
      } else {
        // No adjustments needed: advance to next year Spring!
        this.gameState.year += 1;
        this.gameState.season = 'spring';
        this.gameState.phase = 'orders';
      }
    }
  }

  /**
   * Resolve Retreats & Disbandments
   */
  _resolveRetreatsPhase(playerRetreatOrders) {
    const allPowers = Object.keys(POWERS);
    const aiPowers = this.gameState.gameMode === 'sandbox'
      ? []
      : allPowers.filter(p => p !== this.gameState.playerPower);

    const aiRetreatOrders = [];
    aiPowers.forEach(power => {
      const orders = this.ai.generateRetreatOrders(this.gameState, power);
      aiRetreatOrders.push(...orders);
    });

    const allRetreatOrders = [...playerRetreatOrders, ...aiRetreatOrders];
    const outcome = Adjudicator.adjudicateRetreats(this.gameState, allRetreatOrders);

    this.gameState.units = outcome.newUnits;
    this.gameState.dislodgedUnits = [];

    this._saveHistorySnapshot(allRetreatOrders, outcome.reports);
    this.onAdjudicationReport(outcome.reports);

    // Proceed to next season
    this._advanceSeasonAfterMovement();
  }

  /**
   * Resolve Winter Adjustments (Builds / Disbands)
   */
  _resolveAdjustmentsPhase(playerAdjustmentOrders) {
    const quotas = Adjudicator.calculateAdjustments(this.gameState);
    const allPowers = Object.keys(POWERS);
    const aiPowers = this.gameState.gameMode === 'sandbox'
      ? []
      : allPowers.filter(p => p !== this.gameState.playerPower);

    const aiAdjustmentOrders = [];
    aiPowers.forEach(power => {
      const quota = quotas[power];
      if (quota && quota.diff !== 0) {
        const orders = this.ai.generateAdjustmentOrders(this.gameState, power, quota);
        aiAdjustmentOrders.push(...orders);
      }
    });

    const allAdjustmentOrders = [...playerAdjustmentOrders, ...aiAdjustmentOrders];
    const outcome = Adjudicator.adjudicateAdjustments(this.gameState, allAdjustmentOrders);

    this.gameState.units = outcome.newUnits;

    this._saveHistorySnapshot(allAdjustmentOrders, outcome.reports);
    this.onAdjudicationReport(outcome.reports);

    // Advance to next Spring!
    this.gameState.year += 1;
    this.gameState.season = 'spring';
    this.gameState.phase = 'orders';
    this.gameState.dislodgedUnits = [];
    this.gameState.standoffs = [];
  }

  /**
   * Timeline / History Replay
   */
  viewHistory(index) {
    if (index >= 0 && index < this.history.length) {
      this.historyIndex = index;
      return this.history[index];
    }
    this.historyIndex = -1;
    return null;
  }
}
