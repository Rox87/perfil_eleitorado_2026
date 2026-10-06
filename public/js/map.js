import { BRAZIL_PATHS } from './brazil_paths.js';

export class BrazilMap {
  constructor({ containerId, onStateSelect, getTooltipData, getMetricData }) {
    this.container = document.getElementById(containerId);
    this.onStateSelect = onStateSelect;
    this.getTooltipData = getTooltipData;
    this.getMetricData = getMetricData;
    this.selectedUf = null;
    this.currentMetric = 'total_eleitores';
    this.activeRegion = 'all';
    this.regionStateUfs = [];

    this.init();
  }

  init() {
    if (!this.container) return;

    // Create SVG root
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 1000 912');
    svg.setAttribute('class', 'brazil-svg-root');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Mapa Interativo do Brasil - Perfil Eleitoral');

    // Group for paths
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'states-group');

    // Create paths for each UF
    for (const [uf, d] of Object.entries(BRAZIL_PATHS)) {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('id', `state-${uf}`);
      path.setAttribute('data-uf', uf);
      path.setAttribute('class', 'state-path');
      path.setAttribute('tabindex', '0');
      path.setAttribute('role', 'button');

      // Click event
      path.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectState(uf);
      });

      // Hover events for tooltip
      path.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, uf));
      path.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      path.addEventListener('mouseleave', () => this.handleMouseLeave());

      g.appendChild(path);
    }

    svg.appendChild(g);
    this.container.innerHTML = '';
    this.container.appendChild(svg);

    // Create floating tooltip element
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'map-floating-tooltip';
    this.container.appendChild(this.tooltip);

    // Clicking anywhere outside states in container resets selection to Brasil
    this.container.addEventListener('click', (e) => {
      if (e.target.tagName !== 'path') {
        this.selectState(null);
      }
    });
  }

  setMetric(metricKey) {
    this.currentMetric = metricKey;
    this.updateColors();
  }

  updateColors() {
    const metricInfo = this.getMetricData ? this.getMetricData(this.currentMetric) : null;
    if (!metricInfo) return;

    const { values, min, max, palette } = metricInfo;

    for (const [uf, pathEl] of Object.entries(this.getStateElements())) {
      const val = values[uf] ?? 0;
      const ratio = max > min ? Math.max(0, Math.min(1, (val - min) / (max - min))) : 0.5;
      const fillColor = this.interpolateColor(palette, ratio);
      pathEl.style.fill = fillColor;
    }
  }

  interpolateColor(palette, t) {
    // palette is an array of [r,g,b] stops
    if (!palette || palette.length < 2) return '#06b6d4';
    const numSegments = palette.length - 1;
    const segment = Math.min(Math.floor(t * numSegments), numSegments - 1);
    const localT = (t * numSegments) - segment;

    const c1 = palette[segment];
    const c2 = palette[segment + 1];

    const r = Math.round(c1[0] + localT * (c2[0] - c1[0]));
    const g = Math.round(c1[1] + localT * (c2[1] - c1[1]));
    const b = Math.round(c1[2] + localT * (c2[2] - c1[2]));

    return `rgb(${r}, ${g}, ${b})`;
  }

  selectState(uf, triggerCallback = true) {
    this.selectedUf = uf;

    // Update classes
    const paths = this.container.querySelectorAll('.state-path');
    paths.forEach(p => {
      if (p.getAttribute('data-uf') === uf) {
        p.classList.add('selected');
        // Bring to front
        p.parentNode.appendChild(p);
      } else {
        p.classList.remove('selected');
      }
    });

    if (triggerCallback && this.onStateSelect) {
      this.onStateSelect(uf);
    }
  }

  highlightRegion(regionName, stateUfs = []) {
    this.activeRegion = regionName || 'all';
    this.regionStateUfs = Array.isArray(stateUfs) ? stateUfs : [];

    const paths = this.container?.querySelectorAll('.state-path') || [];
    paths.forEach(p => {
      const uf = p.getAttribute('data-uf');
      if (!this.activeRegion || this.activeRegion === 'all') {
        p.classList.remove('region-dimmed', 'region-active');
      } else if (this.regionStateUfs.includes(uf)) {
        p.classList.add('region-active');
        p.classList.remove('region-dimmed');
      } else {
        p.classList.add('region-dimmed');
        p.classList.remove('region-active');
      }
    });
  }

  handleMouseEnter(e, uf) {
    if (!this.getTooltipData) return;
    const data = this.getTooltipData(uf);
    if (!data) return;

    this.tooltip.innerHTML = `
      <div class="tooltip-header">
        <span class="tooltip-state-name">${data.nome}</span>
        <span class="tooltip-state-uf">${data.sg_uf}</span>
      </div>
      <div class="tooltip-row">
        <span>Região:</span>
        <strong>${data.regiao}</strong>
      </div>
      <div class="tooltip-row">
        <span>Eleitorado:</span>
        <strong>${Number(data.total_eleitores).toLocaleString('pt-BR')}</strong>
      </div>
      <div class="tooltip-row">
        <span>Peso Nacional:</span>
        <strong>${data.pct_nacional}%</strong>
      </div>
      <div class="tooltip-row">
        <span>Biometria:</span>
        <strong style="color: var(--emerald);">${data.pct_biometria}%</strong>
      </div>
      <div class="tooltip-row">
        <span>Mulheres:</span>
        <strong style="color: var(--rose);">${data.pct_fem}%</strong>
      </div>
      <div class="tooltip-row">
        <span>Homens:</span>
        <strong style="color: var(--blue);">${data.pct_masc}%</strong>
      </div>
      <div class="tooltip-row">
        <span>PCD / Deficiência:</span>
        <strong>${Number(data.deficiencia).toLocaleString('pt-BR')} (${data.pct_deficiencia}%)</strong>
      </div>
      <div style="margin-top: 6px; font-size: 0.7rem; color: var(--cyan); text-align: center; font-weight: 600;">
        Clique para filtrar o dashboard
      </div>
    `;

    this.tooltip.classList.add('active');
    this.positionTooltip(e);
  }

  handleMouseMove(e) {
    this.positionTooltip(e);
  }

  handleMouseLeave() {
    this.tooltip.classList.remove('active');
  }

  positionTooltip(e) {
    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  getStateElements() {
    const map = {};
    const paths = this.container.querySelectorAll('.state-path');
    paths.forEach(p => {
      map[p.getAttribute('data-uf')] = p;
    });
    return map;
  }
}
