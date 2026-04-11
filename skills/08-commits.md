# Skill: Commits y Reportes

## Formato
tipo: descripción corta en español (max 72 chars)
tipos: feat | fix | refactor | style | chore

## Ejemplos
feat: panel gestión de datos con eliminar por mes
fix: parser Excel lee todas las hojas no solo la primera
fix: parseFecha soporta formato DD/MM/YYYY Colombia
feat: banner evaluaciones inválidas con botón eliminar

## Checklist ANTES de commitear
- [ ] npm run build — zero errores
- [ ] Zero TypeScript errors
- [ ] Zero any en código nuevo
- [ ] Estados loading/error/empty/data implementados
- [ ] Eliminaciones con modal de confirmación
- [ ] Refetch después de mutaciones

## Reportar cambios (formato corto)
✅ Commit: "fix: parser lee todas las hojas"
- excelProcessor.ts: loop sobre todas las hojas
- parseFecha(): soporta DD/MM/YYYY, ISO, serial, Date
- build: ✅ sin errores

## Reglas
- Un commit por bloque de trabajo
- No commitear work-in-progress
- Si build falla → fix primero, commit después