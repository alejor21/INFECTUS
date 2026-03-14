// Dependencies: npm install jspdf jspdf-autotable
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { InterventionRecord } from '../../types';

export interface PDFReportData {
  hospitalName: string;
  dateRangeLabel: string;
  generatedAt: string;
  totalIntervenciones: number;
  adecuacionTerapeutica: number;
  hospitalActivo: string;
  alertasActivas: number;
  executiveReport?: string;
  alerts?: string;
  records: InterventionRecord[];
}

export function generatePDFReport(data: PDFReportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // --- HEADER ---
  doc.setFillColor(13, 148, 136);
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Infectus PROA', margin, 15);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Programa de Optimización de Antimicrobianos', margin, 23);
  doc.text(`Generado: ${data.generatedAt}`, margin, 30);

  // --- HOSPITAL INFO ---
  let y = 45;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.hospitalName, margin, y);

  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Período analizado: ${data.dateRangeLabel}`, margin, y);

  // --- DIVIDER ---
  y += 8;
  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  // --- KPI CARDS (4 boxes in a row) ---
  y += 10;

  const kpis = [
    { label: 'Total Intervenciones', value: String(data.totalIntervenciones) },
    { label: 'Hospital Activo', value: data.hospitalActivo },
    { label: 'Adecuación Terapéutica', value: `${data.adecuacionTerapeutica.toFixed(1)}%` },
    { label: 'Alertas Activas', value: String(data.alertasActivas) },
  ];

  const boxWidth = (pageWidth - margin * 2 - 9) / 4;
  kpis.forEach((kpi, i) => {
    const x = margin + i * (boxWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, boxWidth, 20, 2, 2, 'FD');

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.label, x + boxWidth / 2, y + 7, { align: 'center' });

    doc.setTextColor(13, 148, 136);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.value, x + boxWidth / 2, y + 15, { align: 'center' });
  });

  // --- EXECUTIVE REPORT SECTION ---
  y += 30;
  if (data.executiveReport) {
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Reporte Ejecutivo', margin, y);

    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const lines = doc.splitTextToSize(data.executiveReport, pageWidth - margin * 2);
    if (y + lines.length * 5 > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(lines, margin, y);
    y += lines.length * 5 + 10;
  }

  // --- ALERTS SECTION ---
  if (data.alerts) {
    if (y > 220) { doc.addPage(); y = 20; }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Análisis de Alertas', margin, y);

    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const alertLines = doc.splitTextToSize(data.alerts, pageWidth - margin * 2);
    if (y + alertLines.length * 5 > 270) { doc.addPage(); y = 20; }
    doc.text(alertLines, margin, y);
    y += alertLines.length * 5 + 10;
  }

  // --- INTERVENTIONS TABLE ---
  if (data.records.length > 0) {
    if (y > 200) { doc.addPage(); y = 20; }

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Detalle de Intervenciones', margin, y);
    y += 5;

    const tableRecords = data.records.slice(0, 100);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Fecha', 'Servicio', 'Antibiótico', 'Diagnóstico', 'Aprobó']],
      body: tableRecords.map((r) => [
        r.fecha ?? '',
        r.servicio ?? '',
        r.antibiotico01 ?? '',
        r.diagnostico ?? '',
        r.aproboTerapia ?? '',
      ]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [13, 148, 136], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 55 },
        4: { cellWidth: 18 },
      },
    });

    if (data.records.length > 100) {
      const finalY = (doc as any).lastAutoTable.finalY + 4;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`* Mostrando 100 de ${data.records.length} registros`, margin, finalY);
    }
  }

  // --- FOOTER on each page ---
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `Infectus PROA © 2026 — Página ${i} de ${totalPages}`,
      pageWidth / 2,
      290,
      { align: 'center' },
    );
    doc.text(
      'Documento confidencial — uso interno hospitalario',
      pageWidth / 2,
      294,
      { align: 'center' },
    );
  }

  const fileName = `infectus-reporte-${data.hospitalName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`;
  doc.save(fileName);
}
