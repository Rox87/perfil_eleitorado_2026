# 🗳️ Perfil do Eleitorado 2026 — Observatório Analítico Interativo

[![Dados Abertos TSE](https://img.shields.io/badge/Fonte-TSE%20Dados%20Abertos-0a84ff.svg)](https://dadosabertos.tse.jus.br/dataset/eleitorado-2026)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![DuckDB Fast Engine](https://img.shields.io/badge/Engine-DuckDB-FFF000.svg)](https://duckdb.org/)
[![Design Editorial](https://img.shields.io/badge/Design-Editorial%20%26%20Data%20Journalism-10b981.svg)](#)
[![Status](https://img.shields.io/badge/Status-Eleições%202026-purple.svg)](#)

Dashboard analítico de alta precisão e jornalismo de dados sobre o perfil demográfico, territorial e educacional dos mais de **158,7 milhões de eleitores brasileiros** aptos para as Eleições 2026, com dados estatísticos oficiais do **Tribunal Superior Eleitoral (TSE)**.

---

## 📌 Sumário
- [Visão Geral](#-visão-geral)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Como Executar o Dashboard](#-como-executar-o-dashboard)
- [Configuração de Ambiente e Cache](#-configuração-de-ambiente-e-cache)
- [Pipeline de Extração de Dados (DuckDB)](#-pipeline-de-extração-de-dados-duckdb)
- [Estrutura do Repositório](#-estrutura-do-repositório)
- [Fonte dos Dados e Metodologia](#-fonte-dos-dados-e-metodologia)

---

## 📊 Visão Geral

O projeto transforma os microdados brutos do TSE (mais de 11 milhões de linhas de registros eleitorais em CSV) em uma plataforma interativa, fluida e com rigor de data journalism. 

### Principais Indicadores Consolidados (Brasil):
* **Colégio Eleitoral:** 158.745.463 eleitores em 5.570 municípios e 186 cidades no exterior (Zona ZZ).
* **Maioria Feminina:** 83.877.126 eleitoras (52,84%) contra 74.845.001 eleitores masculinos (47,15%).
* **Identificação Biométrica:** 141.301.540 eleitores cadastrados digitalmente (89,01%).
* **Voto Facultativo:** 18,8 milhões de cidadãos (1,6M de jovens de 16-17 anos e 17,2M de idosos com 70 anos ou mais).
* **Cidadania e Inclusão:** Mais de 1,97 milhão de eleitores com deficiência (PCD) e 38.472 eleitores com nome social registrado.

---

## 🚀 Funcionalidades Principais

1. **Filtros Territoriais em Cascata:**
   - Alternância instantânea entre visão **Nacional**, **Macrorregiões** (Sudeste, Nordeste, Sul, Norte, Centro-Oeste, Exterior) e as **27 Unidades Federativas (UFs)**.
2. **Mapa Vetorial Cloroplético Interativo:**
   - Mapa SVG responsivo do Brasil com graduação cromática por densidade de eleitorado, seleção com clique e painel lateral com estatísticas da UF.
3. **Pirâmide Demográfica Bi-lateral:**
   - Visualização simétrica por gênero e faixas etárias detalhadas (desde 16 anos até 100+ anos).
4. **Raio-X Educacional Dinâmico:**
   - Painel analítico de escolaridade que acompanha dinamicamente os filtros territoriais, recalculando volumes e proporções de ensino superior, médio, fundamental e analfabetismo por estado/região.
5. **Top Municípios & Maiores Colégios Eleitorais:**
   - Tabela com busca em tempo real, ordenação e paginação dos maiores municípios votantes.
6. **Dossiê Analítico com Insights Editoriais:**
   - Narrativa estruturada em artigos sobre os aspectos mais determinantes do eleitorado 2026.
7. **Sistema Dual de Temas:**
   - **Dark Mineral Editorial (Padrão):** Contraste e legibilidade em grafite mineral profundo (#0f141c).
   - **Light Paper Editorial:** Visual clássico de grandes infografias impressas internacionais (#f8fafc).
   - Alternador rápido persistido em `localStorage`.
8. **Exportação de Dados & Relatório:**
   - Exportação direta dos recortes em JSON e botão nativo para geração de relatório para impressão ou PDF.

---

## 💻 Como Executar o Dashboard

Os dados já estão **pré-processados e otimizados** em formato JSON no repositório. Não é necessário banco de dados externo ou servidor complexo.

### Pré-requisito:
* Python 3.8 ou superior instalado.

### Execução:
Na raiz do projeto, execute:
```bash
python scripts/serve.py
```

Abra o seu navegador e acesse:
```
http://localhost:8080
```

---

## ⚙️ Configuração de Ambiente e Cache

O servidor local (`scripts/serve.py`) permite configurar a política de cache HTTP dinamicamente através do arquivo `.env`:

1. Copie o arquivo de exemplo:
   ```bash
   cp .env_example .env
   ```
2. Defina o comportamento desejado:
   * `ENABLE_CACHE=false` (padrão): Desativa o cache do navegador (`no-cache`), ideal para desenvolvimento e atualização imediata do frontend.
   * `ENABLE_CACHE=true`: Ativa cache público de 1 hora (`max-age=3600`) para melhor performance.

---

## 🔄 Pipeline de Extração de Dados (DuckDB)

Caso deseje reprocessar ou atualizar os microdados diretamente dos arquivos originais do TSE:

### 1. Instale os pacotes Python necessários:
```bash
pip install -r requirements.txt
```
*(O pipeline utiliza [DuckDB](https://duckdb.org/) como motor analítico embarcado de altíssima performance para processar milhões de linhas em segundos sem estourar memória RAM).*

### 2. Obtenha os arquivos brutos do TSE:
1. Baixe os arquivos CSV de **Eleitorado - 2026** no portal oficial:
   👉 [TSE Dados Abertos — Perfil do Eleitorado 2026](https://dadosabertos.tse.jus.br/dataset/eleitorado-2026)
2. Descompacte os arquivos CSV dentro do diretório `dados/`.

### 3. Execute o script de extração e agregação:
```bash
python scripts/extract_data.py
```

O script:
- Faz a leitura analítica vetorizada dos CSVs via DuckDB;
- Agrega pirâmides etárias, níveis de escolaridade, estado civil, biometria e inclusão por município e por UF;
- Gera o arquivo otimizado consolidado em:
  `public/dados/electorate_2026.json`.

---

## 📁 Estrutura do Repositório

```plaintext
perfil_eleitorado_2026/
├── dados/                       # Diretório para CSVs brutos do TSE (ignorado no git)
├── docs/                        # Documentos de especificação e design
│   └── superpowers/specs/       # Especificação técnica do redesign editorial
├── public/                      # Aplicação web estática servida ao navegador
│   ├── css/
│   │   └── style.css            # Design System (Dark Mineral & Light Paper)
│   ├── dados/
│   │   └── electorate_2026.json # Dados analíticos consolidados do TSE
│   ├── js/
│   │   ├── app.js               # Controlador central e lógica de filtros
│   │   ├── charts.js            # Integração com Chart.js (pirâmide, educação, etc.)
│   │   ├── map.js               # Lógica do mapa vetorial interativo
│   │   ├── table.js             # Tabela e paginação dos municípios
│   │   └── brazil_paths.js      # Coordenadas vetoriais SVG dos estados
│   ├── vendor/                  # Dependências offline locais (Chart.js, Lucide)
│   ├── brazil_map.svg           # Mapa base em vetor
│   └── index.html               # Estrutura semântica do dashboard
├── scripts/
│   ├── extract_data.py          # Pipeline analítico de ETL (DuckDB -> JSON)
│   └── serve.py                 # Servidor local Python com controle de cache
├── .env_example                 # Exemplo de configuração de cache
├── requirements.txt             # Dependências Python (duckdb)
└── readme.md                    # Documentação do projeto
```

---

## 📜 Fonte dos Dados e Metodologia

* **Fonte Primária:** Tribunal Superior Eleitoral (TSE) — Secretaria de Tecnologia da Informação / Repositório de Dados Eleitorais.
* **Período de Referência:** Eleições Gerais 2026.
* **Licença de Dados:** Domínio público / Dados abertos governamentais sob as diretrizes da Lei de Acesso à Informação (Lei nº 12.527/2011).
