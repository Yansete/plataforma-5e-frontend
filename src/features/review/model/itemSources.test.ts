/**
 * HU-048, HU-047 y HU-050: la exploración guiada, el reto de predicción y el caso aplicado se revisan y se editan
 * elemento por elemento, y cada paso, predicción o criterio muestra de dónde sale.
 */
import { describe, expect, it } from 'vitest';
import { formatOf, typeInfo } from '@/features/generation/model/resourceCatalog';
import { detectType } from '@/features/generation/model/requestInterpreter';
import { addItem, listItems, setItem, structureProblem, structureSpec } from '@/features/review/model/structureFields';
import { criterionSources, predictionSources, stepSources } from '@/features/review/model/itemSources';
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

const prediction = (correctOption: string, otherOption: string, fragmentIds: string[] = ['f1'], extraOption = '') => ({
  question: `¿Qué protocolo crees que es ${correctOption}?`,
  correctOption,
  otherOption,
  extraOption,
  reveal: `El material dice que ${correctOption} es así.`,
  fragmentIds,
});
const predictions: ResourceStructure = {
  predictions: [prediction('TCP', 'UDP', ['f1'], 'IP'), prediction('UDP', 'TCP', ['f2']), prediction('IP', 'DNS', ['f1', 'f2'])],
};
const challenge = (s: ResourceStructure = predictions) => text({ type: 'reto_prediccion', stage: 'engage', structure: s });

describe('reto de predicción (HU-047)', () => {
  it('es una actividad interactiva para iniciar la clase y se reconoce al escribir el pedido', () => {
    expect(formatOf('reto_prediccion')).toBe('interactive');
    expect(typeInfo('reto_prediccion').stage).toBe('engage');
    expect(detectType('Quiero un reto de predicción sobre TCP')).toBe('reto_prediccion');
    expect(detectType('un reto inicial para la clase')).toBe('reto_prediccion');
    expect(detectType('una pregunta detonante')).toBe('pregunta_detonante');
  });

  it('cada predicción muestra el documento y la página de los fragmentos que cita', () => {
    expect(predictionSources(challenge())).toEqual([
      'separata.pdf, p. 1',
      'Protocolo de datagramas de usuario.txt, p. 2',
      'separata.pdf, p. 1; Protocolo de datagramas de usuario.txt, p. 2',
    ]);
    expect(predictionSources(challenge({ predictions: [prediction('TCP', 'UDP', [])] }))).toEqual(['']);
  });

  it('se edita predicción por predicción, conserva las citas y exige opciones distintas y al menos tres', () => {
    const spec = structureSpec('reto_prediccion')!;
    expect(spec.list?.key).toBe('predictions');
    const edited = setItem(predictions, spec, 0, 'reveal', 'TCP confirma la entrega con acuses de recibo.');
    expect(edited.predictions?.[0]).toMatchObject({ reveal: 'TCP confirma la entrega con acuses de recibo.', fragmentIds: ['f1'] });
    expect(structureProblem('reto_prediccion', edited)).toBeNull();

    const repeated = setItem(predictions, spec, 1, 'otherOption', 'udp');
    expect(structureProblem('reto_prediccion', repeated)).toContain('distintas');
    expect(structureProblem('reto_prediccion', addItem(predictions, spec))).toContain('Completa o quita');
    expect(structureProblem('reto_prediccion', { predictions: predictions.predictions?.slice(0, 2) })).toContain('al menos 3');
  });
});

const criterion = (text: string, fragmentIds: string[] = ['f1']) => ({ criterion: text, fragmentIds });
const appliedCase: ResourceStructure = {
  scenario: 'Un colegio transmitirá en vivo su graduación y enviará las notas a cada familia por la misma red.',
  task: 'Propón qué protocolo usar para cada servicio y justifica tu decisión.',
  criteria: [
    criterion('Justifica el uso de TCP para enviar las notas.', ['f1']),
    criterion('Explica por qué UDP conviene para la transmisión en vivo.', ['f2']),
    criterion('Compara la entrega confiable de TCP con la rapidez de UDP.', ['f1', 'f2']),
  ],
};
const applied = (s: ResourceStructure = appliedCase) => text({ type: 'caso_aplicado', stage: 'elaborate', structure: s });

describe('caso aplicado (HU-050)', () => {
  it('es una actividad interactiva para aplicar y se reconoce al escribir el pedido', () => {
    expect(formatOf('caso_aplicado')).toBe('interactive');
    expect(typeInfo('caso_aplicado').stage).toBe('elaborate');
    expect(detectType('Quiero un caso aplicado sobre TCP y UDP')).toBe('caso_aplicado');
    expect(detectType('dos casos de aplicación para la unidad')).toBe('caso_aplicado');
    expect(detectType('un caso con preguntas')).toBe('caso_indagacion');
    expect(detectType('un ejercicio para practicar')).toBe('ejercicio_aplicacion');
  });

  it('cada criterio muestra el documento y la página de los fragmentos que cita', () => {
    expect(criterionSources(applied())).toEqual([
      'separata.pdf, p. 1',
      'Protocolo de datagramas de usuario.txt, p. 2',
      'separata.pdf, p. 1; Protocolo de datagramas de usuario.txt, p. 2',
    ]);
    expect(criterionSources(applied({ ...appliedCase, criteria: [criterion('Nuevo', [])] }))).toEqual(['']);
  });

  it('se edita la situación, la consigna y cada criterio, conserva las citas y exige tres criterios distintos', () => {
    const spec = structureSpec('caso_aplicado')!;
    expect(spec.fields.map((f) => f.key)).toEqual(['scenario', 'task']);
    expect(spec.list?.key).toBe('criteria');
    const edited = setItem(appliedCase, spec, 0, 'criterion', 'Justifica con el material por qué TCP asegura las notas.');
    expect(edited.criteria?.[0]).toMatchObject({ criterion: 'Justifica con el material por qué TCP asegura las notas.', fragmentIds: ['f1'] });
    expect(structureProblem('caso_aplicado', edited)).toBeNull();

    expect(structureProblem('caso_aplicado', { ...appliedCase, task: ' ' })).toContain('Consigna');
    expect(structureProblem('caso_aplicado', { ...appliedCase, scenario: '' })).toContain('Situación nueva');
    const repeated = setItem(appliedCase, spec, 2, 'criterion', 'justifica el uso de TCP para enviar las notas.');
    expect(structureProblem('caso_aplicado', repeated)).toContain('no se pueden repetir');
    expect(structureProblem('caso_aplicado', addItem(appliedCase, spec))).toContain('Completa o quita');
    expect(structureProblem('caso_aplicado', { ...appliedCase, criteria: appliedCase.criteria?.slice(0, 2) })).toContain('al menos 3');
  });
});
