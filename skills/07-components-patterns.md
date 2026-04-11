# Skill: Componentes y Patrones INFECTUS

## Componentes existentes (no recrear)
DeleteConfirmModal | DataManagementPanel | ExcelUpload | Toast

## Patrón de página
export function MiPagina() {
  const { hospitalActual } = useHospital()
  const { data, loading, error, refetch } = useMiHook(hospitalActual.id)
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-text">Título</h1>
        <button onClick={refetch}>Actualizar</button>
      </div>
      {loading && <Skeleton />}
      {error && <ErrorBanner mensaje={error} />}
      {!loading && !error && <Contenido data={data} />}
    </div>
  )
}

## Banner advertencia (amarillo)
<div className="bg-warning-highlight border border-warning/30 rounded-lg p-4 flex items-center justify-between gap-4">
  <p className="text-sm text-warning font-medium">⚠️ Mensaje</p>
  <button className="bg-warning text-white text-sm px-4 py-2 rounded-lg hover:bg-warning-hover">Acción</button>
</div>

## Banner peligro (rojo)
<div className="border border-error/20 bg-error-highlight/30 rounded-lg p-4">
  <p className="text-sm font-medium text-error mb-3">⚠️ Zona de peligro</p>
  <button className="bg-error text-white px-4 py-2 rounded-lg hover:bg-error-hover">Eliminar todo</button>
</div>

## Skeleton
<div className="animate-pulse space-y-3 p-4">
  <div className="h-4 bg-surface-offset rounded w-full" />
  <div className="h-4 bg-surface-offset rounded w-2/3" />
</div>

## Empty state
<div className="flex flex-col items-center justify-center py-16 text-center">
  <p className="text-text font-medium mb-1">Sin datos</p>
  <p className="text-sm text-text-muted mb-6">{mensaje}</p>
  {accion}
</div>