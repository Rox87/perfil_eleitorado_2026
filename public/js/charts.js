// Chart.js Manager with Custom Aesthetics & Responsive Re-rendering

export class ChartManager {
  constructor() {
    this.charts = {};
  }

  // Formatting helpers
  formatNumber(val) {
    return Number(val).toLocaleString('pt-BR');
  }

  // 1. Demographic Age Pyramid
  renderPyramid(canvasId, piramideData) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const labels = piramideData.map(d => d.faixa);
    const femData = piramideData.map(d => d.fem);
    const mascData = piramideData.map(d => -d.masc); // negative for left-side display

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Mulheres',
            data: femData,
            backgroundColor: 'rgba(244, 63, 94, 0.85)',
            borderColor: '#f43f5e',
            borderWidth: 1,
            borderRadius: { topRight: 4, bottomRight: 4 },
            barPercentage: 0.85
          },
          {
            label: 'Homens',
            data: mascData,
            backgroundColor: 'rgba(59, 130, 246, 0.85)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            borderRadius: { topLeft: 4, bottomLeft: 4 },
            barPercentage: 0.85
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false // custom legend in UI
          },
          tooltip: {
            backgroundColor: 'rgba(11, 18, 33, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            callbacks: {
              label: (context) => {
                const isMasc = context.datasetIndex === 1;
                const rawVal = Math.abs(context.raw);
                const cohortTotal = piramideData[context.dataIndex].total;
                const pct = cohortTotal > 0 ? ((rawVal / cohortTotal) * 100).toFixed(1) : 0;
                return ` ${isMasc ? 'Homens' : 'Mulheres'}: ${this.formatNumber(rawVal)} (${pct}%)`;
              },
              footer: (items) => {
                const idx = items[0].dataIndex;
                const d = piramideData[idx];
                const tipoDesc = d.tipo === 'facultativo_jovem' ? '★ Voto Facultativo Jovem' : 
                                 d.tipo === 'facultativo_idoso' ? '★ Voto Facultativo Idoso' : 'Voto Obrigatório';
                return `Total Faixa: ${this.formatNumber(d.total)}\nStatus: ${tipoDesc}`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: false,
            grid: {
              color: 'rgba(255, 255, 255, 0.06)'
            },
            ticks: {
              color: '#94a3b8',
              font: { family: 'JetBrains Mono', size: 10 },
              callback: (val) => {
                const abs = Math.abs(val);
                if (abs >= 1000000) return (abs / 1000000).toFixed(1) + 'M';
                if (abs >= 1000) return (abs / 1000).toFixed(0) + 'k';
                return abs;
              }
            }
          },
          y: {
            stacked: true,
            grid: { display: false },
            ticks: {
              color: '#f8fafc',
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' }
            }
          }
        }
      }
    });
  }

  // 2. Education Horizontal Bar Chart
  renderEducation(canvasId, escData) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const filtered = escData.filter(d => d.cd !== 0);
    const labels = filtered.map(d => d.grau);
    const totals = filtered.map(d => d.total);
    const sumTotal = totals.reduce((a, b) => a + b, 0);

    const colors = [
      '#64748b', // Analfabeto
      '#0284c7', // Le e escreve
      '#f59e0b', // Fund. incomp.
      '#eab308', // Fund. comp.
      '#8b5cf6', // Médio incomp.
      '#06b6d4', // Médio comp. (maioria)
      '#3b82f6', // Sup. incomp.
      '#10b981'  // Sup. comp.
    ];

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: totals,
          backgroundColor: colors.slice(0, totals.length),
          borderRadius: 6,
          borderWidth: 0,
          barPercentage: 0.75
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(11, 18, 33, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => {
                const val = context.raw;
                const pct = sumTotal > 0 ? ((val / sumTotal) * 100).toFixed(2) : 0;
                return ` ${this.formatNumber(val)} eleitores (${pct}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: {
              color: '#94a3b8',
              font: { family: 'JetBrains Mono', size: 10 },
              callback: (val) => {
                if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
                if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
                return val;
              }
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: '#f8fafc',
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '500' }
            }
          }
        }
      }
    });
  }

  // 3. Marital Status Donut Chart
  renderCivilStatus(canvasId, civilData) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const filtered = civilData.filter(d => d.cd !== 0);
    const labels = filtered.map(d => d.estado_civil);
    const totals = filtered.map(d => d.total);
    const sumTotal = totals.reduce((a, b) => a + b, 0);

    const colors = [
      '#06b6d4', // Solteiro
      '#10b981', // Casado
      '#8b5cf6', // Divorciado
      '#f59e0b', // Viúvo
      '#64748b'  // Separado
    ];

    this.charts[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: totals,
          backgroundColor: colors.slice(0, totals.length),
          borderWidth: 2,
          borderColor: 'rgba(15, 23, 42, 0.8)',
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: '#f8fafc',
              font: { family: 'Plus Jakarta Sans', size: 11 },
              padding: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(11, 18, 33, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => {
                const val = context.raw;
                const pct = sumTotal > 0 ? ((val / sumTotal) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${this.formatNumber(val)} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  // 4. Race/Color Distribution Chart
  renderRace(canvasId, racaData) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    // Sort by declared items first
    const declared = racaData.filter(d => d.cd !== -1);
    const declaredSum = declared.reduce((a, b) => a + b.total, 0);

    const labels = declared.map(d => d.raca);
    const totals = declared.map(d => d.total);

    const colors = [
      '#f59e0b', // Parda
      '#38bdf8', // Branca
      '#8b5cf6', // Preta
      '#10b981', // Indígena
      '#eab308'  // Amarela
    ];

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Eleitores Autodeclarados',
          data: totals,
          backgroundColor: colors.slice(0, totals.length),
          borderRadius: 6,
          barPercentage: 0.7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(11, 18, 33, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => {
                const val = context.raw;
                const pct = declaredSum > 0 ? ((val / declaredSum) * 100).toFixed(1) : 0;
                return ` ${this.formatNumber(val)} eleitores (${pct}% dos declarados)`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#f8fafc',
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' }
            }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: {
              color: '#94a3b8',
              font: { family: 'JetBrains Mono', size: 10 },
              callback: (val) => {
                if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
                if (val >= 1000) return (val / 1000).toFixed(0) + 'k';
                return val;
              }
            }
          }
        }
      }
    });
  }

  // 5. Regional Comparison Horizontal Bar Chart
  renderRegional(canvasId, regioesData, activeRegion = null) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    const regList = Object.values(regioesData).sort((a, b) => b.total_eleitores - a.total_eleitores);
    const labels = regList.map(r => r.regiao);
    const totals = regList.map(r => r.total_eleitores);
    const pcts = regList.map(r => r.pct_nacional);

    const baseColors = {
      'Sudeste': '#06b6d4',
      'Nordeste': '#10b981',
      'Sul': '#3b82f6',
      'Norte': '#8b5cf6',
      'Centro-Oeste': '#f59e0b',
      'Exterior': '#64748b'
    };

    const bgColors = regList.map(r => {
      const color = baseColors[r.regiao] || '#06b6d4';
      if (!activeRegion || activeRegion === 'all') return color;
      return r.regiao === activeRegion ? color : 'rgba(100, 116, 139, 0.35)';
    });

    const borderColors = regList.map(r => {
      if (activeRegion && activeRegion !== 'all' && r.regiao === activeRegion) {
        return '#38bdf8';
      }
      return 'transparent';
    });

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total de Eleitores',
          data: totals,
          backgroundColor: bgColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 6,
          barPercentage: 0.7
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(11, 18, 33, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => {
                const idx = context.dataIndex;
                const r = regList[idx];
                return [
                  ` Eleitores: ${this.formatNumber(r.total_eleitores)} (${r.pct_nacional}% do Brasil)`,
                  ` Biometria: ${r.pct_biometria}%`,
                  ` Mulheres: ${r.pct_fem}% | Homens: ${r.pct_masc}%`,
                  ` Jovens 16-17: ${r.pct_jovens}% | Idosos 70+: ${r.pct_idosos}%`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: {
              color: '#94a3b8',
              font: { family: 'JetBrains Mono', size: 10 },
              callback: (val) => (val / 1000000).toFixed(0) + 'M'
            }
          },
          y: {
            grid: { display: false },
            ticks: {
              color: '#f8fafc',
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' }
            }
          }
        }
      }
    });
  }
}
