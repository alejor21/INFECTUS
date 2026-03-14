import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ComplianceValue } from '../data/proaItems';
import { PROA_SECTIONS, getItemKey } from '../data/proaItems';
import type { IAReport } from './evaluacionIA';

const LEVEL_LABELS: Record<string, string> = {
  avanzado: 'Avanzado (56–61 pts)',
  basico: 'Básico (31–55 pts)',
  inadecuado: 'Inadecuado (≤30 pts)',
};

function complianceLabel(val: ComplianceValue | undefined): string {
  if (val === 'SI') return 'SI';
  if (val === 'NO') return 'NO';
  if (val === 'NO_APLICA') return 'N/A';
  return '—';
}

export function generateEvaluacionPDF(params: {
  hospitalName: string;
  evaluatorName: string;
  evaluationDate: string;
  preScore: number;
  execScore: number;
  evalScore: number;
  totalScore: number;
  level: 'avanzado' | 'basico' | 'inadecuado';
  allItemValues: Record<string, ComplianceValue>;
  observations: string;
}): void {
  const {
    hospitalName,
    evaluatorName,
    evaluationDate,
    preScore,
    execScore,
    evalScore,
    totalScore,
    level,
    allItemValues,
    observations,
  } = params;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // --- HEADER ---
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Infectus — Evaluación PROA', margin, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Herramienta de Evaluación — Ministerio de Salud de Colombia', margin, 21);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, margin, 27);

  // --- HOSPITAL & META ---
  let y = 42;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(hospitalName, margin, y);

  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Evaluador: ${evaluatorName || '—'}   |   Fecha: ${evaluationDate}`, margin, y);

  // --- DIVIDER ---
  y += 6;
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // --- SECTION SCORE SUMMARY ---
  y += 10;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Puntuación', margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Sección', 'Puntaje', 'Máximo', '% Cumplimiento']],
    body: [
      [
        'Pre-implementación',
        String(preScore),
        '28',
        `${Math.round((preScore / 28) * 100)}%`,
      ],
      [
        'Ejecución del PROA',
        String(execScore),
        '21',
        `${Math.round((execScore / 21) * 100)}%`,
      ],
      [
        'Evaluación de la Ejecución',
        String(evalScore),
        '12',
        `${Math.round((evalScore / 12) * 100)}%`,
      ],
      [
        'TOTAL',
        String(totalScore),
        '61',
        `${Math.round((totalScore / 61) * 100)}%`,
      ],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [248, 247, 255] },
    rowPageBreak: 'avoid',
  });

  // --- LEVEL BADGE ---
  const tableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  y = tableY + 8;

  const levelColors: Record<string, [number, number, number]> = {
    avanzado: [22, 163, 74],
    basico: [217, 119, 6],
    inadecuado: [220, 38, 38],
  };
  const levelColor = levelColors[level] ?? [100, 100, 100];

  doc.setFillColor(...levelColor);
  doc.roundedRect(margin, y, 60, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nivel: ${LEVEL_LABELS[level]}`, margin + 3, y + 7);

  // --- OBSERVATIONS ---
  if (observations.trim()) {
    y += 18;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones', margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(observations, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  }

  // --- ITEMS DETAIL PER SECTION ---
  PROA_SECTIONS.forEach((section) => {
    if (y > 230) { doc.addPage(); y = 20; }

    y += 10;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, margin, y);
    y += 4;

    const rows: string[][] = [];
    section.categories.forEach((cat, catIdx) => {
      cat.items.forEach((item, itemIdx) => {
        const key = getItemKey(section.id, catIdx, itemIdx);
        const val = allItemValues[key];
        rows.push([cat.name, item, complianceLabel(val)]);
      });
    });

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Categoría', 'Actividad / Criterio', 'Cumple']],
      body: rows,
      styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 247, 255] },
      columnStyles: {
        0: { cellWidth: 48, fontStyle: 'bold' },
        1: { cellWidth: 100 },
        2: { cellWidth: 18, halign: 'center' },
      },
      rowPageBreak: 'avoid',
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2;
  });

  // --- FOOTER on each page ---
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `Infectus PROA © 2026 — Evaluación de Cumplimiento — Pág. ${i} de ${totalPages}`,
      pageWidth / 2,
      290,
      { align: 'center' },
    );
  }

  const fileName = `evaluacion-proa-${hospitalName.toLowerCase().replace(/\s+/g, '-')}-${evaluationDate}.pdf`;
  doc.save(fileName);
}

// ─── PARTIAL EXPORT ─────────────────────────────────────────────────────────

export function exportPartialEvaluation(params: {
  hospitalName: string;
  evaluatorName: string;
  evaluationDate: string;
  preScore: number;
  execScore: number;
  evalScore: number;
  totalScore: number;
  level: 'avanzado' | 'basico' | 'inadecuado';
  allItemValues: Record<string, ComplianceValue>;
  observations: string;
  selectedSections: string[];
}): void {
  const {
    hospitalName,
    evaluatorName,
    evaluationDate,
    preScore,
    execScore,
    evalScore,
    totalScore,
    level,
    allItemValues,
    observations,
    selectedSections,
  } = params;

  const isPartial = selectedSections.length < 3;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Infectus — Evaluación PROA', margin, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Herramienta de Evaluación — Ministerio de Salud de Colombia', margin, 21);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, margin, 27);

  // Partial tag
  if (isPartial) {
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('EVALUACIÓN PARCIAL', pageWidth - margin, 14, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const sectionNames: Record<string, string> = { pre: 'Pre-impl.', exec: 'Ejecución', eval: 'Evaluación' };
    doc.text(`Secciones: ${selectedSections.map((s) => sectionNames[s] ?? s).join(', ')}`, pageWidth - margin, 20, { align: 'right' });
  }

  // Hospital meta
  let y = 42;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(hospitalName, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Evaluador: ${evaluatorName || '—'}   |   Fecha: ${evaluationDate}`, margin, y);
  y += 6;
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // Score table — only selected sections
  y += 10;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Puntuación', margin, y);
  y += 4;

  const sectionRows: string[][] = [];
  const SECTION_META: Record<string, { label: string; score: number; max: number }> = {
    pre: { label: 'Pre-implementación', score: preScore, max: 28 },
    exec: { label: 'Ejecución del PROA', score: execScore, max: 21 },
    eval: { label: 'Evaluación de la Ejecución', score: evalScore, max: 12 },
  };
  selectedSections.forEach((sid) => {
    const m = SECTION_META[sid];
    if (m) sectionRows.push([m.label, String(m.score), String(m.max), `${Math.round((m.score / m.max) * 100)}%`]);
  });
  if (isPartial) {
    const partialTotal = selectedSections.reduce((s, sid) => s + (SECTION_META[sid]?.score ?? 0), 0);
    const partialMax = selectedSections.reduce((s, sid) => s + (SECTION_META[sid]?.max ?? 0), 0);
    sectionRows.push(['SUBTOTAL (seleccionadas)', String(partialTotal), String(partialMax), `${Math.round((partialTotal / partialMax) * 100)}%`]);
  } else {
    sectionRows.push(['TOTAL', String(totalScore), '61', `${Math.round((totalScore / 61) * 100)}%`]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Sección', 'Puntaje', 'Máximo', '% Cumplimiento']],
    body: sectionRows,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [248, 247, 255] },
    rowPageBreak: 'avoid',
  });

  const tableY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  y = tableY + 8;

  const levelColors: Record<string, [number, number, number]> = {
    avanzado: [22, 163, 74],
    basico: [217, 119, 6],
    inadecuado: [220, 38, 38],
  };
  const levelColor = levelColors[level] ?? [100, 100, 100];
  doc.setFillColor(...levelColor);
  doc.roundedRect(margin, y, 60, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nivel: ${LEVEL_LABELS[level]}`, margin + 3, y + 7);

  if (observations.trim()) {
    y += 18;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones', margin, y);
    y += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const lines = doc.splitTextToSize(observations, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  }

  // Items — only selected sections
  const sectionsToRender = PROA_SECTIONS.filter((s) => selectedSections.includes(s.id));
  sectionsToRender.forEach((section) => {
    if (y > 230) { doc.addPage(); y = 20; }
    y += 10;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, margin, y);
    y += 4;

    const rows: string[][] = [];
    section.categories.forEach((cat, catIdx) => {
      cat.items.forEach((item, itemIdx) => {
        const key = getItemKey(section.id, catIdx, itemIdx);
        rows.push([cat.name, item, complianceLabel(allItemValues[key])]);
      });
    });

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Categoría', 'Actividad / Criterio', 'Cumple']],
      body: rows,
      styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 247, 255] },
      columnStyles: {
        0: { cellWidth: 48, fontStyle: 'bold' },
        1: { cellWidth: 100 },
        2: { cellWidth: 18, halign: 'center' },
      },
      rowPageBreak: 'avoid',
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2;
  });

  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `Infectus PROA © 2026 — ${isPartial ? 'Evaluación Parcial' : 'Evaluación de Cumplimiento'} — Pág. ${i} de ${totalPages}`,
      pageWidth / 2,
      290,
      { align: 'center' },
    );
  }

  const suffix = isPartial ? 'parcial' : 'completa';
  doc.save(`evaluacion-proa-${suffix}-${hospitalName.toLowerCase().replace(/\s+/g, '-')}-${evaluationDate}.pdf`);
}

// ─── IA REPORT PDF ───────────────────────────────────────────────────────────

export function exportIAReportPDF(report: IAReport, hospitalName: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte Inteligente PROA', margin, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(hospitalName, margin, 21);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, margin, 27);

  // Risk badge
  const RISK_COLORS_PDF: Record<string, [number, number, number]> = {
    BAJO: [22, 163, 74],
    MEDIO: [217, 119, 6],
    ALTO: [220, 38, 38],
    CRITICO: [153, 0, 0],
  };
  const riskColor = RISK_COLORS_PDF[report.nivelRiesgo] ?? [100, 100, 100];
  let y = 42;
  doc.setFillColor(...riskColor);
  doc.roundedRect(margin, y, 55, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nivel de Riesgo: ${report.nivelRiesgo}`, margin + 3, y + 7);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Puntuación Global: ${report.puntuacionGlobal}/61 pts`, margin + 62, y + 7);

  y += 18;
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  // Helper to add a section heading + text block
  const addSection = (title: string, content: string | string[], isItems = false): void => {
    y += 8;
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, y);
    y += 5;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    if (typeof content === 'string') {
      const lines = doc.splitTextToSize(content, pageWidth - margin * 2);
      if (y + lines.length * 5 > 275) { doc.addPage(); y = 20; }
      doc.text(lines, margin, y);
      y += lines.length * 5;
    } else {
      content.forEach((item) => {
        const prefix = isItems ? '• ' : '✓ ';
        const lines = doc.splitTextToSize(`${prefix}${item}`, pageWidth - margin * 2 - 4);
        if (y + lines.length * 5 > 275) { doc.addPage(); y = 20; }
        doc.text(lines, margin + 2, y);
        y += lines.length * 5 + 1;
      });
    }
  };

  addSection('Resumen Ejecutivo', report.resumenEjecutivo);

  if (report.fortalezas.length > 0) {
    addSection('Fortalezas Identificadas', report.fortalezas);
  }
  if (report.areasDeOportunidad.length > 0) {
    addSection('Áreas de Oportunidad', report.areasDeOportunidad, true);
  }

  // Recomendaciones as table
  if (report.recomendaciones.length > 0) {
    y += 8;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Recomendaciones de Mejora', margin, y);
    y += 4;

    const recRows = report.recomendaciones.map((r) => [
      r.prioridad.replace('_', ' '),
      r.categoria,
      r.accion,
      r.impactoEsperado,
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Prioridad', 'Categoría', 'Acción', 'Impacto Esperado']],
      body: recRows,
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 247, 255] },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 38 },
        2: { cellWidth: 66 },
        3: { cellWidth: 42 },
      },
      rowPageBreak: 'avoid',
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 2;
  }

  addSection('Conclusión', report.conclusión);

  // Footer
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `Infectus PROA © 2026 — Reporte Inteligente — Pág. ${i} de ${totalPages}`,
      pageWidth / 2,
      290,
      { align: 'center' },
    );
  }

  doc.save(`reporte-ia-proa-${hospitalName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
}
