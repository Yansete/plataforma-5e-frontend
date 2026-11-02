/** HU-048: la exploración guiada se revisa y se edita paso a paso, y cada paso muestra de dónde sale. */
import { describe, expect, it } from 'vitest';
import { formatOf, typeInfo } from '@/features/generation/model/resourceCatalog';
import { detectType } from '@/features/generation/model/requestInterpreter';
import { addItem, listItems, setItem, structureProblem, structureSpec } from '@/features/review/model/structureFields';
import { stepSources } from '@/features/review/model/stepSources';
import { text } from '@/test/fixtures';
import type { ResourceStructure } from '@/shared/types/domain';

const step = (title: string, fragmentIds: string[] = ['f1']) => ({
  title,
  instruction: `Lee lo que dice el material sobre ${title}.`,
  question: `¿Qué aprendiste sobre ${title}?`,
  fragmentIds,
});
const structure: ResourceStructure = { guidedSteps: [step('TCP', ['f1']), step('UDP', ['f2']), step('Ambos', ['f1', 'f2'])] };
const exploration = (s: ResourceStructure = structure) => text({ type: 'exploracion_guiada', stage: 'explore', structure: s });

describe('exploración guiada (HU-048)', () => {
  it('es una actividad interactiva para explorar y se reconoce al escribir el pedido', () => {
    expect(formatOf('exploracion_guiada')).toBe('interactive');
    expect(typeInfo('exploracion_guiada').stage).toBe('explore');
    expect(detectType('Quiero una exploración guiada sobre TCP')).toBe('exploracion_guiada');
    expect(detectType('una actividad de exploración del material')).toBe('exploracion_guiada');
    expect(detectType('una guía de exploración')).toBe('guia_exploracion');
  });

  it('cada paso muestra el documento y la página de los fragmentos que cita', () => {
    expect(stepSources(exploration())).toEqual([
      'separata.pdf, p. 1',
      'Protocolo de datagramas de usuario.txt, p. 2',
      'separata.pdf, p. 1; Protocolo de datagramas de usuario.txt, p. 2',
    ]);
  });

  it('un paso sin fragmento del recurso queda sin fuente', () => {
    expect(stepSources(exploration({ guidedSteps: [step('Nuevo', []), step('Perdido', ['zz'])] }))).toEqual(['', '']);
  });

  it('se edita paso a paso, conserva las citas y exige al menos tres pasos completos', () => {
    const spec = structureSpec('exploracion_guiada')!;
    expect(spec.list?.key).toBe('guidedSteps');
    const edited = setItem(structure, spec, 0, 'question', '¿Por qué TCP confirma la entrega?');
    expect(edited.guidedSteps?.[0]).toMatchObject({ question: '¿Por qué TCP confirma la entrega?', fragmentIds: ['f1'] });
    expect(structureProblem('exploracion_guiada', edited)).toBeNull();

    const withBlank = addItem(structure, spec);
    expect(listItems(withBlank, spec)).toHaveLength(4);
    expect(structureProblem('exploracion_guiada', withBlank)).toContain('Completa o quita');
    expect(structureProblem('exploracion_guiada', { guidedSteps: structure.guidedSteps?.slice(0, 2) })).toContain('al menos 3');
  });
});
