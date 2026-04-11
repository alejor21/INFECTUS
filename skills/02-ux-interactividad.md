# Skill: UX e Interactividad INFECTUS

## Paleta de colores (Tailwind custom)
primary     → bg-primary, text-primary
error       → bg-error, text-error
warning     → bg-warning, text-warning
success     → bg-success, text-success
surface     → bg-surface, bg-surface-offset

## Toast de feedback
toast.success('X evaluaciones eliminadas correctamente')
toast.error('No se pudo completar la acción')

## Modal de confirmación (SIEMPRE antes de DELETE)
// Simple
<DeleteConfirmModal isOpen={open} title="Eliminar Enero 2025"
  description="Se eliminarán 15 evaluaciones. No se puede deshacer."
  onConfirm={handleDelete} onClose={() => setOpen(false)} />
// Peligroso (pide escribir "ELIMINAR")
<DeleteConfirmModal isDangerous={true} ... />

## Estados obligatorios en todo componente
if (loading) return <Skeleton />
if (error)   return <ErrorBanner mensaje={error} />
if (!data.length) return <EmptyState />
return <Contenido data={data} />

## Botones
// Primario
className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
// Destructivo
className="bg-error text-white px-4 py-2 rounded-lg hover:bg-error-hover transition-colors"
// Ghost
className="border border-border px-4 py-2 rounded-lg hover:bg-surface-offset transition-colors"

## Reglas
- Spinner + disabled durante operaciones async
- Refetch automático después de insert/delete
- Nunca eliminar sin modal de confirmación