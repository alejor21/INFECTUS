# Skill: Analíticas PROA

## KPIs principales
| KPI | Cómo calcular |
|-----|--------------|
| Total evaluaciones | count(rows) |
| % Aprobadas | count(se_aprobo='SI') / total * 100 |
| % Cultivos previos | count(cultivos_previos='SI') / total * 100 |
| % Empírica apropiada | count(terapia_empirica='SI') / total * 100 |
| % BLEE | count(blee='SI') / total_cultivos * 100 |
| % Carbapenemasa | count(carbapenemasa='SI') / total_cultivos * 100 |

## Tipos de intervención
IC → Interconsulta | PROA → Captadas PROA | REV → Revaloración

## Gráficas estándar del comité
1. Tipo de Intervenciones → pie (IC / PROA / REV)
2. Intervenciones por Servicio → pie o bar
3. Conducta Terapéutica → bar (Desescalona, Mantiene, Escalona...)
4. Antibióticos más usados → bar horizontal top 8

## Filtros de tiempo
1M | 6M | 12M | Todo → filtran evaluaciones por rango de mes/anio

## Comparativa entre meses
- Selector de 2 meses independientes
- Delta (↑↓) de cada KPI entre mes A y B
- Verde si mejora, rojo si empeora

## Selector de mes
label: "Enero 2025 (15)"  value: "2025-01"  