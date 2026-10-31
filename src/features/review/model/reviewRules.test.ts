import { describe, expect, it } from 'vitest';
import { citedCount, citedEvidence, countByStatus, editContent, editOption, editProblem, highlight, optionProblem, optionSource, setStatus, stageCoverage, withStatus } from '@/features/review/model/reviewRules';
import { item, text } from '@/test/fixtures';

const CLASS_STAGES = ['engage', 'explore', 'explain', 'elaborate', 'evaluate'] as const;

describe('reglas para aprobar', () => {
  it('cuenta y ordena por estado', () => {
    const list = [item({ id: 'a', createdAt: '2026-01-01' }), item({ id: 'b', createdAt: '2026-02-01' }), text({ status: 'aprobado' })];
    expect(countByStatus(list)).toEqual({ pendiente: 2, aprobado: 1, descartado: 0 });
    expect(withStatus(list, 'pendiente').map((r) => r.id)).toEqual(['b', 'a']);
  });
});

describe('cobertura de los momentos de la clase', () => {
  it('conserva los cinco momentos vacíos cuando no hay recursos', () => {
    const coverage = stageCoverage([]);
    expect(coverage).toEqual({
      groups: CLASS_STAGES.map((stage) => ({ stage, resources: [] })),
      missingStages: [...CLASS_STAGES],
      coveredCount: 0,
      totalCount: 5,
    });
  });

  it('identifica los momentos faltantes y ordena los grupos', () => {
    const evaluate = text({ id: 'evaluate', stage: 'evaluate' });
    const engage = text({ id: 'engage', stage: 'engage' });
    const explain = text({ id: 'explain', stage: 'explain' });
    const coverage = stageCoverage([evaluate, engage, explain]);
    expect(coverage).toMatchObject({ coveredCount: 3, totalCount: 5, missingStages: ['explore', 'elaborate'] });
    expect(coverage.groups).toEqual([
      { stage: 'engage', resources: [engage] },
      { stage: 'explore', resources: [] },
      { stage: 'explain', resources: [explain] },
      { stage: 'elaborate', resources: [] },
      { stage: 'evaluate', resources: [evaluate] },
    ]);
  });

  it('cuenta una etapa una sola vez aunque contenga varios recursos', () => {
    const first = text({ id: 'first', stage: 'engage' });
    const second = text({ id: 'second', stage: 'engage' });
    const coverage = stageCoverage([first, second]);
    expect(coverage.coveredCount).toBe(1);
    expect(coverage.totalCount).toBe(5);
    expect(coverage.missingStages).toEqual(['explore', 'explain', 'elaborate', 'evaluate']);
    expect(coverage.groups[0].resources).toEqual([first, second]);
  });

  it('reconoce la cobertura completa', () => {
    const resources = CLASS_STAGES.map((stage) => text({ id: stage, stage }));
    expect(stageCoverage(resources)).toMatchObject({ coveredCount: 5, totalCount: 5, missingStages: [] });
  });

  it('calcula la cobertura sobre el filtro de estado seleccionado', () => {
    const resources = [
      text({ id: 'pending', stage: 'engage', status: 'pendiente' }),
      text({ id: 'approved', stage: 'explore', status: 'aprobado' }),
      text({ id: 'discarded', stage: 'evaluate', status: 'descartado' }),
    ];
    expect(stageCoverage(withStatus(resources, 'pendiente')).missingStages).toEqual(['explore', 'explain', 'elaborate', 'evaluate']);
    expect(stageCoverage(withStatus(resources, 'aprobado')).missingStages).toEqual(['engage', 'explain', 'elaborate', 'evaluate']);
    expect(stageCoverage(withStatus(resources, 'descartado')).missingStages).toEqual(['engage', 'explore', 'explain', 'elaborate']);
  });

  it('conserva el orden y los datos de los recursos recibidos', () => {
    const resources = [text({ id: 'evaluate', stage: 'evaluate' }), text({ id: 'engage', stage: 'engage' })];
    const before = structuredClone(resources);
    stageCoverage(resources);
    expect(resources).toEqual(before);
  });
});

describe('cambios del docente', () => {
  it('editar un distractor lo acepta y marca la edición', () => {
    const r = editOption(item(), 'b', 'TCP con acuse', 'Retro b');
    expect(r.options![1]).toMatchObject({ text: 'TCP con acuse', edited: true, decision: 'aceptado' });
    const same = editOption(item(), 'b', 'TCP', 'Retro b');
    expect(same.options![1]).toMatchObject({ edited: false, decision: 'aceptado' });
    const key = editOption(item(), 'a', 'UDP', 'Nueva retro');
    expect(key.options![0]).toMatchObject({ decision: 'pendiente', edited: true });
  });

  it('editar el contenido y cambiar el estado', () => {
    expect(editContent(text(), 'Las capas del modelo', 'Primer párrafo.\n\nSegundo <párrafo>.').edited).toBe(false);
    expect(editContent(text(), 'Otro título', text().body).edited).toBe(true);
    expect(setStatus(item(), 'descartado')).toMatchObject({ status: 'descartado', discardReason: 'otro' });
    expect(setStatus(item({ status: 'descartado', discardReason: 'duplicado' }), 'pendiente')).toMatchObject({ status: 'pendiente', discardReason: null });
  });

  it('valida los textos editados', () => {
    expect(editProblem('', 'x')).toMatch(/título/);
    expect(editProblem('T', ' ')).toMatch(/vacío/);
    expect(editProblem('x'.repeat(161), 'x')).toMatch(/160/);
    expect(editProblem('T', 'x'.repeat(8001))).toMatch(/8000/);
    expect(editProblem('T', 'x')).toBeNull();
    expect(optionProblem(' ', '')).toMatch(/texto/);
    expect(optionProblem('x', 'y'.repeat(601))).toMatch(/600/);
    expect(optionProblem('x', '')).toBeNull();
  });
});

describe('evidencia', () => {
  it('relaciona cada afirmación con sus fragmentos guardados', () => {
    const r = item();
    expect(citedEvidence(r).map((c) => [c.claim, c.evidence.map((e) => e.id)])).toEqual([
      ['TCP garantiza una entrega confiable y retransmite lo que se pierde', ['f1']],
      ['UDP introduce menos retardo', ['f2']],
    ]);
    expect(citedEvidence(item({ citations: [{ claim: 'sin fuente', fragmentIds: ['x'] }] }))).toEqual([]);
    expect(optionSource(r, r.options![0])?.id).toBe('f2');
    expect(optionSource(r, r.options![3])).toBeNull();
    expect(citedCount(r)).toBe(2);
  });

  it('resalta la frase del fragmento que sostiene la afirmación', () => {
    const [before, match, after] = highlight('TCP numera los segmentos. TCP garantiza una entrega confiable porque confirma la recepción. Es más lento.', 'TCP garantiza una entrega confiable');
    expect(before).toBe('TCP numera los segmentos. ');
    expect(match).toBe('TCP garantiza una entrega confiable porque confirma la recepción.');
    expect(after).toBe(' Es más lento.');
    expect(highlight('Nada que ver aquí.', 'TCP garantiza entrega')).toEqual(['Nada que ver aquí.', '', '']);
  });
});
