/**
 * Diplomatic Telegram & Negotiation Engine
 * Simulates high-stakes negotiations between European leaders
 */

import { POWERS, PROVINCES } from '../data/mapData.js';

export class DiplomacyChat {
  constructor(aiEngine) {
    this.aiEngine = aiEngine;
    this.chatHistory = {}; // powerId -> Array of { sender, text, timestamp, type, meta }
    this.activePacts = []; // Array of { type, powerA, powerB, terms, status, turnsHonored }
    this.interceptedRumors = [];

    // Initialize histories for all powers
    Object.keys(POWERS).forEach(p => {
      this.chatHistory[p] = [];
    });
  }

  /**
   * Send a message from human player to an AI power
   * @param {string} playerPower
   * @param {string} recipientPower
   * @param {string} messageText
   * @param {string} proposalType - 'chat' | 'dmz' | 'support_req' | 'alliance' | 'partition'
   * @param {Object} proposalData - specifics
   * @param {Object} gameState - current game state
   */
  sendMessage(playerPower, recipientPower, messageText, proposalType = 'chat', proposalData = null, gameState) {
    const timeStr = `${gameState.season.toUpperCase()} ${gameState.year}`;
    
    // Add user message to history
    this.chatHistory[recipientPower].push({
      sender: playerPower,
      text: messageText,
      time: timeStr,
      type: proposalType,
      proposalData
    });

    // Generate AI Response based on context, trust, and board state
    const response = this._generateAIResponse(playerPower, recipientPower, messageText, proposalType, proposalData, gameState);
    
    this.chatHistory[recipientPower].push({
      sender: recipientPower,
      text: response.text,
      time: timeStr,
      type: 'response',
      accepted: response.accepted,
      trustDelta: response.trustDelta
    });

    if (response.trustDelta) {
      this.aiEngine.updateTrust(recipientPower, playerPower, response.trustDelta, response.reason);
    }

    if (response.accepted && proposalData) {
      this._registerPact(playerPower, recipientPower, proposalType, proposalData);
    }

    return response;
  }

  _registerPact(powerA, powerB, type, data) {
    this.activePacts.push({
      id: `${type}_${powerA}_${powerB}_${Date.now()}`,
      type,
      powers: [powerA, powerB],
      data,
      status: 'active',
      turnsHonored: 0
    });
  }

  /**
   * Generate authentic diplomatic response
   */
  _generateAIResponse(player, aiPower, message, type, data, gameState) {
    const leader = POWERS[aiPower].leader;
    const title = POWERS[aiPower].title;
    const trust = this.aiEngine.getTrust(aiPower, player);
    const textLower = message.toLowerCase();

    // 1. Handling Demilitarized Zone (DMZ) Proposals
    if (type === 'dmz' && data?.province) {
      const provName = PROVINCES[data.province]?.name || data.province;
      // High or neutral trust -> accept DMZ if mutually beneficial
      if (trust >= -10) {
        return {
          accepted: true,
          trustDelta: 15,
          text: `From: ${title} ${leader}\n\nWe accept your honorable proposal for a Demilitarized Zone in ${provName}. Neither of our flags shall enter without prior accord. May this peace strengthen our mutual understanding.`,
          reason: `Accepted DMZ in ${provName}`
        };
      } else {
        return {
          accepted: false,
          trustDelta: -5,
          text: `From: ${title} ${leader}\n\nOur General Staff views the situation around ${provName} with too much gravity to agree to demilitarization at this juncture. We shall position our forces where our security demands.`,
          reason: `Rejected DMZ in ${provName} due to low trust`
        };
      }
    }

    // 2. Handling Support Requests
    if (type === 'support_req' && data) {
      const fromName = PROVINCES[data.fromProv]?.name || data.fromProv;
      const targetName = PROVINCES[data.targetProv]?.name || data.targetProv;

      if (trust >= 20) {
        return {
          accepted: true,
          trustDelta: 10,
          text: `From: ${title} ${leader}\n\nOur military attaché confirms: we shall endeavor to order our divisions to assist your operation from ${fromName} into ${targetName}. We trust this favor shall be returned in kind when our own interests are at stake.`,
          reason: `Agreed to support ${player} into ${targetName}`
        };
      } else if (trust >= -5) {
        return {
          accepted: false,
          trustDelta: 0,
          text: `From: ${title} ${leader}\n\nWhile we look favorably upon our relations, our forces have urgent prior commitments this season and cannot commit to your offensive into ${targetName}.`,
          reason: `Neutral refusal of support request`
        };
      } else {
        return {
          accepted: false,
          trustDelta: -10,
          text: `From: ${title} ${leader}\n\nYour presumption is astounding. We will certainly not aid the advance of your legions into ${targetName}. Any hostile maneuvers will be met with decisive response.`,
          reason: `Hostile rejection of support request`
        };
      }
    }

    // 3. Handling Non-Aggression Pacts / Alliances
    if (type === 'alliance') {
      if (trust >= 0) {
        return {
          accepted: true,
          trustDelta: 20,
          text: `From: ${title} ${leader}\n\nOur ambassadors are instructed to welcome your alliance with open arms. Let our empires coordinate our grand strategy. Together, the balance of power in Europe remains in our firm grasp.`,
          reason: `Formed Non-Aggression Alliance with ${player}`
        };
      } else {
        return {
          accepted: false,
          trustDelta: 0,
          text: `From: ${title} ${leader}\n\nAn alliance requires demonstrated fidelity. While we appreciate your diplomatic dispatch, we must wait and observe your fleet and army movements before binding our nations to a formal pact.`,
          reason: `Cautious deferral of alliance`
        };
      }
    }

    // 4. Freeform Natural Parsing
    if (textLower.includes('attack') || textLower.includes('war') || textLower.includes('strike')) {
      return {
        accepted: true,
        trustDelta: 5,
        text: `From: ${title} ${leader}\n\nThe martial spirit stirs in our war councils. If our targets align and our borders remain secure, joint operations against common adversaries can indeed be orchestrated. Specify your theater of engagement.`,
        reason: 'Discussing joint military targets'
      };
    }

    if (textLower.includes('peace') || textLower.includes('friend') || textLower.includes('trade') || textLower.includes('trust')) {
      return {
        accepted: true,
        trustDelta: 10,
        text: `From: ${title} ${leader}\n\nWe share your sentiments for stability and peaceful borders. As long as your banners do not trespass into our spheres of interest, you shall find in us an honorable neighbor.`,
        reason: 'Affirmed goodwill'
      };
    }

    // Default authentic diplomatic reply
    const defaultReplies = [
      `From: ${title} ${leader}\n\nYour diplomatic cable has been delivered to our cabinet. We shall take your views into account when drafting this season's dispatches. Europe's peace hangs in the balance.`,
      `From: ${title} ${leader}\n\nWe acknowledge receipt of your telegram. Our interests in the Mediterranean and the Continent are paramount, but we remain open to constructive proposals that advance our mutual security.`,
      `From: ${title} ${leader}\n\nEvery power in Europe is maneuvering for advantage. We shall judge your intentions not merely by the eloquence of your ambassadors, but by the movement of your divisions.`
    ];

    return {
      accepted: true,
      trustDelta: 5,
      text: defaultReplies[Math.floor(Math.random() * defaultReplies.length)],
      reason: 'Standard diplomatic exchange'
    };
  }

  /**
   * Check for pact breaches after adjudication
   */
  checkPactViolations(gameState, lastMoveResults) {
    const violations = [];

    this.activePacts.forEach(pact => {
      if (pact.status !== 'active') return;

      if (pact.type === 'dmz' && pact.data?.province) {
        const prov = pact.data.province;
        const occupier = gameState.units.find(u => u.province === prov);

        if (occupier && pact.powers.includes(occupier.power)) {
          // Breach detected!
          pact.status = 'violated';
          const victim = pact.powers.find(p => p !== occupier.power);
          const occupierName = POWERS[occupier.power]?.name;
          const provName = PROVINCES[prov]?.name || prov;

          violations.push({
            pact,
            breaker: occupier.power,
            victim,
            message: `TRAITOROUS BREACH: ${occupierName} has violated the Demilitarized Zone in ${provName}!`
          });

          // Tank trust
          this.aiEngine.updateTrust(victim, occupier.power, -50, `Violated DMZ in ${provName}`);

          // Send an angry telegram to chat
          this.chatHistory[occupier.power].push({
            sender: victim,
            text: `From: ${POWERS[victim].title} ${POWERS[victim].leader}\n\nOUTRAGEOUS TREACHERY! You have march troops into ${provName} in direct violation of our sworn DMZ agreement! The civilized courts of Europe shall know of your perfidy!`,
            time: `${gameState.season.toUpperCase()} ${gameState.year}`,
            type: 'alert'
          });
        }
      }
    });

    return violations;
  }

  /**
   * Generate periodic European intelligence gossip & rumors
   */
  generateEuropeanGazette(gameState) {
    const rumors = [
      `Secret diplomatic envoys reported traveling between Berlin and Vienna under heavy escort.`,
      `The British Admiralty has issued naval mobilization advisories in the North Sea.`,
      `Rumors circulate in the cafes of Vienna regarding Austrian troop maneuvers toward the Balkan border.`,
      `The French General Staff convenes an emergency session following movements in the Low Countries.`,
      `Russian naval engineers inspect the ice-free docks of the Black Sea and Baltic ports.`,
      `Ottoman diplomats make overtures to Rome regarding Mediterranean shipping rights.`
    ];

    const pick = rumors[Math.floor(Math.random() * rumors.length)];
    this.interceptedRumors.unshift({
      time: `${gameState.season.toUpperCase()} ${gameState.year}`,
      text: pick
    });

    if (this.interceptedRumors.length > 8) {
      this.interceptedRumors.pop();
    }

    return this.interceptedRumors;
  }
}
