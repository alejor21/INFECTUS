# Skill: Debug Rápido

## Diagnóstico por síntoma
| Síntoma | Causa | Fix |
|---------|-------|-----|
| Solo carga 1 mes del Excel | Lee solo SheetNames[0] | Iterar todas las hojas |
| mes=0 en DB | parseFecha falla | Agregar DD/MM/YYYY al parser |
| "X evaluaciones en 0 meses" | mes/anio null en DB | Limpiar inválidos |
| Banner no aparece | Condición dentro del empty state | Mover fuera del bloque |
| query .or() no funciona | PostgREST syntax | Usar .in('id', ids) |
| build falla con 'any' | TypeScript strict | Tipar con interface |
| hook no actualiza UI | Falta refetch() | Llamar refetch() en finally() |

## Pasos de debug
1. Leer el error exacto
2. Identificar el archivo por stack trace
3. Leer SOLO ese archivo
4. Fix puntual — no tocar lo que no está roto
5. npm run build → confirmar que pasa
6. Commit descriptivo

## Nunca
- No refactorizar archivos sin el bug
- No cambiar schema de DB para arreglar frontend
- No instalar librerías para algo que ya existe