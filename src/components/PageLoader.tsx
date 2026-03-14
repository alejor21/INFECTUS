export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-gray-900">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
    </div>
  );
}
