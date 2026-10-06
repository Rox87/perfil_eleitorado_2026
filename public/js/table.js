// Municipality Ranking Table Manager

export class MunicipalityTable {
  constructor({ containerId, onSelectUf, onRegionChange }) {
    this.container = document.getElementById(containerId);
    this.onSelectUf = onSelectUf;
    this.onRegionChange = onRegionChange;
    this.allData = [];
    this.filteredData = [];
    this.currentPage = 1;
    this.pageSize = 15;
    this.searchQuery = '';
    this.regionFilter = 'all';
    this.sortKey = 'total_eleitores';
    this.sortOrder = 'desc';

    this.init();
  }

  init() {
    if (!this.container) return;
    this.renderSkeleton();
    this.bindEvents();
  }

  renderSkeleton() {
    this.container.innerHTML = `
      <div class="table-toolbar">
        <div class="search-input-wrapper">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" id="muni-search-input" placeholder="Buscar município ou estado (ex: Campinas, BA)...">
        </div>
        
        <div class="filter-group">
          <span class="filter-label">Região:</span>
          <select id="muni-region-select" class="map-metric-select">
            <option value="all">Todas as Regiões</option>
            <option value="Sudeste">Sudeste</option>
            <option value="Nordeste">Nordeste</option>
            <option value="Sul">Sul</option>
            <option value="Norte">Norte</option>
            <option value="Centro-Oeste">Centro-Oeste</option>
          </select>

          <span class="filter-label" style="margin-left: 8px;">Por página:</span>
          <select id="muni-pagesize-select" class="map-metric-select" style="min-width: 60px;">
            <option value="15">15</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>

      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th data-sort="ranking">Rank</th>
              <th data-sort="nome">Município</th>
              <th data-sort="uf">UF</th>
              <th data-sort="total_eleitores" class="sorted-desc">Eleitores Aptos</th>
              <th data-sort="pct_biometria">Biometria</th>
              <th data-sort="pct_fem">Perfil Gênero</th>
              <th data-sort="deficiencia">PCD / Acessibilidade</th>
              <th data-sort="nome_social">Nome Social</th>
            </tr>
          </thead>
          <tbody id="muni-table-body">
            <!-- Populated via JS -->
          </tbody>
        </table>
      </div>

      <div class="table-pagination">
        <div id="muni-pagination-info">Mostrando 1 a 15 de 150 municípios</div>
        <div class="pagination-controls">
          <button id="btn-page-prev" class="btn-page" disabled>Anterior</button>
          <span id="muni-current-page-num" style="font-weight: 700; color: var(--text-primary);">1</span>
          <button id="btn-page-next" class="btn-page">Próximo</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const searchInput = document.getElementById('muni-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.currentPage = 1;
      this.applyFilters();
    });

    const regionSelect = document.getElementById('muni-region-select');
    regionSelect?.addEventListener('change', (e) => {
      this.regionFilter = e.target.value;
      this.currentPage = 1;
      this.applyFilters();
      if (this.onRegionChange) {
        this.onRegionChange(this.regionFilter);
      }
    });

    const pageSizeSelect = document.getElementById('muni-pagesize-select');
    pageSizeSelect?.addEventListener('change', (e) => {
      this.pageSize = parseInt(e.target.value, 10);
      this.currentPage = 1;
      this.renderRows();
    });

    const prevBtn = document.getElementById('btn-page-prev');
    prevBtn?.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderRows();
      }
    });

    const nextBtn = document.getElementById('btn-page-next');
    nextBtn?.addEventListener('click', () => {
      const maxPage = Math.ceil(this.filteredData.length / this.pageSize);
      if (this.currentPage < maxPage) {
        this.currentPage++;
        this.renderRows();
      }
    });

    // Column sort headers
    const ths = this.container.querySelectorAll('th[data-sort]');
    ths.forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-sort');
        if (this.sortKey === key) {
          this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          this.sortKey = key;
          this.sortOrder = 'desc';
        }
        
        ths.forEach(h => h.classList.remove('sorted-asc', 'sorted-desc'));
        th.classList.add(this.sortOrder === 'asc' ? 'sorted-asc' : 'sorted-desc');

        this.applyFilters();
      });
    });
  }

  setData(data) {
    this.allData = data || [];
    this.applyFilters();
  }

  setRegionFilter(region) {
    this.regionFilter = region || 'all';
    const regionSelect = document.getElementById('muni-region-select');
    if (regionSelect) {
      regionSelect.value = this.regionFilter;
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredData = this.allData.filter(item => {
      const matchesSearch = !this.searchQuery || 
        item.nome.toLowerCase().includes(this.searchQuery) ||
        item.uf.toLowerCase().includes(this.searchQuery);
      
      const matchesRegion = this.regionFilter === 'all' || item.regiao === this.regionFilter;

      return matchesSearch && matchesRegion;
    });

    // Sorting
    this.filteredData.sort((a, b) => {
      let valA = a[this.sortKey];
      let valB = b[this.sortKey];

      if (typeof valA === 'string') {
        const comp = valA.localeCompare(valB, 'pt-BR');
        return this.sortOrder === 'asc' ? comp : -comp;
      } else {
        const diff = (valA ?? 0) - (valB ?? 0);
        return this.sortOrder === 'asc' ? diff : -diff;
      }
    });

    this.renderRows();
  }

  renderRows() {
    const tbody = document.getElementById('muni-table-body');
    const pageInfo = document.getElementById('muni-pagination-info');
    const pageNum = document.getElementById('muni-current-page-num');
    const prevBtn = document.getElementById('btn-page-prev');
    const nextBtn = document.getElementById('btn-page-next');

    if (!tbody) return;

    const total = this.filteredData.length;
    const maxPage = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.currentPage > maxPage) this.currentPage = maxPage;

    const startIdx = (this.currentPage - 1) * this.pageSize;
    const endIdx = Math.min(startIdx + this.pageSize, total);
    const pageItems = this.filteredData.slice(startIdx, endIdx);

    if (pageItems.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 36px; color: var(--text-muted);">
            Nenhum município encontrado com os filtros aplicados.
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = pageItems.map((item, idx) => {
        const rank = item.ranking || (startIdx + idx + 1);
        const rankClass = rank === 1 ? 'top-1' : rank === 2 ? 'top-2' : rank === 3 ? 'top-3' : '';

        return `
          <tr>
            <td>
              <span class="rank-badge ${rankClass}">${rank}</span>
            </td>
            <td>
              <strong style="color: var(--text-primary); cursor: pointer;" class="muni-click-trigger" data-uf="${item.uf}">
                ${item.nome}
              </strong>
            </td>
            <td>
              <span class="badge-tag" style="cursor: pointer;" data-uf="${item.uf}">
                ${item.uf}
              </span>
            </td>
            <td>
              <strong style="font-family: var(--font-mono); color: var(--text-primary);">
                ${Number(item.total_eleitores).toLocaleString('pt-BR')}
              </strong>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-family: var(--font-mono); font-size: 0.8rem; min-width: 44px;">
                  ${item.pct_biometria}%
                </span>
                <div style="width: 70px; height: 5px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden;">
                  <div style="width: ${item.pct_biometria}%; height: 100%; background: var(--emerald); border-radius: 3px;"></div>
                </div>
              </div>
            </td>
            <td>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="color: var(--rose); font-weight: 700; font-size: 0.8rem;">${item.pct_fem}% ♀</span>
                <span style="color: var(--text-muted);">/</span>
                <span style="color: var(--blue); font-weight: 700; font-size: 0.8rem;">${item.pct_masc}% ♂</span>
              </div>
            </td>
            <td>
              <span style="font-family: var(--font-mono); color: var(--text-secondary);">
                ${Number(item.deficiencia).toLocaleString('pt-BR')}
              </span>
              <span style="font-size: 0.72rem; color: var(--text-muted);">(${item.pct_deficiencia}%)</span>
            </td>
            <td>
              <span style="font-family: var(--font-mono); color: ${item.nome_social > 0 ? 'var(--violet)' : 'var(--text-muted)'}; font-weight: 600;">
                ${Number(item.nome_social).toLocaleString('pt-BR')}
              </span>
            </td>
          </tr>
        `;
      }).join('');
    }

    // Attach click events on UF badges
    tbody.querySelectorAll('[data-uf]').forEach(el => {
      el.addEventListener('click', () => {
        const uf = el.getAttribute('data-uf');
        if (uf && this.onSelectUf) {
          this.onSelectUf(uf);
        }
      });
    });

    // Update pagination info
    if (pageInfo) {
      pageInfo.innerText = total > 0 
        ? `Mostrando ${startIdx + 1} a ${endIdx} de ${total} municípios`
        : '0 municípios';
    }
    if (pageNum) {
      pageNum.innerText = `${this.currentPage} / ${maxPage}`;
    }
    if (prevBtn) {
      prevBtn.disabled = this.currentPage <= 1;
    }
    if (nextBtn) {
      nextBtn.disabled = this.currentPage >= maxPage;
    }
  }
}
