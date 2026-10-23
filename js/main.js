/**
 * Main Application Orchestrator
 * Wires UI controls, MapRenderer, OrderManager, DiplomacyChat, and GameController
 */

import { POWERS, PROVINCES, canMove } from './data/mapData.js';
import { SoundFX } from './engine/audio.js';
import { GameController } from './ui/gameController.js';
import { OrderManager } from './ui/orderManager.js';
import { MapRenderer } from './ui/mapRenderer.js';
import { GuideModal } from './ui/guideModal.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Audio
  const soundFX = new SoundFX();

  // 2. Inject Guide Modal HTML
  const guideContainer = document.getElementById('guide-modal-container');
  if (guideContainer) {
    guideContainer.innerHTML = GuideModal.getHTML();
  }

  // 3. UI Element References
  const svgMap = document.getElementById('europe-map-svg');
  const tooltip = document.getElementById('map-tooltip');
  const phaseDisplay = document.getElementById('phase-display');
  const phaseTag = document.getElementById('phase-type-tag');
  const playerDot = document.getElementById('player-power-dot');
  const playerName = document.getElementById('player-power-name');
  const playerSC = document.getElementById('player-sc-counter');
  const standingsGrid = document.getElementById('powers-standings-grid');
  const ordersListContainer = document.getElementById('orders-list-container');
  const actionDrawer = document.getElementById('unit-action-drawer');
  const actionDrawerUnitName = document.getElementById('action-drawer-unit-name');
  const resolutionModal = document.getElementById('resolution-modal');
  const resolutionReportList = document.getElementById('resolution-report-list');
  const newGameModal = document.getElementById('new-game-modal');
  const powerSelectGrid = document.getElementById('power-select-grid');
  const victoryModal = document.getElementById('victory-modal');

  // Cable Room Elements
  const diplomatsBar = document.getElementById('diplomats-bar');
  const cardDiplomatName = document.getElementById('card-diplomat-name');
  const cardDiplomatTitle = document.getElementById('card-diplomat-title');
  const cardDiplomatDot = document.getElementById('card-diplomat-dot');
  const trustMeterFill = document.getElementById('trust-meter-fill');
  const trustPercent = document.getElementById('trust-percent');
  const trustStatusText = document.getElementById('trust-status-text');
  const telegramFeed = document.getElementById('telegram-feed');
  const telegramInput = document.getElementById('telegram-input');
  const btnSendTelegram = document.getElementById('btn-send-telegram');
  const gazetteFeed = document.getElementById('gazette-feed');

  let activeRecipient = 'france';
  let selectedNewPower = 'england';
  let isSandboxMode = false;
  let highlightedProvinces = [];

  // Forward declarations to allow mutual references in callbacks
  let mapRenderer = null;
  let orderManager = null;
  let gameController = null;

  // 4. Initialize MapRenderer
  mapRenderer = new MapRenderer(svgMap, tooltip, {
    onUnitClick: (unit) => {
      if (orderManager && gameController) {
        orderManager.selectUnit(unit, gameController.gameState, gameController.gameState.playerPower, isSandboxMode);
      }
    },
    onProvinceClick: (provId) => {
      if (orderManager && gameController) {
        orderManager.handleProvinceClick(provId, gameController.gameState, gameController.gameState.playerPower, isSandboxMode);
      }
    }
  });

  // 5. Initialize OrderManager
  orderManager = new OrderManager({
    soundFX,
    onOrdersChanged: (orders) => {
      renderOrdersList(orders);
      if (mapRenderer && gameController) {
        mapRenderer.render(gameController.gameState, orders, orderManager.selectedUnit, highlightedProvinces);
      }
    },
    onSelectionChanged: (selectedUnit, highlighted) => {
      highlightedProvinces = highlighted;
      updateActionDrawer(selectedUnit);
      if (mapRenderer && gameController) {
        mapRenderer.render(gameController.gameState, orderManager.orders, selectedUnit, highlightedProvinces);
      }
    }
  });

  // 6. Initialize GameController
  gameController = new GameController({
    soundFX,
    onStateChanged: (state) => {
      updateTopRibbon(state);
      updateStandings(state);
      if (orderManager) orderManager.clear();
      updateDiplomacyPanel();
      updateGazettePanel();
      if (mapRenderer && orderManager) {
        mapRenderer.render(state, orderManager.orders, orderManager.selectedUnit, highlightedProvinces);
      }
    },
    onAdjudicationReport: (reports) => {
      showResolutionModal(reports);
    },
    onGameOver: (victory) => {
      showVictoryModal(victory);
    }
  });

  // Expose to window for debugging or scripting
  window.diplomacyGame = { gameController, mapRenderer, orderManager, soundFX };

  // 7. Render UI Panels
  function updateTopRibbon(state) {
    const seasonCapital = state.season.charAt(0).toUpperCase() + state.season.slice(1);
    const phaseCapital = state.phase.charAt(0).toUpperCase() + state.phase.slice(1);
    phaseDisplay.textContent = `${seasonCapital} ${state.year}`;
    phaseTag.textContent = phaseCapital;

    const pMeta = POWERS[state.playerPower];
    if (pMeta) {
      playerDot.style.background = pMeta.color;
      playerName.textContent = pMeta.name;

      // Count SCs
      let count = 0;
      Object.values(state.supplyCenters).forEach(o => {
        if (o === state.playerPower) count++;
      });
      playerSC.textContent = `${count} / 18 SCs`;
    }
  }

  function updateStandings(state) {
    standingsGrid.innerHTML = '';
    const counts = {};
    const unitCounts = {};
    Object.keys(POWERS).forEach(p => {
      counts[p] = 0;
      unitCounts[p] = 0;
    });

    Object.values(state.supplyCenters).forEach(o => {
      if (o && counts[o] !== undefined) counts[o]++;
    });

    state.units.forEach(u => {
      if (unitCounts[u.power] !== undefined) unitCounts[u.power]++;
    });

    // Sort by SC count descending
    const sortedPowers = Object.keys(POWERS).sort((a, b) => counts[b] - counts[a]);

    sortedPowers.forEach(pId => {
      const p = POWERS[pId];
      const sc = counts[pId];
      const units = unitCounts[pId];
      const percent = Math.min(100, Math.round((sc / 18) * 100));

      const row = document.createElement('div');
      row.className = 'power-standing-row';
      row.innerHTML = `
        <div class="power-color-dot" style="background:${p.color};"></div>
        <div style="font-weight:${pId === state.playerPower ? 'bold' : 'normal'}; color:${pId === state.playerPower ? 'var(--text-gold)' : 'inherit'};">
          ${p.flag} ${p.name}
        </div>
        <div style="font-size:11px; color:#cbd5e1; text-align:right;">
          ${sc} SC (${units}U)
        </div>
        <div class="power-progress-bar">
          <div class="power-progress-fill" style="width:${percent}%; background:${p.color};"></div>
        </div>
      `;
      standingsGrid.appendChild(row);
    });
  }

  function renderOrdersList(orders) {
    ordersListContainer.innerHTML = '';
    if (!orders || orders.length === 0) {
      ordersListContainer.innerHTML = `
        <div style="color:var(--text-muted); font-size:12px; font-style:italic; text-align:center; padding:20px 0;">
          No orders specified yet.<br/>Click a unit on the map to issue movement, support, or hold orders.
        </div>
      `;
      return;
    }

    orders.forEach(order => {
      const provId = order.unitProvince || order.province;
      const provName = PROVINCES[provId]?.name || provId;
      const pMeta = POWERS[order.power];

      let desc = '';
      if (order.type === 'HOLD') {
        desc = `HOLD`;
      } else if (order.type === 'MOVE') {
        const destName = PROVINCES[order.targetProvince.split('/')[0]]?.name || order.targetProvince;
        desc = `-> ${destName}`;
      } else if (order.type === 'SUPPORT_HOLD') {
        const supName = PROVINCES[order.supportedProvince]?.name || order.supportedProvince;
        desc = `S ${supName} (Hold)`;
      } else if (order.type === 'SUPPORT_MOVE') {
        const fromName = PROVINCES[order.supportedProvince]?.name || order.supportedProvince;
        const toName = PROVINCES[order.supportedTarget.split('/')[0]]?.name || order.supportedTarget;
        desc = `S ${fromName} -> ${toName}`;
      } else if (order.type === 'CONVOY') {
        const fromName = PROVINCES[order.convoyFrom]?.name || order.convoyFrom;
        const toName = PROVINCES[order.convoyTo]?.name || order.convoyTo;
        desc = `C ${fromName} -> ${toName}`;
      } else if (order.action === 'RETREAT') {
        const toName = PROVINCES[order.targetProvince]?.name || order.targetProvince;
        desc = `RETREAT -> ${toName}`;
      } else if (order.action === 'DISBAND' || order.type === 'DISBAND') {
        desc = `DISBAND`;
      } else if (order.type === 'BUILD') {
        desc = `BUILD ${order.unitType}`;
      }

      const card = document.createElement('div');
      card.className = 'order-item-card';
      card.innerHTML = `
        <div class="order-unit-badge">
          <span style="color:${pMeta?.color}; font-size:14px;">●</span>
          <span>${provName}</span>
        </div>
        <div class="order-description">${desc}</div>
        <button class="order-delete-btn" title="Cancel order">&times;</button>
      `;

      card.querySelector('.order-delete-btn').addEventListener('click', () => {
        orderManager.removeOrder(provId);
      });

      ordersListContainer.appendChild(card);
    });
  }

  function updateActionDrawer(unit) {
    if (!unit) {
      actionDrawer.style.display = 'none';
      return;
    }

    const prov = PROVINCES[unit.province];
    const unitTitle = `${POWERS[unit.power]?.name} ${unit.type === 'F' ? 'Fleet' : 'Army'} in ${prov?.name || unit.province}`;
    actionDrawerUnitName.textContent = unitTitle;

    const btnConvoy = document.getElementById('btn-action-convoy');
    const btnDisband = document.getElementById('btn-action-disband');

    if (unit.type === 'F' && prov.type === 'sea') {
      btnConvoy.style.display = 'inline-flex';
    } else {
      btnConvoy.style.display = 'none';
    }

    if (gameController.gameState.phase === 'retreats' || gameController.gameState.phase === 'adjustments') {
      btnDisband.style.display = 'inline-flex';
    } else {
      btnDisband.style.display = 'none';
    }

    actionDrawer.style.display = 'flex';
  }

  // Action Drawer Buttons
  document.getElementById('btn-action-hold').addEventListener('click', () => {
    orderManager.setOrderAction('HOLD');
  });

  document.getElementById('btn-action-move').addEventListener('click', () => {
    soundFX.playClick();
  });

  document.getElementById('btn-action-support-hold').addEventListener('click', () => {
    if (!orderManager.selectedUnit) return;
    const u = orderManager.selectedUnit;
    const validProvs = orderManager._getValidTargetsForUnit(u, gameController.gameState);
    const adjacentUnits = gameController.gameState.units.filter(other =>
      validProvs.includes(other.province) && other.province !== u.province
    );

    if (adjacentUnits.length === 0) {
      alert("No adjacent units available to support holding.");
      return;
    }

    const targetUnit = adjacentUnits[0];
    orderManager.setOrderAction('SUPPORT_HOLD', { supportedProvince: targetUnit.province });
  });

  document.getElementById('btn-action-support-move').addEventListener('click', () => {
    if (!orderManager.selectedUnit) return;
    const u = orderManager.selectedUnit;
    const validProvs = orderManager._getValidTargetsForUnit(u, gameController.gameState);
    const candidates = gameController.gameState.units.filter(other =>
      other.province !== u.province
    );

    if (candidates.length === 0) {
      alert("No units found to support move.");
      return;
    }

    for (const cand of candidates) {
      const candTargets = orderManager._getValidTargetsForUnit(cand, gameController.gameState);
      const shared = candTargets.filter(t => validProvs.includes(t));
      if (shared.length > 0) {
        orderManager.setOrderAction('SUPPORT_MOVE', {
          supportedProvince: cand.province,
          supportedTarget: shared[0]
        });
        return;
      }
    }

    alert("No units in range of a destination this unit can reach.");
  });

  document.getElementById('btn-action-convoy').addEventListener('click', () => {
    if (!orderManager.selectedUnit) return;
    const u = orderManager.selectedUnit;
    const armies = gameController.gameState.units.filter(other => other.type === 'A');
    if (armies.length > 0) {
      const army = armies[0];
      const validDestinations = orderManager._getValidTargetsForUnit(u, gameController.gameState);
      orderManager.setOrderAction('CONVOY', {
        convoyFrom: army.province,
        convoyTo: validDestinations[0] || 'nwy'
      });
    }
  });

  document.getElementById('btn-action-disband').addEventListener('click', () => {
    orderManager.setOrderAction('DISBAND');
  });

  document.getElementById('btn-action-cancel').addEventListener('click', () => {
    orderManager.selectedUnit = null;
    orderManager.onSelectionChanged(null, []);
    soundFX.playClick();
  });

  // 8. Diplomatic Cable Room Logic
  function updateDiplomacyPanel() {
    diplomatsBar.innerHTML = '';
    const otherPowers = Object.keys(POWERS).filter(p => p !== gameController.gameState.playerPower);

    if (!otherPowers.includes(activeRecipient)) {
      activeRecipient = otherPowers[0];
    }

    otherPowers.forEach(pId => {
      const p = POWERS[pId];
      const btn = document.createElement('button');
      btn.className = `diplomat-avatar-btn ${pId === activeRecipient ? 'active' : ''}`;
      btn.innerHTML = `<span>${p.flag}</span> <span>${p.name}</span>`;
      btn.addEventListener('click', () => {
        activeRecipient = pId;
        updateDiplomacyPanel();
        soundFX.playClick();
      });
      diplomatsBar.appendChild(btn);
    });

    const activeMeta = POWERS[activeRecipient];
    if (activeMeta) {
      cardDiplomatName.textContent = activeMeta.leader;
      cardDiplomatTitle.textContent = `${activeMeta.name} • ${activeMeta.title}`;
      cardDiplomatDot.style.background = activeMeta.color;

      const trust = gameController.ai.getTrust(activeRecipient, gameController.gameState.playerPower);
      trustPercent.textContent = (trust >= 0 ? `+${trust}` : `${trust}`);

      const fillPercent = Math.max(5, Math.min(95, ((trust + 100) / 200) * 100));
      trustMeterFill.style.width = `${fillPercent}%`;

      if (trust >= 40) {
        trustMeterFill.style.background = '#10b981';
        trustStatusText.textContent = 'Allied / Devoted';
        trustStatusText.style.color = '#10b981';
      } else if (trust >= 10) {
        trustMeterFill.style.background = '#38bdf8';
        trustStatusText.textContent = 'Cooperative';
        trustStatusText.style.color = '#38bdf8';
      } else if (trust >= -15) {
        trustMeterFill.style.background = '#eab308';
        trustStatusText.textContent = 'Neutral / Guarded';
        trustStatusText.style.color = '#eab308';
      } else {
        trustMeterFill.style.background = '#ef4444';
        trustStatusText.textContent = 'Hostile / Betrayed';
        trustStatusText.style.color = '#ef4444';
      }
    }

    renderTelegramFeed();
  }

  function renderTelegramFeed() {
    telegramFeed.innerHTML = '';
    const history = gameController.chat.chatHistory[activeRecipient] || [];

    if (history.length === 0) {
      const p = POWERS[activeRecipient];
      telegramFeed.innerHTML = `
        <div class="telegram-bubble foreign">
          <div class="telegram-meta">${gameController.gameState.season.toUpperCase()} ${gameController.gameState.year} • ${p.title.toUpperCase()}</div>
          Diplomatic channels opened with ${p.leader} of ${p.name}. Send your initial terms or proposals.
        </div>
      `;
      return;
    }

    history.forEach(msg => {
      const bubble = document.createElement('div');
      const isPlayer = msg.sender === gameController.gameState.playerPower;
      const isAlert = msg.type === 'alert';

      if (isAlert) {
        bubble.className = 'telegram-bubble alert';
      } else if (isPlayer) {
        bubble.className = 'telegram-bubble player';
      } else {
        bubble.className = 'telegram-bubble foreign';
      }

      bubble.innerHTML = `
        <div class="telegram-meta">${msg.time} • ${POWERS[msg.sender]?.name.toUpperCase() || msg.sender.toUpperCase()}</div>
        <div>${msg.text.replace(/\n/g, '<br/>')}</div>
      `;
      telegramFeed.appendChild(bubble);
    });

    telegramFeed.scrollTop = telegramFeed.scrollHeight;
  }

  function sendTelegramMessage(text, proposalType = 'chat', proposalData = null) {
    if (!text.trim()) return;
    soundFX.playTelegraph();

    gameController.chat.sendMessage(
      gameController.gameState.playerPower,
      activeRecipient,
      text,
      proposalType,
      proposalData,
      gameController.gameState
    );

    telegramInput.value = '';
    updateDiplomacyPanel();
  }

  btnSendTelegram.addEventListener('click', () => {
    sendTelegramMessage(telegramInput.value, 'chat');
  });

  telegramInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendTelegramMessage(telegramInput.value, 'chat');
    }
  });

  // Proposals
  document.getElementById('btn-propose-dmz').addEventListener('click', () => {
    const defaultDMZ = {
      france: 'bur',
      germany: 'bur',
      russia: 'gal',
      austria: 'gal',
      turkey: 'bla',
      italy: 'pie'
    }[activeRecipient] || 'bur';

    const provName = PROVINCES[defaultDMZ]?.name || defaultDMZ;
    const text = `We propose establishing an immediate Demilitarized Zone (DMZ) in ${provName}. Neither of our forces shall enter without prior consultation.`;
    sendTelegramMessage(text, 'dmz', { province: defaultDMZ });
  });

  document.getElementById('btn-request-support').addEventListener('click', () => {
    const text = `We formally request your military coordination: please support our advance this season. In return, we shall respect your territorial expansion.`;
    sendTelegramMessage(text, 'support_req', { fromProv: 'lon', targetProv: 'nth' });
  });

  document.getElementById('btn-offer-alliance').addEventListener('click', () => {
    const text = `In the interest of European peace and mutual security, we offer a solemn Non-Aggression Pact and Alliance between our nations.`;
    sendTelegramMessage(text, 'alliance', {});
  });

  // Gazette Tab
  const tabTelegrams = document.getElementById('tab-telegrams');
  const tabGazette = document.getElementById('tab-gazette');
  const viewTelegrams = document.getElementById('view-telegrams');
  const viewGazette = document.getElementById('view-gazette');

  tabTelegrams.addEventListener('click', () => {
    tabTelegrams.classList.add('active');
    tabGazette.classList.remove('active');
    viewTelegrams.style.display = 'flex';
    viewGazette.style.display = 'none';
  });

  tabGazette.addEventListener('click', () => {
    tabGazette.classList.add('active');
    tabTelegrams.classList.remove('active');
    viewGazette.style.display = 'flex';
    viewTelegrams.style.display = 'none';
    updateGazettePanel();
  });

  function updateGazettePanel() {
    gazetteFeed.innerHTML = '';
    const rumors = gameController.chat.interceptedRumors;
    if (rumors.length === 0) {
      gazetteFeed.innerHTML = `<div style="font-size:12px; color:var(--text-muted); font-style:italic;">No intelligence dispatches intercepted yet. Mobilizations will be reported after Spring 1901.</div>`;
      return;
    }

    rumors.forEach(r => {
      const item = document.createElement('div');
      item.className = 'tactical-box';
      item.style.borderLeftColor = 'var(--text-gold)';
      item.innerHTML = `
        <div style="font-size:10px; color:var(--text-gold); font-family:var(--font-mono);">${r.time} • CONTINENTAL WIRE</div>
        <div style="font-size:12px; margin-top:3px;">${r.text}</div>
      `;
      gazetteFeed.appendChild(item);
    });
  }

  // 9. Map Zoom / Pan Controls
  document.getElementById('btn-zoom-in').addEventListener('click', () => {
    mapRenderer.zoomIn();
    soundFX.playClick();
  });

  document.getElementById('btn-zoom-out').addEventListener('click', () => {
    mapRenderer.zoomOut();
    soundFX.playClick();
  });

  document.getElementById('btn-zoom-reset').addEventListener('click', () => {
    mapRenderer.resetZoom();
    soundFX.playClick();
  });

  // 10. Submit Orders & Adjudicate
  document.getElementById('btn-submit-orders').addEventListener('click', () => {
    gameController.resolveTurn(orderManager.orders);
  });

  document.getElementById('btn-quick-auto-hold').addEventListener('click', () => {
    const playerUnits = gameController.gameState.units.filter(u => u.power === gameController.gameState.playerPower);
    playerUnits.forEach(u => {
      const hasOrder = orderManager.orders.some(o => (o.unitProvince || o.province) === u.province);
      if (!hasOrder) {
        orderManager.orders.push({
          power: u.power,
          unitProvince: u.province,
          type: 'HOLD'
        });
      }
    });
    orderManager.onOrdersChanged(orderManager.orders);
    soundFX.playClick();
  });

  // 11. Modal Controls
  function showResolutionModal(reports) {
    resolutionReportList.innerHTML = '';
    reports.forEach(r => {
      const item = document.createElement('div');
      item.className = 'report-item';

      if (r.includes('SUCCEEDED') || r.includes('successfully') || r.includes('holds')) {
        item.classList.add('success');
      } else if (r.includes('BOUNCED')) {
        item.classList.add('bounce');
      } else if (r.includes('CUT')) {
        item.classList.add('cut');
      } else if (r.includes('DISLODGED') || r.includes('TRAITOROUS')) {
        item.classList.add('dislodged');
      }

      item.textContent = r;
      resolutionReportList.appendChild(item);
    });

    resolutionModal.style.display = 'flex';
  }

  document.getElementById('btn-close-resolution').addEventListener('click', () => {
    resolutionModal.style.display = 'none';
  });

  document.getElementById('btn-resolution-ok').addEventListener('click', () => {
    resolutionModal.style.display = 'none';
  });

  // Guide Modal
  const guideModal = document.getElementById('guide-modal');
  document.getElementById('btn-rules-guide').addEventListener('click', () => {
    if (guideModal) guideModal.style.display = 'flex';
    soundFX.playClick();
  });

  document.addEventListener('click', e => {
    if (e.target && (e.target.id === 'close-guide-btn' || e.target.id === 'guide-ok-btn')) {
      if (guideModal) guideModal.style.display = 'none';
      soundFX.playClick();
    }
  });

  // New Game Modal & Nation Selector
  document.getElementById('btn-new-game').addEventListener('click', () => {
    renderPowerSelectGrid();
    newGameModal.style.display = 'flex';
    soundFX.playClick();
  });

  document.getElementById('btn-close-new-game').addEventListener('click', () => {
    newGameModal.style.display = 'none';
  });

  document.getElementById('btn-cancel-new-game').addEventListener('click', () => {
    newGameModal.style.display = 'none';
  });

  document.getElementById('btn-start-campaign').addEventListener('click', () => {
    gameController.initGame(selectedNewPower, isSandboxMode ? 'sandbox' : 'single');
    newGameModal.style.display = 'none';
    soundFX.playPhaseFanfare();
  });

  function renderPowerSelectGrid() {
    powerSelectGrid.innerHTML = '';
    Object.values(POWERS).forEach(p => {
      const card = document.createElement('div');
      card.className = `power-select-card ${p.id === selectedNewPower ? 'selected' : ''}`;
      card.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <span style="font-size:24px;">${p.flag}</span>
          <div class="power-color-dot" style="background:${p.color};"></div>
        </div>
        <div style="font-family:var(--font-display); font-weight:700; font-size:16px; color:#ffffff;">${p.name}</div>
        <div style="font-size:12px; color:var(--text-gold);">${p.leader}</div>
        <div style="font-size:11px; color:#94a3b8; line-height:1.4;">${p.description}</div>
      `;
      card.addEventListener('click', () => {
        selectedNewPower = p.id;
        renderPowerSelectGrid();
        soundFX.playClick();
      });
      powerSelectGrid.appendChild(card);
    });
  }

  // Sandbox Mode Toggle
  const btnSandbox = document.getElementById('btn-sandbox-toggle');
  btnSandbox.addEventListener('click', () => {
    isSandboxMode = !isSandboxMode;
    btnSandbox.textContent = isSandboxMode ? '⚙ Mode: Sandbox' : '⚙ Mode: Single';
    btnSandbox.classList.toggle('btn-accent', isSandboxMode);
    gameController.gameState.gameMode = isSandboxMode ? 'sandbox' : 'single';
    soundFX.playClick();
  });

  // Sound Toggle
  const btnSound = document.getElementById('btn-sound-toggle');
  btnSound.addEventListener('click', () => {
    const enabled = soundFX.toggle();
    btnSound.textContent = enabled ? '🔊 Sound' : '🔇 Muted';
    btnSound.classList.toggle('btn-danger', !enabled);
  });

  // Victory Modal
  function showVictoryModal(victory) {
    const winnerMeta = POWERS[victory.winner];
    document.getElementById('victory-winner-name').textContent = `${winnerMeta?.flag || ''} ${winnerMeta?.name || victory.winner}`;
    document.getElementById('victory-message').textContent = `
      Having consolidated ${victory.scCount} Supply Centers across the continent, ${winnerMeta?.name} achieves absolute victory in the Great Game of Diplomacy!
    `;
    victoryModal.style.display = 'flex';
    soundFX.playPhaseFanfare();
  }

  document.getElementById('btn-victory-new-game').addEventListener('click', () => {
    victoryModal.style.display = 'none';
    renderPowerSelectGrid();
    newGameModal.style.display = 'flex';
  });

  // Initial render
  updateTopRibbon(gameController.gameState);
  updateStandings(gameController.gameState);
  updateDiplomacyPanel();
  renderOrdersList(orderManager.orders);
  mapRenderer.render(gameController.gameState, orderManager.orders, null, []);
});
