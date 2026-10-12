# Design Specification: Redesign Front-End Editorial & Raio-X Educacional Dinâmico

**Data:** 12 de Outubro de 2026  
**Status:** Proposto para Aprovação  
**Projeto:** Perfil do Eleitorado 2026 (TSE)  
**Autor:** Antigravity & Usuário  

---

## 1. Contexto e Motivação (Intent & The Why)

O dashboard *Perfil do Eleitorado 2026* reúne uma base abrangente de dados estatísticos oficiais do Tribunal Superior Eleitoral (TSE) abrangendo mais de 158,7 milhões de eleitores aptos a votar em 5.570 municípios brasileiros e no exterior.

Apesar da riqueza dos dados, a interface atual utilizava elementos estéticos com inspiração em produtos "crypto/gaming" — como orbes fluorescentes pulsantes no fundo (`.ambient-glow`), sombras neon e saturação de cores excessiva —, transmitindo um tom informal que conflita com a sobriedade institucional esperada de um observatório de dados públicos e eleitorais.

O objetivo deste projeto é realizar um redesign front-end completo, orientando a experiência para o padrão **Editorial & Data Journalism** (inspirado nas referências visuais de *The Economist*, *Financial Times* e *Bloomberg Graphics*), que combina seriedade, elegância e máxima clareza analítica, além de garantir que todos os painéis e o **Raio-X Educacional do Eleitorado** reajam dinamicamente aos filtros territoriais (Brasil, Região e Estados).

---

## 2. Metas, Não-Metas e Anti-Metas

### Metas (Goals)
1. **Estética Editorial & Data Journalism:** Transformar a identidade visual do dashboard em um produto jornalístico/analítico sóbrio, atraente e confiável.
2. **Sistema Dual de Temas:**
   - **Dark Mineral (Padrão):** Fundo grafite/ardósia escuro (`#0f141c` / `#161e2b`), contraste refinado, texto marfim e números tabulares legíveis.
   - **Light Paper Editorial:** Fundo off-white/papel jornal térmico (`#f8fafc` / `#ffffff`), linhas finas e acabamento de infografia impressa.
   - Alternância fluida e persistente via botão no cabeçalho.
3. **Purgação do Ruído Neon:** Eliminar completamente `.ambient-glow`, halos fluorescentes e sombras excessivas.
4. **Tipografia e Hierarquia:** Adotar tipografia editorial refinada nos títulos e subtítulos com numerais tabulares alinhados (`JetBrains Mono` / `Outfit` / `Plus Jakarta Sans`).
5. **Dinamização do Raio-X Educacional:** Integrar os quatro cartões de indicadores de escolaridade (Ensino Médio, Superior Completo, Fundamental Incompleto, Analfabetos) ao ciclo de re-renderização por filtros territoriais de estado e macrorregião.
6. **Harmonização de Gráficos e Cartografia:** Ajustar paletas de cores do Chart.js (pirâmide, escolaridade, estado civil, raça) e do mapa SVG para refletir a nova paleta nos modos Dark e Light.

### Não-Metas (Non-Goals)
- Não alterar a estrutura de dados bruta extraída do TSE nem o pipeline de extração de dados Python (`extract_data.py`), preservando a compatibilidade integral com `public/dados/electorate_2026.json`.
- Não substituir bibliotecas fundamentais (Chart.js e SVG nativo continuam sendo o motor de renderização).

### Anti-Metas (Anti-Goals)
- **Não criar visual genérico ou corporativo monótono:** A aplicação deve ser séria, mas visualmente memorável ("bonita", com ritmo visual equilibrado, micro-interações refinadas e espaçamentos nobres).
- **Não quebrar responsividade:** A experiência mobile e tablet deve manter a mesma elegância do desktop.
- **Não introduzir dependências pesadas de terceiros:** Manter arquitetura limpa em Vanilla CSS e Vanilla JS sem bundlers obrigatórios.

---

## 3. Decisões de Design Definidas com o Usuário

1. **Direção Estética:** Opção B — *Editorial & Data Journalism*.
2. **Tema:** Opção 3 — *Dual Elegante*, com *Dark Mineral Editorial* definido como padrão inicial da aplicação.
3. **Comportamento Educacional:** O módulo *Raio-X Educacional do Eleitorado* deve atualizar dinamicamente valores absolutos e percentuais sempre que um filtro de Região ou Estado for selecionado.

---

## 4. Especificação Técnica dos Módulos

### 4.1. Design System & CSS (`public/css/style.css`)
- **Variáveis de Tema CSS (`[data-theme="dark"]` e `[data-theme="light"]`):**
  - `--bg-canvas`: `#0a0e14` (dark) / `#f8fafc` (light)
  - `--bg-surface`: `#111622` (dark) / `#ffffff` (light)
  - `--bg-surface-elevated`: `#161e2e` (dark) / `#f1f5f9` (light)
  - `--border-subtle`: `rgba(255, 255, 255, 0.07)` (dark) / `rgba(15, 23, 42, 0.08)` (light)
  - `--border-focus`: `#3b82f6` (dark) / `#2563eb` (light)
  - `--text-primary`: `#f8fafc` (dark) / `#0f172a` (light)
  - `--text-secondary`: `#94a3b8` (dark) / `#475569` (light)
  - `--text-muted`: `#64748b` (dark) / `#94a3b8` (light)
- **Paleta de Dados Estatísticos Editorial:**
  - Azul Institucional (Cobertura total e neutros): `#2563eb` / `#38bdf8`
  - Terracota/Coral Sóbrio (Feminino): `#e11d48` / `#f43f5e`
  - Azul Ardósia Sóbrio (Masculino): `#3b82f6` / `#60a5fa`
  - Esmeralda Institucional (Biometria): `#059669` / `#10b981`
  - Âmbar Editorial (Facultativo/Atenção): `#d97706` / `#f59e0b`
  - Púrpura Editorial (Inclusão/PCD): `#7c3aed` / `#8b5cf6`
- **Remoção de Efeitos:**
  - Excluir regras e elementos de `.ambient-glow` e `@keyframes pulseGlow`.
  - Reduzir `box-shadow` exagerados para sombras arquitetônicas sutis (`0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)`).

### 4.2. Estrutura HTML (`public/index.html`)
- **Header:**
  - Identificação clara do Tribunal Superior Eleitoral e do colégio eleitoral nacional.
  - Botão de alternância de tema moderno com ícone Sol/Lua e texto contextual.
- **Barra de Controle Territorial:**
  - Chips regionais no estilo de abas de caderno jornalístico com indicador de estado ativo discreto.
  - Seletor de Estados com estilo uniforme e botão de reset integrado.
- **Cartões de KPIs Superiores:**
  - Micro-anotações analíticas contextuais abaixo dos números.
  - Barras de proporção de gênero e de biometria integradas com precisão visual.
- **Módulo de Escolaridade & Instrução (`#tab-education`):**
  - Gráfico de barras no lado esquerdo (`canvas-education`).
  - Painel lateral direito *Raio-X Educacional do Eleitorado* atualizado com IDs dedicados:
    - `edu-kpi-medio-count`, `edu-kpi-medio-pct`
    - `edu-kpi-superior-count`, `edu-kpi-superior-pct`
    - `edu-kpi-fundamental-count`, `edu-kpi-fundamental-pct`
    - `edu-kpi-analfabeto-count`, `edu-kpi-analfabeto-pct`
    - `edu-predominante-label`, `edu-predominante-badge`

### 4.3. Lógica Frontend (`public/js/app.js` e `public/js/charts.js`)
- **Atualização Dinâmica do Raio-X Educacional:**
  - No método `renderActiveScope(entity)` de `app.js`:
    - Criar `updateEducationDossier(escolaridade, totalEleitores)`.
    - Localizar os níveis de ensino correspondentes aos códigos ou rótulos:
      - Código 6: Ensino Médio Completo
      - Código 8: Superior Completo
      - Código 3: Fundamental Incompleto
      - Código 1: Analfabeto
    - Calcular percentual relativo sobre o total de eleitores do escopo filtrado.
    - Atualizar os elementos no DOM com valores formatados em pt-BR.
- **Atualização de Paleta dos Gráficos (`charts.js`):**
  - Implementar método para redesenhar/recolorir gráficos ao alternar tema (Dark vs Light).
  - Cores dos eixos (`grid.color`, `ticks.color`) sincronizadas com as variáveis CSS ativas.
- **Mapa Vetorial (`public/js/map.js`):**
  - Cores coropléticas calibradas para contrastar no Dark Mineral e no Light Paper com legibilidade imediata das siglas e contornos de UF.

---

## 5. O que fica a cargo do construtor (Implementation Decisions)
1. **Fallback seguro:** Se um estado tiver valores ausentes ou formato inconsistente em escolaridade, calcular com base nos totais somados da coleção do estado.
2. **Persistência de Tema:** Gravar a preferência do usuário em `localStorage.getItem('tse_theme')`, mantendo 'dark' como default quando nenhuma preferência for registrada.
3. **Transições suaves:** Transições CSS de 150ms a 200ms para mudança de tema sem efeito de flash indesejado.

---

## 6. Critérios de Aceite e Verificação
1. **Visual:** A interface deve carregar no tema Dark Mineral com estética sóbria e elegante, sem elementos neon ou orbes no fundo.
2. **Alternância de Tema:** Clicar no botão de tema alterna instantaneamente para o tema Light Paper e de volta para Dark, mantendo legibilidade total dos textos e gráficos.
3. **Filtros Territoriais:**
   - Selecionar uma região (ex.: "Nordeste") atualiza os KPIs, a pirâmide, o mapa e os cartões do *Raio-X Educacional*.
   - Selecionar um estado (ex.: "SP" ou "AM") recalcula instantaneamente os números e porcentagens de *Ensino Médio*, *Superior Completo*, *Fundamental Incompleto* e *Analfabetos* para aquele estado.
   - Clicar em "Restaurar Brasil" retorna aos números consolidados nacionais de 158.745.463 eleitores.
4. **Sem erros no console:** Nenhuma exceção não tratada ao navegar por abas ou alternar estados.
