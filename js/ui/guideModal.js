/**
 * Illustrated Rules Guide & Diplomacy Manual
 */

export class GuideModal {
  static getHTML() {
    return `
      <div class="modal-overlay" id="guide-modal" style="display:none;">
        <div class="modal-card war-room-card guide-card">
          <div class="modal-header">
            <h2>📜 European War Office: General's Field Manual</h2>
            <button class="close-btn" id="close-guide-btn">&times;</button>
          </div>
          <div class="modal-body guide-content">
            <section class="guide-section">
              <h3>1. The Grand Objective</h3>
              <p>Europe stands on the brink in Spring 1901. Seven Great Powers contest 34 vital <strong>Supply Centers (SCs)</strong>. Each Supply Center you control can sustain one military division (Army or Fleet). The first power to control <strong>18 Supply Centers</strong> achieves complete hegemony over the Continent and wins the game!</p>
            </section>

            <section class="guide-section">
              <h3>2. Units: Armies & Fleets</h3>
              <ul>
                <li><strong>Army (⚔):</strong> Travels across land and coastal provinces. Cannot venture into pure sea without a convoy.</li>
                <li><strong>Fleet (⚓):</strong> Navigates open waters and coastal shorelines. Fleets can move through canals (Kiel, Constantinople) and convoy armies.</li>
                <li><strong>All units have identical strength:</strong> Exactly 1. A single unit can never defeat another single unit on its own without support!</li>
              </ul>
            </section>

            <section class="guide-section">
              <h3>3. The Golden Rule of Support</h3>
              <p>Because every unit has strength 1, two opposing units clashing directly will always <strong>bounce</strong> (neither moves). To overcome an enemy or defend against an attack, units must <strong>Support</strong> one another:</p>
              <div class="tactical-box">
                <p><strong>Example:</strong> A Paris wants to move into Burgundy. Germany has A Munich holding in Burgundy. France orders A Marseilles to <em>Support</em> Paris -> Burgundy. Paris now attacks with <strong>Strength 2</strong> against Munich's <strong>Strength 1</strong>. The German army is dislodged and forced to retreat!</p>
              </div>
            </section>

            <section class="guide-section">
              <h3>4. Cutting Support</h3>
              <p>Support is fragile! If a supporting unit is attacked by any enemy unit from any adjacent province, its attention is diverted and its support is immediately <strong>CUT</strong> (canceled), reducing the aided attack back to strength 1.</p>
              <div class="tactical-box">
                <p><em>Exception:</em> An attack coming from the very province into which the support is directed does <strong>not</strong> cut the support.</p>
              </div>
            </section>

            <section class="guide-section">
              <h3>5. Fleets & Naval Convoys</h3>
              <p>Armies can cross entire bodies of water in a single turn if fleets form a contiguous chain of <strong>CONVOY</strong> orders (e.g., Fleet in North Sea convoys Army Edinburgh to Norway). If an enemy dislodges any fleet in the convoy route, the convoy is disrupted and the army stays home.</p>
            </section>

            <section class="guide-section">
              <h3>6. The Diplomatic Cable Room & AI Alliances</h3>
              <p>In Diplomacy, bullets only execute what words decide. Use the <strong>Diplomatic Cable Room</strong> to send private telegrams to the AI leaders:</p>
              <ul>
                <li><strong>Demilitarized Zones (DMZs):</strong> Agree to keep key provinces (e.g. Burgundy, Black Sea) empty to prevent border friction.</li>
                <li><strong>Support Requests:</strong> Ask an AI power to support your move into a contested province.</li>
                <li><strong>Alliance Pacts:</strong> Establish non-aggression treaties and coordinate against mutual rivals.</li>
                <li><strong>Trust & Treachery:</strong> Every AI tracks a dynamic Trust meter. Honoring pacts breeds loyalty, while backstabbing will turn allies into vengeful adversaries!</li>
              </ul>
            </section>

            <section class="guide-section">
              <h3>7. Fall Supply & Winter Adjustments</h3>
              <p>At the end of every <strong>Fall</strong> season, ownership of Supply Centers updates for whichever power occupies them. During <strong>Winter</strong>:</p>
              <ul>
                <li>If you have <strong>more SCs than units</strong>: You may build new Armies or Fleets in your unoccupied home Supply Centers.</li>
                <li>If you have <strong>fewer SCs than units</strong>: You must disband excess units.</li>
              </ul>
            </section>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" id="guide-ok-btn">To the War Map</button>
          </div>
        </div>
      </div>
    `;
  }
}
