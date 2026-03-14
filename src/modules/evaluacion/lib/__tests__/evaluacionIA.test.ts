import { describe, it, expect } from 'vitest';
import { generateIAReport } from '../evaluacionIA';
import { PROA_SECTIONS, getItemKey } from '../../data/proaItems';
import type { ComplianceValue } from '../../data/proaItems';

function buildAllValues(fill: ComplianceValue): Record<string, ComplianceValue> {
  const values: Record<string, ComplianceValue> = {};
  PROA_SECTIONS.forEach((section) => {
    section.categories.forEach((cat, catIdx) => {
      cat.items.forEach((_, itemIdx) => {
        values[getItemKey(section.id, catIdx, itemIdx)] = fill;
      });
    });
  });
  return values;
}

describe('generateIAReport', () => {
  it('returns BAJO risk when all items are SI', () => {
    const values = buildAllValues('SI');
    const report = generateIAReport(
      { allItemValues: values, observations: '' },
      'Hospital Test',
    );
    expect(report.nivelRiesgo).toBe('BAJO');
    expect(report.puntuacionGlobal).toBe(61);
    expect(report.recomendaciones).toHaveLength(0);
  });

  it('returns CRITICO risk when all items are NO', () => {
    const values = buildAllValues('NO');
    const report = generateIAReport(
      { allItemValues: values, observations: '' },
      'Hospital Test',
    );
    expect(report.nivelRiesgo).toBe('CRITICO');
    expect(report.puntuacionGlobal).toBe(0);
  });

  it('counts NO_APLICA as passing', () => {
    const values = buildAllValues('NO_APLICA');
    const report = generateIAReport(
      { allItemValues: values, observations: '' },
      'Hospital Test',
    );
    expect(report.nivelRiesgo).toBe('BAJO');
    expect(report.puntuacionGlobal).toBe(61);
  });

  it('includes hospital name in resumenEjecutivo', () => {
    const values = buildAllValues('SI');
    const report = generateIAReport(
      { allItemValues: values, observations: '' },
      'Hospital San Jorge',
    );
    expect(report.resumenEjecutivo).toContain('Hospital San Jorge');
  });

  it('populates fortalezas for high-performing categories', () => {
    const values = buildAllValues('SI');
    const report = generateIAReport(
      { allItemValues: values, observations: '' },
      'Hospital Test',
    );
    expect(report.fortalezas.length).toBeGreaterThan(0);
    report.fortalezas.forEach((f) => expect(f).toMatch(/100%/));
  });

  it('builds recomendaciones for low-performing categories', () => {
    const values = buildAllValues('NO');
    const report = generateIAReport(
      { allItemValues: values, observations: '' },
      'Hospital Test',
    );
    expect(report.recomendaciones.length).toBeGreaterThan(0);
    report.recomendaciones.forEach((r) => {
      expect(['INMEDIATA', 'CORTO_PLAZO', 'LARGO_PLAZO']).toContain(r.prioridad);
    });
  });

  it('returns MEDIO risk for ~70% completion', () => {
    const values = buildAllValues('SI');
    // Override ~30% of items to NO (61 * 0.3 ≈ 18 items)
    let count = 0;
    PROA_SECTIONS.forEach((section) => {
      section.categories.forEach((cat, catIdx) => {
        cat.items.forEach((_, itemIdx) => {
          if (count < 18) {
            values[getItemKey(section.id, catIdx, itemIdx)] = 'NO';
            count++;
          }
        });
      });
    });
    const report = generateIAReport(
      { allItemValues: values, observations: '' },
      'Hospital Test',
    );
    expect(['MEDIO', 'ALTO']).toContain(report.nivelRiesgo);
  });
});
