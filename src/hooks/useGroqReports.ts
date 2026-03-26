import { useState } from 'react';
import { askGroq } from '../lib/groq/groqClient';
import type { InterventionRecord } from '../types';

interface AnalyticsSnapshot {
  hospital: string;
  period: string;
  totalRecords: number;
  therapeuticAdequacy: number;
  guidelineCompliance: number;
  antibioticUseRate: number;
  iaasRate: number;
  top5Antibiotics: { name: string; count: number }[];
  topServices: string[];
  mrsaRate: number;
  bleeRate: number;
  carbapenemaseRate: number;
  records: InterventionRecord[];
}

const SYSTEM_PROMPT = `Eres un experto en programas PROA (Programa de Optimización del Uso de Antimicrobianos) y control de infecciones hospitalarias.
Respondes siempre en español, de forma clara, profesional y concisa.
Cuando generes reportes, usa formato estructurado con secciones.
Basa tus respuestas únicamente en los datos que te proporcionen, no inventes cifras.`;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function useGroqReports(snapshot: AnalyticsSnapshot) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildContext = () => `
Hospital: ${snapshot.hospital || 'Todos los hospitales'}
Período: ${snapshot.period}
Total intervenciones: ${snapshot.totalRecords}
Adecuación terapéutica: ${snapshot.therapeuticAdequacy.toFixed(1)}%
Cumplimiento de guías: ${snapshot.guidelineCompliance.toFixed(1)}%
Días promedio de terapia: ${snapshot.antibioticUseRate.toFixed(1)} días
Tasa IAAS: ${snapshot.iaasRate.toFixed(1)}%
Top antibióticos: ${snapshot.top5Antibiotics.map((item) => `${item.name}(${item.count})`).join(', ')}
MRSA: ${snapshot.mrsaRate.toFixed(1)}%
BLEE: ${snapshot.bleeRate.toFixed(1)}%
Carbapenemasa: ${snapshot.carbapenemaseRate.toFixed(1)}%
Servicios activos: ${snapshot.topServices.join(', ')}
`;

  const generateExecutiveReport = async (): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      return await askGroq(
        SYSTEM_PROMPT,
        `Genera un informe ejecutivo PROA completo basado en estos datos:\n${buildContext()}\n\nEl informe debe incluir: 1) Resumen ejecutivo, 2) Hallazgos principales, 3) Alertas y puntos críticos, 4) Recomendaciones prioritarias, 5) Conclusión.`,
      );
    } catch (errorValue: unknown) {
      setError(getErrorMessage(errorValue));
      return '';
    } finally {
      setLoading(false);
    }
  };

  const generateAlerts = async (): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      return await askGroq(
        SYSTEM_PROMPT,
        `Analiza estos datos PROA y genera SOLO las alertas epidemiológicas y clínicas que requieren atención inmediata:\n${buildContext()}\n\nFormato: lista de alertas con nivel de prioridad (ALTA/MEDIA/BAJA) y acción recomendada.`,
      );
    } catch (errorValue: unknown) {
      setError(getErrorMessage(errorValue));
      return '';
    } finally {
      setLoading(false);
    }
  };

  const chat = async (userQuestion: string): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      return await askGroq(
        SYSTEM_PROMPT,
        `Contexto de datos actuales:\n${buildContext()}\n\nPregunta del médico: ${userQuestion}`,
      );
    } catch (errorValue: unknown) {
      setError(getErrorMessage(errorValue));
      return '';
    } finally {
      setLoading(false);
    }
  };

  return { generateExecutiveReport, generateAlerts, chat, loading, error };
}
