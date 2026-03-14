import { useNavigate } from 'react-router';
import { ClipboardCheck } from 'lucide-react';

export function EvaluacionPlaceholder() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
      <ClipboardCheck className="w-16 h-16 text-indigo-400" />
      <h1 className="text-2xl font-bold text-indigo-600">Evaluación PROA</h1>
      <p className="text-gray-400">Módulo en configuración...</p>
      <button
        onClick={() => navigate('/')}
        className="mt-4 px-6 py-2 border border-indigo-300 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors min-h-[44px]"
      >
        ← Volver al inicio
      </button>
    </div>
  );
}
