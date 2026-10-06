import os
import json
import duckdb

# UF code to Full Name & Region mapping
UF_METADATA = {
    'AC': {'nome': 'Acre', 'regiao': 'Norte'},
    'AL': {'nome': 'Alagoas', 'regiao': 'Nordeste'},
    'AM': {'nome': 'Amazonas', 'regiao': 'Norte'},
    'AP': {'nome': 'Amapá', 'regiao': 'Norte'},
    'BA': {'nome': 'Bahia', 'regiao': 'Nordeste'},
    'CE': {'nome': 'Ceará', 'regiao': 'Nordeste'},
    'DF': {'nome': 'Distrito Federal', 'regiao': 'Centro-Oeste'},
    'ES': {'nome': 'Espírito Santo', 'regiao': 'Sudeste'},
    'GO': {'nome': 'Goiás', 'regiao': 'Centro-Oeste'},
    'MA': {'nome': 'Maranhão', 'regiao': 'Nordeste'},
    'MG': {'nome': 'Minas Gerais', 'regiao': 'Sudeste'},
    'MS': {'nome': 'Mato Grosso do Sul', 'regiao': 'Centro-Oeste'},
    'MT': {'nome': 'Mato Grosso', 'regiao': 'Centro-Oeste'},
    'PA': {'nome': 'Pará', 'regiao': 'Norte'},
    'PB': {'nome': 'Paraíba', 'regiao': 'Nordeste'},
    'PE': {'nome': 'Pernambuco', 'regiao': 'Nordeste'},
    'PI': {'nome': 'Piauí', 'regiao': 'Nordeste'},
    'PR': {'nome': 'Paraná', 'regiao': 'Sul'},
    'RJ': {'nome': 'Rio de Janeiro', 'regiao': 'Sudeste'},
    'RN': {'nome': 'Rio Grande do Norte', 'regiao': 'Nordeste'},
    'RO': {'nome': 'Rondônia', 'regiao': 'Norte'},
    'RR': {'nome': 'Roraima', 'regiao': 'Norte'},
    'RS': {'nome': 'Rio Grande do Sul', 'regiao': 'Sul'},
    'SC': {'nome': 'Santa Catarina', 'regiao': 'Sul'},
    'SE': {'nome': 'Sergipe', 'regiao': 'Nordeste'},
    'SP': {'nome': 'São Paulo', 'regiao': 'Sudeste'},
    'TO': {'nome': 'Tocantins', 'regiao': 'Norte'},
    'ZZ': {'nome': 'Exterior', 'regiao': 'Exterior'}
}

# Clean Portuguese label maps
GENERO_MAP = {
    2: 'Masculino',
    4: 'Feminino',
    0: 'Não informado'
}

ESTADO_CIVIL_MAP = {
    1: 'Solteiro(a)',
    3: 'Casado(a)',
    5: 'Viúvo(a)',
    7: 'Separado(a) judicialmente',
    9: 'Divorciado(a)',
    0: 'Não informado'
}

ESCOLARIDADE_MAP = {
    1: 'Analfabeto',
    2: 'Lê e escreve',
    3: 'Fundamental incompleto',
    4: 'Fundamental completo',
    5: 'Médio incompleto',
    6: 'Médio completo',
    7: 'Superior incompleto',
    8: 'Superior completo',
    0: 'Não informado'
}

RACA_MAP = {
    1: 'Branca',
    2: 'Preta',
    3: 'Parda',
    4: 'Indígena',
    5: 'Amarela',
    -1: 'Não informado'
}

IDENTIDADE_GENERO_MAP = {
    1: 'Cisgênero',
    2: 'Transgênero',
    3: 'Prefere não informar',
    -1: 'Não informado'
}

FAIXAS_ORDEM = [
    (1600, '16 anos', 'facultativo_jovem'),
    (1700, '17 anos', 'facultativo_jovem'),
    (1800, '18 anos', 'obrigatorio'),
    (1900, '19 anos', 'obrigatorio'),
    (2000, '20 anos', 'obrigatorio'),
    (2124, '21 a 24 anos', 'obrigatorio'),
    (2529, '25 a 29 anos', 'obrigatorio'),
    (3034, '30 a 34 anos', 'obrigatorio'),
    (3539, '35 a 39 anos', 'obrigatorio'),
    (4044, '40 a 44 anos', 'obrigatorio'),
    (4549, '45 a 49 anos', 'obrigatorio'),
    (5054, '50 a 54 anos', 'obrigatorio'),
    (5559, '55 a 59 anos', 'obrigatorio'),
    (6064, '60 a 64 anos', 'obrigatorio'),
    (6569, '65 a 69 anos', 'obrigatorio'),
    (7074, '70 a 74 anos', 'facultativo_idoso'),
    (7579, '75 a 79 anos', 'facultativo_idoso'),
    (8084, '80 a 84 anos', 'facultativo_idoso'),
    (8589, '85 a 89 anos', 'facultativo_idoso'),
    (9094, '90 a 94 anos', 'facultativo_idoso'),
    (9599, '95 a 99 anos', 'facultativo_idoso'),
    (9999, '100 anos ou mais', 'facultativo_idoso')
]

def clean_name(name):
    # Fix latin1 artifacts if any
    replacements = {
        'SO': 'SÃO',
        'BRASLIA': 'BRASÍLIA',
        'BELM': 'BELÉM',
        'GOINIA': 'GOIÂNIA',
        'SO LUS': 'SÃO LUÍS',
        'SO GONALO': 'SÃO GONÇALO',
        'MACEI': 'MACEIÓ',
        'SO BERNARDO DO CAMPO': 'SÃO BERNARDO DO CAMPO',
        'SO JOS DOS CAMPOS': 'SÃO JOSÉ DOS CAMPOS',
        'SO JOS DO RIO PRETO': 'SÃO JOSÉ DO RIO PRETO',
        'SO JOO DE MERITI': 'SÃO JOÃO DE MERITI',
        'FLORIANPOLIS': 'FLORIANÓPOLIS',
        'CUIAB': 'CUIABÁ',
        'JOO PESSOA': 'JOÃO PESSOA',
        'AMAP': 'AMAPÁ',
        'MACAP': 'MACAPÁ',
        'MARING': 'MARINGÁ',
        'JABOATO DOS GUARARAPES': 'JABOATÃO DOS GUARARAPES',
        'RIBEIRO PRETO': 'RIBEIRÃO PRETO',
        'NITERI': 'NITERÓI',
        'ANPOLIS': 'ANÁPOLIS',
        'VITRIA': 'VITÓRIA',
        'CAXIAS DO SUL': 'CAXIAS DO SUL',
        'VILA VELHA': 'VILA VELHA',
        'JOINVILLE': 'JOINVILLE',
        'LONDRINA': 'LONDRINA',
        'FEIRA DE SANTANA': 'FEIRA DE SANTANA',
        'APARECIDA DE GOINIA': 'APARECIDA DE GOIÂNIA'
    }
    for k, v in replacements.items():
        if k in name:
            name = name.replace(k, v)
    return name

def main():
    print("Connecting to DuckDB...")
    conn = duckdb.connect()
    csv_path = "dados/perfil_eleitorado_2026_BRASIL.csv" if os.path.exists("dados/perfil_eleitorado_2026_BRASIL.csv") else "perfil_eleitorado_2026_BRASIL.csv"

    # Step 1: Overall National Totals & By UF
    print("1. Querying Totals by UF and Brasil...")
    uf_totals = conn.execute(f"""
        SELECT 
            SG_UF,
            sum(QT_ELEITORES) as total_eleitores,
            sum(QT_ELEITORES_BIOMETRIA) as biometria,
            sum(QT_ELEITORES_DEFICIENCIA) as deficiencia,
            sum(QT_ELEITORES_NOME_SOCIAL) as nome_social,
            sum(CASE WHEN CD_GENERO = 4 THEN QT_ELEITORES ELSE 0 END) as fem,
            sum(CASE WHEN CD_GENERO = 2 THEN QT_ELEITORES ELSE 0 END) as masc,
            sum(CASE WHEN CD_GENERO = 0 THEN QT_ELEITORES ELSE 0 END) as outro_gen,
            sum(CASE WHEN CD_FAIXA_ETARIA IN (1600, 1700) THEN QT_ELEITORES ELSE 0 END) as jovens_facultativo,
            sum(CASE WHEN CD_FAIXA_ETARIA >= 7074 THEN QT_ELEITORES ELSE 0 END) as idosos_facultativo,
            sum(CASE WHEN CD_FAIXA_ETARIA BETWEEN 1800 AND 6569 THEN QT_ELEITORES ELSE 0 END) as obrigatorio,
            sum(CASE WHEN CD_QUILOMBOLA = 1 THEN QT_ELEITORES ELSE 0 END) as quilombolas,
            sum(CASE WHEN CD_INTERPRETE_LIBRAS = 1 THEN QT_ELEITORES ELSE 0 END) as libras,
            sum(CASE WHEN CD_IDENTIDADE_GENERO = 2 THEN QT_ELEITORES ELSE 0 END) as trans,
            count(DISTINCT CD_MUNICIPIO) as total_municipios
        FROM read_csv('{csv_path}', delim=';', header=true, encoding='latin-1')
        GROUP BY SG_UF
        ORDER BY total_eleitores DESC
    """).fetchall()

    uf_data = {}
    brasil_total = {
        'sg_uf': 'BR',
        'nome': 'Brasil',
        'regiao': 'Nacional',
        'total_eleitores': 0,
        'biometria': 0,
        'deficiencia': 0,
        'nome_social': 0,
        'fem': 0,
        'masc': 0,
        'outro_gen': 0,
        'jovens_facultativo': 0,
        'idosos_facultativo': 0,
        'obrigatorio': 0,
        'quilombolas': 0,
        'libras': 0,
        'trans': 0,
        'total_municipios': 0
    }

    for row in uf_totals:
        uf = row[0]
        meta = UF_METADATA.get(uf, {'nome': uf, 'regiao': 'Outro'})
        total = row[1]
        bio = row[2]
        defic = row[3]
        ns = row[4]
        fem = row[5]
        masc = row[6]
        outro = row[7]
        jovens = row[8]
        idosos = row[9]
        obrig = row[10]
        quilomb = row[11]
        libr = row[12]
        tr = row[13]
        mun = row[14]

        # Accumulate brasil
        brasil_total['total_eleitores'] += total
        brasil_total['biometria'] += bio
        brasil_total['deficiencia'] += defic
        brasil_total['nome_social'] += ns
        brasil_total['fem'] += fem
        brasil_total['masc'] += masc
        brasil_total['outro_gen'] += outro
        brasil_total['jovens_facultativo'] += jovens
        brasil_total['idosos_facultativo'] += idosos
        brasil_total['obrigatorio'] += obrig
        brasil_total['quilombolas'] += quilomb
        brasil_total['libras'] += libr
        brasil_total['trans'] += tr
        brasil_total['total_municipios'] += mun

        uf_data[uf] = {
            'sg_uf': uf,
            'nome': meta['nome'],
            'regiao': meta['regiao'],
            'total_eleitores': total,
            'biometria': bio,
            'pct_biometria': round(100.0 * bio / total, 2) if total else 0,
            'deficiencia': defic,
            'pct_deficiencia': round(100.0 * defic / total, 2) if total else 0,
            'nome_social': ns,
            'fem': fem,
            'pct_fem': round(100.0 * fem / total, 2) if total else 0,
            'masc': masc,
            'pct_masc': round(100.0 * masc / total, 2) if total else 0,
            'outro_gen': outro,
            'jovens_facultativo': jovens,
            'pct_jovens': round(100.0 * jovens / total, 2) if total else 0,
            'idosos_facultativo': idosos,
            'pct_idosos': round(100.0 * idosos / total, 2) if total else 0,
            'obrigatorio': obrig,
            'pct_obrigatorio': round(100.0 * obrig / total, 2) if total else 0,
            'quilombolas': quilomb,
            'libras': libr,
            'trans': tr,
            'total_municipios': mun,
            'piramide': [],
            'escolaridade': [],
            'estado_civil': [],
            'raca': [],
            'top_municipios': []
        }

    # Percentages for Brasil
    b_tot = brasil_total['total_eleitores']
    brasil_total['pct_biometria'] = round(100.0 * brasil_total['biometria'] / b_tot, 2)
    brasil_total['pct_deficiencia'] = round(100.0 * brasil_total['deficiencia'] / b_tot, 2)
    brasil_total['pct_fem'] = round(100.0 * brasil_total['fem'] / b_tot, 2)
    brasil_total['pct_masc'] = round(100.0 * brasil_total['masc'] / b_tot, 2)
    brasil_total['pct_jovens'] = round(100.0 * brasil_total['jovens_facultativo'] / b_tot, 2)
    brasil_total['pct_idosos'] = round(100.0 * brasil_total['idosos_facultativo'] / b_tot, 2)
    brasil_total['pct_obrigatorio'] = round(100.0 * brasil_total['obrigatorio'] / b_tot, 2)
    brasil_total['piramide'] = []
    brasil_total['escolaridade'] = []
    brasil_total['estado_civil'] = []
    brasil_total['raca'] = []

    for uf in uf_data:
        uf_data[uf]['pct_nacional'] = round(100.0 * uf_data[uf]['total_eleitores'] / b_tot, 2)

    # Step 2: Age Pyramid by UF and Brasil
    print("2. Querying Age Pyramid...")
    age_rows = conn.execute(f"""
        SELECT 
            SG_UF,
            CD_FAIXA_ETARIA,
            sum(CASE WHEN CD_GENERO = 4 THEN QT_ELEITORES ELSE 0 END) as fem,
            sum(CASE WHEN CD_GENERO = 2 THEN QT_ELEITORES ELSE 0 END) as masc,
            sum(QT_ELEITORES) as total
        FROM read_csv('{csv_path}', delim=';', header=true, encoding='latin-1')
        WHERE CD_FAIXA_ETARIA > 0
        GROUP BY SG_UF, CD_FAIXA_ETARIA
        ORDER BY SG_UF, CD_FAIXA_ETARIA
    """).fetchall()

    brasil_pyramid_map = {f[0]: {'faixa': f[1], 'tipo': f[2], 'fem': 0, 'masc': 0, 'total': 0} for f in FAIXAS_ORDEM}
    
    for row in age_rows:
        uf = row[0]
        cd_faixa = row[1]
        fem = row[2]
        masc = row[3]
        tot = row[4]

        if cd_faixa in brasil_pyramid_map:
            brasil_pyramid_map[cd_faixa]['fem'] += fem
            brasil_pyramid_map[cd_faixa]['masc'] += masc
            brasil_pyramid_map[cd_faixa]['total'] += tot

            # Find label
            lbl = next((f[1] for f in FAIXAS_ORDEM if f[0] == cd_faixa), str(cd_faixa))
            tipo = next((f[2] for f in FAIXAS_ORDEM if f[0] == cd_faixa), 'obrigatorio')
            if uf in uf_data:
                uf_data[uf]['piramide'].append({
                    'cd_faixa': cd_faixa,
                    'faixa': lbl,
                    'tipo': tipo,
                    'fem': fem,
                    'masc': masc,
                    'total': tot
                })

    for f in FAIXAS_ORDEM:
        cd = f[0]
        p = brasil_pyramid_map[cd]
        brasil_total['piramide'].append({
            'cd_faixa': cd,
            'faixa': p['faixa'],
            'tipo': p['tipo'],
            'fem': p['fem'],
            'masc': p['masc'],
            'total': p['total']
        })

    # Step 3: Education by UF and Brasil
    print("3. Querying Education...")
    esc_rows = conn.execute(f"""
        SELECT 
            SG_UF,
            CD_GRAU_ESCOLARIDADE,
            sum(QT_ELEITORES) as total
        FROM read_csv('{csv_path}', delim=';', header=true, encoding='latin-1')
        GROUP BY SG_UF, CD_GRAU_ESCOLARIDADE
        ORDER BY SG_UF, CD_GRAU_ESCOLARIDADE
    """).fetchall()

    brasil_esc_map = {cd: {'cd': cd, 'grau': ESCOLARIDADE_MAP.get(cd, 'Outro'), 'total': 0} for cd in ESCOLARIDADE_MAP}

    for row in esc_rows:
        uf = row[0]
        cd = row[1]
        tot = row[2]
        if cd in brasil_esc_map:
            brasil_esc_map[cd]['total'] += tot
            if uf in uf_data:
                uf_data[uf]['escolaridade'].append({
                    'cd': cd,
                    'grau': ESCOLARIDADE_MAP.get(cd, 'Outro'),
                    'total': tot
                })

    # Sort and add to brasil
    for cd in sorted(ESCOLARIDADE_MAP.keys()):
        if cd > 0: # skip 0 / not informed or put at end
            brasil_total['escolaridade'].append(brasil_esc_map[cd])
    if 0 in brasil_esc_map:
        brasil_total['escolaridade'].append(brasil_esc_map[0])

    # Step 4: Marital Status by UF and Brasil
    print("4. Querying Marital Status...")
    civil_rows = conn.execute(f"""
        SELECT 
            SG_UF,
            CD_ESTADO_CIVIL,
            sum(QT_ELEITORES) as total
        FROM read_csv('{csv_path}', delim=';', header=true, encoding='latin-1')
        GROUP BY SG_UF, CD_ESTADO_CIVIL
        ORDER BY SG_UF, CD_ESTADO_CIVIL
    """).fetchall()

    brasil_civil_map = {cd: {'cd': cd, 'estado_civil': ESTADO_CIVIL_MAP.get(cd, 'Outro'), 'total': 0} for cd in ESTADO_CIVIL_MAP}
    for row in civil_rows:
        uf = row[0]
        cd = row[1]
        tot = row[2]
        if cd in brasil_civil_map:
            brasil_civil_map[cd]['total'] += tot
            if uf in uf_data:
                uf_data[uf]['estado_civil'].append({
                    'cd': cd,
                    'estado_civil': ESTADO_CIVIL_MAP.get(cd, 'Outro'),
                    'total': tot
                })

    for cd in [1, 3, 9, 5, 7, 0]:
        if cd in brasil_civil_map:
            brasil_total['estado_civil'].append(brasil_civil_map[cd])

    # Step 5: Race/Color
    print("5. Querying Race/Color...")
    raca_rows = conn.execute(f"""
        SELECT 
            SG_UF,
            CD_RACA_COR,
            sum(QT_ELEITORES) as total
        FROM read_csv('{csv_path}', delim=';', header=true, encoding='latin-1')
        GROUP BY SG_UF, CD_RACA_COR
        ORDER BY SG_UF, CD_RACA_COR
    """).fetchall()

    brasil_raca_map = {cd: {'cd': cd, 'raca': RACA_MAP.get(cd, 'Outro'), 'total': 0} for cd in RACA_MAP}
    for row in raca_rows:
        uf = row[0]
        cd = row[1]
        tot = row[2]
        if cd in brasil_raca_map:
            brasil_raca_map[cd]['total'] += tot
            if uf in uf_data:
                uf_data[uf]['raca'].append({
                    'cd': cd,
                    'raca': RACA_MAP.get(cd, 'Outro'),
                    'total': tot
                })

    for cd in [3, 1, 2, 4, 5, -1]:
        if cd in brasil_raca_map:
            brasil_total['raca'].append(brasil_raca_map[cd])

    # Step 6: Top Municipalities (National Top 100 + State Top 5)
    print("6. Querying Municipalities...")
    mun_rows = conn.execute(f"""
        SELECT 
            SG_UF,
            CD_MUNICIPIO,
            NM_MUNICIPIO,
            sum(QT_ELEITORES) as total_eleitores,
            sum(QT_ELEITORES_BIOMETRIA) as biometria,
            sum(QT_ELEITORES_DEFICIENCIA) as deficiencia,
            sum(QT_ELEITORES_NOME_SOCIAL) as nome_social,
            sum(CASE WHEN CD_GENERO = 4 THEN QT_ELEITORES ELSE 0 END) as fem,
            sum(CASE WHEN CD_GENERO = 2 THEN QT_ELEITORES ELSE 0 END) as masc
        FROM read_csv('{csv_path}', delim=';', header=true, encoding='latin-1')
        GROUP BY SG_UF, CD_MUNICIPIO, NM_MUNICIPIO
        ORDER BY total_eleitores DESC
    """).fetchall()

    top_nacional = []
    state_mun_counts = {uf: 0 for uf in uf_data}

    for idx, row in enumerate(mun_rows):
        uf = row[0]
        cod = row[1]
        nome = clean_name(row[2])
        total = row[3]
        bio = row[4]
        defic = row[5]
        ns = row[6]
        fem = row[7]
        masc = row[8]
        regiao = UF_METADATA.get(uf, {}).get('regiao', 'Outro')

        muni_obj = {
            'ranking': len(top_nacional) + 1 if len(top_nacional) < 150 else None,
            'uf': uf,
            'regiao': regiao,
            'cod': cod,
            'nome': nome,
            'total_eleitores': total,
            'biometria': bio,
            'pct_biometria': round(100.0 * bio / total, 2) if total else 0,
            'deficiencia': defic,
            'pct_deficiencia': round(100.0 * defic / total, 2) if total else 0,
            'nome_social': ns,
            'fem': fem,
            'pct_fem': round(100.0 * fem / total, 2) if total else 0,
            'masc': masc,
            'pct_masc': round(100.0 * masc / total, 2) if total else 0
        }

        if len(top_nacional) < 150:
            top_nacional.append(muni_obj)

        if uf in uf_data and state_mun_counts[uf] < 8:
            uf_data[uf]['top_municipios'].append(muni_obj)
            state_mun_counts[uf] += 1

    # Step 7: Regional Aggregations
    print("7. Calculating Regional Aggregates...")
    regioes = {}
    for uf, d in uf_data.items():
        reg = d['regiao']
        if reg not in regioes:
            regioes[reg] = {
                'regiao': reg,
                'total_eleitores': 0,
                'biometria': 0,
                'deficiencia': 0,
                'nome_social': 0,
                'fem': 0,
                'masc': 0,
                'jovens_facultativo': 0,
                'idosos_facultativo': 0,
                'obrigatorio': 0,
                'estados': []
            }
        regioes[reg]['total_eleitores'] += d['total_eleitores']
        regioes[reg]['biometria'] += d['biometria']
        regioes[reg]['deficiencia'] += d['deficiencia']
        regioes[reg]['nome_social'] += d['nome_social']
        regioes[reg]['fem'] += d['fem']
        regioes[reg]['masc'] += d['masc']
        regioes[reg]['jovens_facultativo'] += d['jovens_facultativo']
        regioes[reg]['idosos_facultativo'] += d['idosos_facultativo']
        regioes[reg]['obrigatorio'] += d['obrigatorio']
        regioes[reg]['estados'].append(uf)

    for reg, d in regioes.items():
        d['pct_nacional'] = round(100.0 * d['total_eleitores'] / b_tot, 2)
        d['pct_biometria'] = round(100.0 * d['biometria'] / d['total_eleitores'], 2)
        d['pct_fem'] = round(100.0 * d['fem'] / d['total_eleitores'], 2)
        d['pct_masc'] = round(100.0 * d['masc'] / d['total_eleitores'], 2)
        d['pct_jovens'] = round(100.0 * d['jovens_facultativo'] / d['total_eleitores'], 2)
        d['pct_idosos'] = round(100.0 * d['idosos_facultativo'] / d['total_eleitores'], 2)

    # Step 8: Build Persona Archetypes
    print("8. Computing Archetypes...")
    def get_archetype(entity):
        # find modal age
        best_age = max(entity['piramide'], key=lambda x: x['total'])['faixa'] if entity['piramide'] else '40 a 44 anos'
        best_esc = max(entity['escolaridade'], key=lambda x: x['total'] if x['cd'] != 0 else -1)['grau'] if entity['escolaridade'] else 'Médio completo'
        best_civ = max(entity['estado_civil'], key=lambda x: x['total'] if x['cd'] != 0 else -1)['estado_civil'] if entity['estado_civil'] else 'Solteiro(a)'
        gen = 'Mulher' if entity['fem'] >= entity['masc'] else 'Homem'
        return {
            'genero': gen,
            'faixa_etaria': best_age,
            'escolaridade': best_esc,
            'estado_civil': best_civ,
            'biometria_status': 'Cadastrada' if (entity['pct_biometria'] > 75) else 'Pendente',
            'resumo': f"{gen}, {best_age}, {best_civ.lower()}, com {best_esc.lower()} e biometria {'concluída' if entity['pct_biometria'] > 75 else 'em processo'}."
        }

    brasil_total['arquetipo'] = get_archetype(brasil_total)
    for uf in uf_data:
        uf_data[uf]['arquetipo'] = get_archetype(uf_data[uf])

    # Step 9: Assemble final output
    dataset = {
        'metadata': {
            'eleicao': 2026,
            'titulo': 'Perfil do Eleitorado Brasileiro 2026',
            'fonte': 'Tribunal Superior Eleitoral (TSE) - Repositório de Dados Eleitorais',
            'data_atualizacao': 'Julho/2026',
            'linhas_processadas': 11046845,
            'total_eleitores': b_tot
        },
        'brasil': brasil_total,
        'estados': uf_data,
        'regioes': regioes,
        'top_municipios': top_nacional,
        'insights': [
            {
                'id': 'maioria-feminina',
                'tag': 'Gênero & Decisão',
                'icone': 'users',
                'titulo': 'As Mulheres são maioria',
                'destaque': '52,84%',
                'destaque_label': 'do eleitorado brasileiro (83,8 milhões)',
                'texto': 'Com 83,8 milhões de eleitoras contra 74,8 milhões de homens, o Brasil tem 9 milhões a mais de mulheres aptas a votar. A presença feminina é majoritária em todas as capitais e nas faixas etárias de maior volume populacional (30 a 69 anos), consolidando as mulheres como o fiel da balança das eleições 2026.'
            },
            {
                'id': 'tsunami-prateado',
                'tag': 'Transição Demográfica',
                'icone': 'trending-up',
                'titulo': 'Eleitores 70+ Superam Jovens em Mais de 10x',
                'destaque': '17,25M vs 1,63M',
                'destaque_label': 'Idosos 70+ superam jovens de 16-17 anos em 10,5 vezes',
                'texto': 'O voto facultativo dos idosos (70 anos ou mais) atinge expressivos 10,87% do colégio eleitoral (17,25 milhões), superando exponencialmente o voto facultativo jovem de 16 e 17 anos (1,63 milhão / 1,03%). O Brasil conta ainda com impressionantes 298.239 eleitores centenários (100 anos ou mais) cadastrados.'
            },
            {
                'id': 'concentracao-geografica',
                'tag': 'Geopolítica das Urnas',
                'icone': 'map-pin',
                'titulo': 'SP, MG e RJ Concentram 40% dos Votos',
                'destaque': '63,33M',
                'destaque_label': 'de eleitores nos 3 maiores estados do Sudeste',
                'texto': 'São Paulo (34,1M), Minas Gerais (16,4M) e Rio de Janeiro (12,9M) sozinhos somam mais de 4 em cada 10 votos de todo o território nacional. Somando-se a Bahia (11,3M), apenas 4 unidades da federação representam quase 47% do eleitorado brasileiro.'
            },
            {
                'id': 'revolucao-biometrica',
                'tag': 'Modernização & Tecnologia',
                'icone': 'fingerprint',
                'titulo': 'Quase 90% com Biometria',
                'destaque': '89,01%',
                'destaque_label': '141,3 milhões de eleitores com digitais cadastradas',
                'texto': 'O cadastramento biométrico da Justiça Eleitoral atingiu 141,3 milhões de brasileiros. Estados como Sergipe, Piauí e Ceará chegam a marcas superiores a 94% de cobertura digital, elevando a segurança, agilidade e auditoria nas seções eleitorais a patamares inéditos.'
            },
            {
                'id': 'inclusao-cidadania',
                'tag': 'Direitos & Representatividade',
                'icone': 'heart',
                'titulo': 'Inclusão Recorde - PCDs, Nome Social e Comunidades Tradicionais',
                'destaque': '1,97M',
                'destaque_label': 'eleitores com deficiência ou mobilidade reduzida cadastrados',
                'texto': 'O TSE registra 1.970.165 eleitores com deficiência ou mobilidade reduzida com seções acessíveis mapeadas, 38.472 eleitores com inclusão de nome social (crescimento marcante na comunidade trans), 188.371 eleitores quilombolas e mais de 336 mil eleitores com necessidade de intérprete de Libras.'
            },
            {
                'id': 'escolaridade-transicao',
                'tag': 'Educação & Sociedade',
                'icone': 'book-open',
                'titulo': 'Escolaridade em Alta, Mas com Gargalos Históricos Persistentes',
                'destaque': '27,90%',
                'destaque_label': 'têm Ensino Médio Completo (líder nacional com 44,3M)',
                'texto': 'O Ensino Médio Completo consolida-se como o grau mais frequente (27,9%), seguido por Superior Completo com 18,0M (11,36%). Todavia, o país ainda carrega 33,6 milhões de eleitores que não completaram o Ensino Fundamental (21,2%) e 5,5 milhões de eleitores analfabetos (3,5%).'
            }
        ]
    }

    os.makedirs("public/dados", exist_ok=True)
    os.makedirs("dados", exist_ok=True)
    os.makedirs("public/data", exist_ok=True)
    out_file = "public/dados/electorate_2026.json"
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    with open("dados/electorate_2026.json", 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    with open("public/data/electorate_2026.json", 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    size_kb = os.path.getsize(out_file) / 1024
    print(f"SUCCESS! Created {out_file} and dados/electorate_2026.json ({size_kb:.1f} KB)")

if __name__ == '__main__':
    main()
