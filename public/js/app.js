import { BrazilMap } from './map.js';
import { ChartManager } from './charts.js';
import { MunicipalityTable } from './table.js';

class App {
  constructor() {
    this.dataset = null;
    this.currentUf = null; // null = Brasil (National)
    this.currentRegion = 'all';
    this.currentTab = 'tab-map';

    this.chartManager = new ChartManager();
    this.municipalityTable = null;
    this.brazilMap = null;

    this.init();
  }

  async init() {
    this.initTheme();
    this.bindGlobalEvents();

    try {
      const isCacheEnabled = window.__ENV__?.ENABLE_CACHE === true;
      const cacheBust = isCacheEnabled ? '' : `?_t=${Date.now()}`;
      const fetchOptions = isCacheEnabled ? {} : {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
      };

      let response = await fetch(`./dados/electorate_2026.json${cacheBust}`, fetchOptions);
      if (!response.ok) {
        response = await fetch(`./data/electorate_2026.json${cacheBust}`, fetchOptions);
      }
      if (!response.ok) throw new Error('Falha ao carregar electorate_2026.json');
      this.dataset = await response.json();

      this.populateStateSelect();
      this.initMap();
      this.initTable();
      this.initEditorialInsights();
      this.updateDashboard();

      // Initialize Lucide icons if available
      if (window.lucide) {
        window.lucide.createIcons();
      }
    } catch (err) {
      console.error('Erro na inicialização:', err);
      const appContainer = document.querySelector('.app-container');
      if (appContainer) {
        appContainer.innerHTML = `
          <div style="padding: 40px; text-align: center; color: var(--rose);">
            <h2>Erro ao carregar dados do eleitorado</h2>
            <p style="color: var(--text-secondary); margin-top: 10px;">${err.message}</p>
          </div>
        `;
      }
    }
  }

  // --- Theme Management ---
  initTheme() {
    const savedTheme = localStorage.getItem('elector_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButton(savedTheme);

    const themeBtn = document.getElementById('btn-toggle-theme');
    themeBtn?.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('elector_theme', next);
      this.updateThemeButton(next);
      // Re-render charts with updated theme colors if needed
      this.updateCharts();
    });
  }

  updateThemeButton(theme) {
    const btn = document.getElementById('btn-toggle-theme');
    if (!btn) return;
    const isDark = theme === 'dark';
    btn.innerHTML = isDark
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> Tema Claro`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> Tema Escuro`;
  }

  // --- Bind Global UI Events ---
  bindGlobalEvents() {
    // Navigation Tabs
    const tabs = document.querySelectorAll('.view-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab');
        if (!targetId) return;

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
          targetContent.classList.add('active');
          this.currentTab = targetId;
          // Trigger chart resize / update on tab visibility
          setTimeout(() => this.updateCharts(), 50);
        }
      });
    });

    // Region chips
    const regionChips = document.querySelectorAll('.region-chip');
    regionChips.forEach(chip => {
      chip.addEventListener('click', () => {
        regionChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const region = chip.getAttribute('data-region');
        this.currentRegion = region;

        if (region === 'all') {
          this.selectState(null);
        } else if (region === 'Exterior') {
          this.selectState('ZZ');
        } else {
          // Find first or dominant state in that region
          this.currentUf = null;
          this.updateDashboard();
        }
      });
    });

    // Reset button
    const resetBtn = document.getElementById('btn-reset-filters');
    resetBtn?.addEventListener('click', () => {
      this.resetAllFilters();
    });

    // State select dropdown
    const stateSelect = document.getElementById('state-select');
    stateSelect?.addEventListener('change', (e) => {
      const val = e.target.value;
      this.selectState(val === 'BR' ? null : val);
    });

    // Map metric change selector
    const mapMetricSelect = document.getElementById('map-metric-selector');
    mapMetricSelect?.addEventListener('change', (e) => {
      this.brazilMap?.setMetric(e.target.value);
    });

    // Export button (JSON Download)
    const exportBtn = document.getElementById('btn-export-data');
    exportBtn?.addEventListener('click', () => {
      this.exportDataset();
    });

    // Print button
    const printBtn = document.getElementById('btn-print-report');
    printBtn?.addEventListener('click', () => {
      window.print();
    });
  }

  populateStateSelect() {
    const stateSelect = document.getElementById('state-select');
    if (!stateSelect || !this.dataset) return;

    stateSelect.innerHTML = '<option value="BR">🇧🇷 Brasil (Todo o País)</option>';

    const states = Object.values(this.dataset.estados).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    states.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st.sg_uf;
      opt.innerText = `${st.sg_uf} - ${st.nome}`;
      stateSelect.appendChild(opt);
    });
  }

  // --- Map Initialization ---
  initMap() {
    this.brazilMap = new BrazilMap({
      containerId: 'svg-map-wrapper',
      onStateSelect: (uf) => {
        this.selectState(uf);
      },
      getTooltipData: (uf) => {
        return this.dataset?.estados[uf] || null;
      },
      getMetricData: (metricKey) => {
        return this.getMapMetricValues(metricKey);
      }
    });

    this.brazilMap.updateColors();
  }

  getMapMetricValues(metricKey) {
    if (!this.dataset) return null;
    const values = {};
    let min = Infinity;
    let max = -Infinity;

    for (const [uf, data] of Object.entries(this.dataset.estados)) {
      if (uf === 'ZZ') continue; // Skip Exterior from geo map color scale
      const val = data[metricKey] ?? 0;
      values[uf] = val;
      if (val < min) min = val;
      if (val > max) max = val;
    }

    // Curated color palettes [RGB stops]
    let palette;
    switch (metricKey) {
      case 'pct_biometria':
        palette = [[245, 158, 11], [14, 165, 233], [16, 185, 129]]; // Amber -> Blue -> Emerald
        break;
      case 'pct_fem':
        palette = [[30, 41, 59], [139, 92, 246], [244, 63, 94]]; // Slate -> Violet -> Rose
        break;
      case 'pct_jovens':
        palette = [[30, 41, 59], [59, 130, 246], [139, 92, 246]]; // Slate -> Blue -> Purple
        break;
      case 'pct_idosos':
        palette = [[30, 41, 59], [2, 132, 199], [245, 158, 11]]; // Slate -> Cyan -> Golden Amber
        break;
      case 'pct_deficiencia':
        palette = [[30, 41, 59], [16, 185, 129], [6, 182, 212]]; // Slate -> Emerald -> Electric Cyan
        break;
      case 'total_eleitores':
      default:
        palette = [[30, 41, 59], [2, 132, 199], [6, 182, 212], [16, 185, 129]]; // Slate -> Blue -> Cyan -> Emerald
        break;
    }

    return { values, min, max, palette };
  }

  // --- Table Initialization ---
  initTable() {
    this.municipalityTable = new MunicipalityTable({
      containerId: 'table-container',
      onSelectUf: (uf) => {
        this.selectState(uf);
        // Switch to Map or Overview tab
        document.querySelector('.view-tab[data-tab="tab-map"]')?.click();
      }
    });

    this.updateTableData();
  }

  updateTableData() {
    if (!this.municipalityTable || !this.dataset) return;

    if (this.currentUf && this.dataset.estados[this.currentUf]) {
      // Show top municipalities of the selected state
      const stateData = this.dataset.estados[this.currentUf];
      this.municipalityTable.setData(stateData.top_municipios);
    } else {
      // Show national top 150
      this.municipalityTable.setData(this.dataset.top_municipios);
    }
  }

  // --- State Selection Controller ---
  selectState(uf) {
    this.currentUf = uf;

    // Update Dropdown
    const stateSelect = document.getElementById('state-select');
    if (stateSelect) {
      stateSelect.value = uf || 'BR';
    }

    // Update Map
    this.brazilMap?.selectState(uf, false);

    // Update Dashboard UI & Charts
    this.updateDashboard();
  }

  resetAllFilters() {
    this.currentUf = null;
    this.currentRegion = 'all';

    const stateSelect = document.getElementById('state-select');
    if (stateSelect) stateSelect.value = 'BR';

    document.querySelectorAll('.region-chip').forEach(c => {
      c.classList.toggle('active', c.getAttribute('data-region') === 'all');
    });

    this.brazilMap?.selectState(null, false);
    this.updateDashboard();
  }

  // --- Core Dashboard UI & Chart Updates ---
  updateDashboard() {
    if (!this.dataset) return;

    const currentEntity = this.currentUf ? this.dataset.estados[this.currentUf] : this.dataset.brasil;
    if (!currentEntity) return;

    this.updateHeaderBadges(currentEntity);
    this.updateKpis(currentEntity);
    this.updateArchetypeCard(currentEntity);
    this.updateSideDossier(currentEntity);
    this.updateCharts();
    this.updateTableData();
  }

  updateHeaderBadges(entity) {
    const isState = !!this.currentUf;
    const titleScope = document.getElementById('current-scope-label');
    const badgeNacional = document.getElementById('badge-representatividade');

    if (titleScope) {
      titleScope.innerText = isState ? `${entity.nome} (${entity.sg_uf})` : 'Brasil (Nacional)';
    }

    if (badgeNacional) {
      badgeNacional.innerText = isState
        ? `${entity.pct_nacional}% do Eleitorado Nacional`
        : '100% Território Nacional';
    }
  }

  updateKpis(entity) {
    // 1. Total Eleitores
    this.animateCounter('kpi-total-eleitores', entity.total_eleitores);
    const subTotal = document.getElementById('kpi-sub-total');
    if (subTotal) {
      subTotal.innerText = this.currentUf 
        ? `${entity.pct_nacional}% do colégio eleitoral brasileiro`
        : `${this.dataset.metadata.linhas_processadas.toLocaleString('pt-BR')} registros computados`;
    }

    // 2. Mulheres vs Homens
    this.animateCounter('kpi-mulheres-count', entity.fem);
    const femPct = document.getElementById('kpi-mulheres-pct');
    if (femPct) femPct.innerText = `${entity.pct_fem}% Mulheres`;

    const mascSub = document.getElementById('kpi-homens-sub');
    if (mascSub) {
      mascSub.innerText = `${Number(entity.masc).toLocaleString('pt-BR')} homens (${entity.pct_masc}%)`;
    }

    const fillFem = document.getElementById('kpi-fill-fem');
    const fillMasc = document.getElementById('kpi-fill-masc');
    if (fillFem) fillFem.style.width = `${entity.pct_fem}%`;
    if (fillMasc) fillMasc.style.width = `${entity.pct_masc}%`;

    // 3. Biometria
    this.animateCounter('kpi-biometria-count', entity.biometria);
    const bioPct = document.getElementById('kpi-biometria-pct');
    if (bioPct) bioPct.innerText = `${entity.pct_biometria}%`;

    const fillBio = document.getElementById('kpi-fill-biometria');
    if (fillBio) fillBio.style.width = `${entity.pct_biometria}%`;

    // 4. Voto Facultativo
    const totalFacultativo = (entity.jovens_facultativo || 0) + (entity.idosos_facultativo || 0);
    this.animateCounter('kpi-facultativo-count', totalFacultativo);

    const facPct = document.getElementById('kpi-facultativo-pct');
    const totalVoters = entity.total_eleitores || 1;
    const facRatio = ((totalFacultativo / totalVoters) * 100).toFixed(1);
    if (facPct) facPct.innerText = `${facRatio}%`;

    const facSub = document.getElementById('kpi-facultativo-sub');
    if (facSub) {
      facSub.innerText = `${Number(entity.jovens_facultativo).toLocaleString('pt-BR')} jovens (16-17) • ${Number(entity.idosos_facultativo).toLocaleString('pt-BR')} idosos (70+)`;
    }

    // 5. Inclusão & Cidadania
    this.animateCounter('kpi-deficiencia-count', entity.deficiencia);
    const pcdSub = document.getElementById('kpi-deficiencia-sub');
    if (pcdSub) {
      pcdSub.innerText = `${entity.pct_deficiencia}% com deficiência • ${Number(entity.nome_social || 0).toLocaleString('pt-BR')} nome social`;
    }
  }

  updateArchetypeCard(entity) {
    const arch = entity.arquetipo;
    if (!arch) return;

    const headline = document.getElementById('arch-headline');
    const summary = document.getElementById('arch-summary');
    const itemGen = document.getElementById('arch-genero');
    const itemAge = document.getElementById('arch-faixa');
    const itemEsc = document.getElementById('arch-escolaridade');
    const itemCiv = document.getElementById('arch-civil');
    const itemBio = document.getElementById('arch-biometria');

    if (headline) headline.innerText = `Eleitor(a) Mediano(a): ${entity.nome}`;
    if (summary) summary.innerText = arch.resumo;
    if (itemGen) itemGen.innerText = arch.genero;
    if (itemAge) itemAge.innerText = arch.faixa_etaria;
    if (itemEsc) itemEsc.innerText = arch.escolaridade;
    if (itemCiv) itemCiv.innerText = arch.estado_civil;
    if (itemBio) itemBio.innerText = arch.biometria_status;
  }

  updateSideDossier(entity) {
    const dossierTitle = document.getElementById('dossier-state-name');
    const dossierMunCount = document.getElementById('dossier-municipios-count');
    const dossierQuilomb = document.getElementById('dossier-quilombolas');
    const dossierLibras = document.getElementById('dossier-libras');
    const dossierTrans = document.getElementById('dossier-trans');

    if (dossierTitle) dossierTitle.innerText = `${entity.nome} (${entity.sg_uf})`;
    if (dossierMunCount) dossierMunCount.innerText = Number(entity.total_municipios || 0).toLocaleString('pt-BR');
    if (dossierQuilomb) dossierQuilomb.innerText = Number(entity.quilombolas || 0).toLocaleString('pt-BR');
    if (dossierLibras) dossierLibras.innerText = Number(entity.libras || 0).toLocaleString('pt-BR');
    if (dossierTrans) dossierTrans.innerText = Number(entity.trans || 0).toLocaleString('pt-BR');
  }

  updateCharts() {
    if (!this.dataset) return;
    const entity = this.currentUf ? this.dataset.estados[this.currentUf] : this.dataset.brasil;
    if (!entity) return;

    // 1. Pyramid
    if (entity.piramide && entity.piramide.length > 0) {
      this.chartManager.renderPyramid('canvas-pyramid', entity.piramide);
    }

    // 2. Education
    if (entity.escolaridade && entity.escolaridade.length > 0) {
      this.chartManager.renderEducation('canvas-education', entity.escolaridade);
    }

    // 3. Marital Status
    if (entity.estado_civil && entity.estado_civil.length > 0) {
      this.chartManager.renderCivilStatus('canvas-civil', entity.estado_civil);
    }

    // 4. Race/Color
    if (entity.raca && entity.raca.length > 0) {
      this.chartManager.renderRace('canvas-race', entity.raca);
    }

    // 5. Regional Comparison (National level)
    if (this.dataset.regioes) {
      this.chartManager.renderRegional('canvas-regional', this.dataset.regioes);
    }
  }

  // --- Editorial Insights Stories ---
  initEditorialInsights() {
    const container = document.getElementById('insights-cards-container');
    if (!container || !this.dataset?.insights) return;

    container.innerHTML = this.dataset.insights.map(item => `
      <article class="insight-article-card" id="insight-${item.id}">
        <span class="insight-tag">${item.tag}</span>
        <div class="insight-metric-highlight">
          <div class="insight-big-number">${item.destaque}</div>
          <div class="insight-metric-label">${item.destaque_label}</div>
        </div>
        <h3 class="insight-article-title">${item.titulo}</h3>
        <p class="insight-article-body">${item.texto}</p>
      </article>
    `).join('');
  }

  // --- Helper: CountUp Animation ---
  animateCounter(elemId, targetValue, duration = 800) {
    const el = document.getElementById(elemId);
    if (!el) return;

    const startVal = 0;
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (targetValue - startVal) * ease);

      el.innerText = current.toLocaleString('pt-BR');

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  }

  // --- Export JSON ---
  exportDataset() {
    if (!this.dataset) return;
    const blob = new Blob([JSON.stringify(this.dataset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perfil_eleitorado_2026_${this.currentUf || 'BRASIL'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Instantiate on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  window.electorApp = new App();
});
