/**
 * Interactive SVG Map Renderer
 * Handles pan/zoom, provinces, supply centers, unit badges, tactical arrows, and tooltips
 */

import { PROVINCES, POWERS } from '../data/mapData.js';
import { SVG_PATHS } from '../data/svgMapPaths.js';

export class MapRenderer {
  constructor(svgElement, tooltipElement, options = {}) {
    this.svg = svgElement;
    this.tooltip = tooltipElement;
    this.options = options;

    // Viewport & Pan/Zoom state
    this.viewBox = { x: 0, y: 0, width: 1350, height: 960 };
    this.isPanning = false;
    this.startPan = { x: 0, y: 0 };
    this.zoomLevel = 1.0;

    // Callbacks
    this.onProvinceClick = options.onProvinceClick || (() => {});
    this.onUnitClick = options.onUnitClick || (() => {});

    // Layers
    this.layers = {
      seaLayer: null,
      landLayer: null,
      borderLayer: null,
      scLayer: null,
      labelLayer: null,
      arrowLayer: null,
      unitLayer: null
    };

    this._setupDOM();
    this._setupPanZoom();
  }

  _setupDOM() {
    this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);

    // Create defs for gradients and markers
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <!-- Arrow Markers -->
      <marker id="arrow-move" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
      </marker>
      <marker id="arrow-support" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
      </marker>
      <marker id="arrow-convoy" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#f59e0b" />
      </marker>
      <marker id="arrow-bounce" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6">
        <path d="M 2 2 L 8 8 M 8 2 L 2 8" stroke="#ef4444" stroke-width="2" />
      </marker>

      <!-- Glow Filters -->
      <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
      <filter id="unit-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.6"/>
      </filter>
    `;
    this.svg.appendChild(defs);

    // Initialize Group Layers in rendering order
    const layerNames = ['seaLayer', 'landLayer', 'borderLayer', 'scLayer', 'labelLayer', 'arrowLayer', 'unitLayer'];
    layerNames.forEach(name => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('id', `layer-${name}`);
      this.svg.appendChild(g);
      this.layers[name] = g;
    });
  }

  _setupPanZoom() {
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    this.svg.addEventListener('mousedown', e => {
      // Pan only on primary button and not on interactive unit elements
      if (e.button === 0 && !e.target.closest('.unit-token')) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
      }
    });

    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      const dx = (e.clientX - startX) * (this.viewBox.width / this.svg.clientWidth);
      const dy = (e.clientY - startY) * (this.viewBox.height / this.svg.clientHeight);

      this.viewBox.x -= dx;
      this.viewBox.y -= dy;
      startX = e.clientX;
      startY = e.clientY;
      this._updateViewBox();
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Zoom on wheel
    this.svg.addEventListener('wheel', e => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.9 : 1.1;
      const rect = this.svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Mouse pos in SVG coords
      const svgX = this.viewBox.x + (mouseX / rect.width) * this.viewBox.width;
      const svgY = this.viewBox.y + (mouseY / rect.height) * this.viewBox.height;

      const newWidth = Math.max(400, Math.min(2200, this.viewBox.width * zoomFactor));
      const newHeight = newWidth * (960 / 1350);

      this.viewBox.x = svgX - (mouseX / rect.width) * newWidth;
      this.viewBox.y = svgY - (mouseY / rect.height) * newHeight;
      this.viewBox.width = newWidth;
      this.viewBox.height = newHeight;

      this._updateViewBox();
    }, { passive: false });
  }

  _updateViewBox() {
    this.svg.setAttribute('viewBox', `${this.viewBox.x} ${this.viewBox.y} ${this.viewBox.width} ${this.viewBox.height}`);
  }

  resetZoom() {
    this.viewBox = { x: 0, y: 0, width: 1350, height: 960 };
    this._updateViewBox();
  }

  zoomIn() {
    this.viewBox.width *= 0.8;
    this.viewBox.height *= 0.8;
    this._updateViewBox();
  }

  zoomOut() {
    this.viewBox.width *= 1.25;
    this.viewBox.height *= 1.25;
    this._updateViewBox();
  }

  /**
   * Render the entire map given the current game state and active orders
   */
  render(gameState, orders = [], selectedUnit = null, highlightedProvinces = []) {
    this._renderProvinces(gameState, highlightedProvinces);
    this._renderSupplyCenters(gameState);
    this._renderLabels();
    this._renderOrderArrows(orders, gameState);
    this._renderUnits(gameState, selectedUnit);
  }

  _renderProvinces(gameState, highlightedProvinces) {
    this.layers.seaLayer.innerHTML = '';
    this.layers.landLayer.innerHTML = '';

    Object.entries(PROVINCES).forEach(([provId, prov]) => {
      const pathD = SVG_PATHS[provId];
      if (!pathD) return;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathD);
      path.setAttribute('id', `prov-${provId}`);
      path.dataset.provId = provId;

      const isSea = prov.type === 'sea';
      const isHighlighted = highlightedProvinces.includes(provId);
      const owner = gameState.supplyCenters[provId];

      let baseClass = isSea ? 'province sea' : 'province land';
      if (isHighlighted) baseClass += ' highlighted';
      if (owner) baseClass += ` owner-${owner}`;

      path.setAttribute('class', baseClass);

      // Colors
      if (isSea) {
        path.setAttribute('fill', '#14253d');
        path.setAttribute('stroke', '#224168');
        path.setAttribute('stroke-width', '1.5');
      } else {
        if (owner && POWERS[owner]) {
          // Shaded tint of controlling nation
          path.setAttribute('fill', `${POWERS[owner].darkColor}44`);
          path.setAttribute('stroke', POWERS[owner].lightColor);
        } else {
          path.setAttribute('fill', '#2a3441');
          path.setAttribute('stroke', '#475569');
        }
        path.setAttribute('stroke-width', '1.8');
      }

      // Event listeners
      path.addEventListener('click', () => {
        this.onProvinceClick(provId);
      });

      path.addEventListener('mouseenter', e => {
        this._showTooltip(e, prov, gameState);
        path.classList.add('hovered');
      });

      path.addEventListener('mouseleave', () => {
        this._hideTooltip();
        path.classList.remove('hovered');
      });

      if (isSea) {
        this.layers.seaLayer.appendChild(path);
      } else {
        this.layers.landLayer.appendChild(path);
      }
    });
  }

  _renderSupplyCenters(gameState) {
    this.layers.scLayer.innerHTML = '';

    Object.entries(PROVINCES).forEach(([provId, prov]) => {
      if (!prov.isSC) return;
      const [lx, ly] = prov.labelPos || [0, 0];
      const owner = gameState.supplyCenters[provId];

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'sc-marker');
      g.setAttribute('transform', `translate(${lx - 12}, ${ly - 16})`);

      // Outer SC star/circle badge
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('r', '7.5');
      circle.setAttribute('stroke', '#fcd34d');
      circle.setAttribute('stroke-width', '1.8');

      if (owner && POWERS[owner]) {
        circle.setAttribute('fill', POWERS[owner].color);
      } else {
        circle.setAttribute('fill', '#64748b');
      }

      // Star inner emblem
      const star = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      star.setAttribute('points', '0,-4 1.2,-1 4.5,-1 2,1 3,4.5 0,2.5 -3,4.5 -2,1 -4.5,-1 -1.2,-1');
      star.setAttribute('fill', '#ffffff');

      g.appendChild(circle);
      g.appendChild(star);
      this.layers.scLayer.appendChild(g);
    });
  }

  _renderLabels() {
    this.layers.labelLayer.innerHTML = '';

    Object.entries(PROVINCES).forEach(([provId, prov]) => {
      const [lx, ly] = prov.labelPos || [0, 0];
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', lx);
      text.setAttribute('y', ly + 14);
      text.setAttribute('class', `prov-label ${prov.type}`);
      text.setAttribute('text-anchor', 'middle');
      text.textContent = provId.toUpperCase();
      this.layers.labelLayer.appendChild(text);
    });
  }

  _renderUnits(gameState, selectedUnit) {
    this.layers.unitLayer.innerHTML = '';

    gameState.units.forEach(unit => {
      const prov = PROVINCES[unit.province];
      if (!prov) return;

      const [x, y] = prov.labelPos || [0, 0];
      const isSelected = selectedUnit && selectedUnit.province === unit.province;
      const powerMeta = POWERS[unit.power];

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', `unit-token ${isSelected ? 'selected' : ''}`);
      g.setAttribute('transform', `translate(${x}, ${y})`);
      g.setAttribute('filter', 'url(#unit-shadow)');
      g.style.cursor = 'pointer';

      // Base token badge
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('r', '14');
      circle.setAttribute('fill', powerMeta?.color || '#333');
      circle.setAttribute('stroke', isSelected ? '#38bdf8' : '#ffffff');
      circle.setAttribute('stroke-width', isSelected ? '3.5' : '2');

      // Unit Type Icon (A for Army, F for Fleet anchor)
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', '0');
      label.setAttribute('y', '5');
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', '#ffffff');
      label.setAttribute('font-weight', 'bold');
      label.setAttribute('font-size', '13px');
      label.setAttribute('font-family', 'sans-serif');
      label.textContent = unit.type === 'F' ? '⚓' : '⚔';

      // Small coast indicator if split coast
      if (unit.coast) {
        const coastText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        coastText.setAttribute('x', '0');
        coastText.setAttribute('y', '-16');
        coastText.setAttribute('text-anchor', 'middle');
        coastText.setAttribute('fill', '#fde047');
        coastText.setAttribute('font-size', '10px');
        coastText.setAttribute('font-weight', 'bold');
        coastText.textContent = `(${unit.coast.toUpperCase()})`;
        g.appendChild(coastText);
      }

      g.appendChild(circle);
      g.appendChild(label);

      g.addEventListener('click', e => {
        e.stopPropagation();
        this.onUnitClick(unit);
      });

      this.layers.unitLayer.appendChild(g);
    });

    // Render dislodged units with animated pulsing halo
    (gameState.dislodgedUnits || []).forEach(du => {
      const prov = PROVINCES[du.province];
      if (!prov) return;
      const [x, y] = prov.labelPos || [0, 0];

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'dislodged-unit-token');
      g.setAttribute('transform', `translate(${x + 16}, ${y + 12})`);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '0');
      circle.setAttribute('cy', '0');
      circle.setAttribute('r', '11');
      circle.setAttribute('fill', '#ef4444');
      circle.setAttribute('stroke', '#ffffff');
      circle.setAttribute('stroke-width', '2');

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', '4');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#ffffff');
      text.setAttribute('font-size', '10px');
      text.setAttribute('font-weight', 'bold');
      text.textContent = '!';

      g.appendChild(circle);
      g.appendChild(text);

      g.addEventListener('click', e => {
        e.stopPropagation();
        this.onUnitClick(du);
      });

      this.layers.unitLayer.appendChild(g);
    });
  }

  _renderOrderArrows(orders, gameState) {
    this.layers.arrowLayer.innerHTML = '';

    orders.forEach(order => {
      const fromProv = PROVINCES[order.unitProvince];
      if (!fromProv) return;
      const [fx, fy] = fromProv.labelPos || [0, 0];

      if (order.type === 'MOVE') {
        const [targetBase] = order.targetProvince.split('/');
        const toProv = PROVINCES[targetBase];
        if (!toProv) return;
        const [tx, ty] = toProv.labelPos || [0, 0];

        // Draw curved bezier arrow
        const dx = tx - fx;
        const dy = ty - fy;
        const cx = (fx + tx) / 2 - dy * 0.15;
        const cy = (fy + ty) / 2 + dx * 0.15;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${fx} ${fy} Q ${cx} ${cy} ${tx} ${ty}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#10b981');
        path.setAttribute('stroke-width', '3.5');
        path.setAttribute('stroke-dasharray', order.viaConvoy ? '6,4' : 'none');
        path.setAttribute('marker-end', 'url(#arrow-move)');
        path.setAttribute('class', 'tactical-arrow');
        this.layers.arrowLayer.appendChild(path);
      } else if (order.type === 'SUPPORT_MOVE') {
        const [targetBase] = order.supportedTarget.split('/');
        const toProv = PROVINCES[targetBase];
        if (!toProv) return;
        const [tx, ty] = toProv.labelPos || [0, 0];

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${fx} ${fy} L ${tx} ${ty}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#38bdf8');
        path.setAttribute('stroke-width', '2.8');
        path.setAttribute('stroke-dasharray', '5,4');
        path.setAttribute('marker-end', 'url(#arrow-support)');
        this.layers.arrowLayer.appendChild(path);
      } else if (order.type === 'HOLD') {
        // Small gold ring around holding unit
        const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        ring.setAttribute('cx', fx);
        ring.setAttribute('cy', fy);
        ring.setAttribute('r', '18');
        ring.setAttribute('fill', 'none');
        ring.setAttribute('stroke', '#f59e0b');
        ring.setAttribute('stroke-width', '2.2');
        ring.setAttribute('stroke-dasharray', '3,3');
        this.layers.arrowLayer.appendChild(ring);
      }
    });
  }

  _showTooltip(e, prov, gameState) {
    if (!this.tooltip) return;

    const owner = gameState.supplyCenters[prov.id];
    const unit = gameState.units.find(u => u.province === prov.id);
    const ownerName = owner ? POWERS[owner]?.name : 'Neutral / Unclaimed';

    let html = `<strong>${prov.name} (${prov.id.toUpperCase()})</strong><br/>`;
    html += `Type: <em>${prov.type.replace('_', ' ')}</em><br/>`;
    if (prov.isSC) {
      html += `Supply Center: <span style="color:#fcd34d">${ownerName}</span><br/>`;
    }
    if (unit) {
      const pName = POWERS[unit.power]?.name;
      html += `Unit: <strong>${pName} ${unit.type === 'F' ? 'Fleet' : 'Army'}</strong>`;
      if (unit.coast) html += ` (${unit.coast.toUpperCase()})`;
    } else {
      html += `Occupant: <em>Empty</em>`;
    }

    this.tooltip.innerHTML = html;
    this.tooltip.style.display = 'block';
    this.tooltip.style.left = `${e.clientX + 14}px`;
    this.tooltip.style.top = `${e.clientY + 14}px`;
  }

  _hideTooltip() {
    if (this.tooltip) {
      this.tooltip.style.display = 'none';
    }
  }
}
