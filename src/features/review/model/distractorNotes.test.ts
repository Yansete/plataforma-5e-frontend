import { describe, expect, it } from 'vitest';
import { distractorNotes } from './distractorNotes';
import type { ItemOption } from '@/shared/types/domain';

const option = (overrides: Partial<ItemOption> = {}): ItemOption => ({
  id: 'o1',
  text: 'UDP',
  isCorrect: false,
  feedback: 'No confirma la entrega.',
  sourceFragmentIds: [],
  decision: 'pendiente',
  discardReason: null,
  edited: false,
  ...overrides,
});

describe('distractorNotes (HU-019)', () => {
  it('muestra el error conceptual de cada distractor', () => {
    expect(distractorNotes(option({ misconception: 'Cree que ser rápido implica ser confiable.' }))).toEqual([
      { kind: 'misconception', label: 'Error conceptual', text: 'Cree que ser rápido implica ser confiable.' },
    ]);
  });

  it('explica por qué un distractor llegó descartado: el material lo muestra como correcto', () => {
    const notes = distractorNotes(
      option({
        decision: 'descartado',
        discardReason: 'tambien_correcto',
        misconception: 'Confunde los protocolos.',
        reliabilityWarning: 'El material también lo presenta como respuesta: «TCP y SCTP…».',
      }),
    );
    expect(notes.map((n) => n.kind)).toEqual(['misconception', 'reliability']);
    expect(notes[1]).toMatchObject({ label: 'Descartado al generar', text: expect.stringContaining('TCP y SCTP') });
  });

  it('no agrega notas a la respuesta correcta ni a recursos guardados antes de HU-019', () => {
    expect(distractorNotes(option({ isCorrect: true, misconception: 'x' }))).toEqual([]);
    expect(distractorNotes(option())).toEqual([]);
    expect(distractorNotes(option({ misconception: '   ', reliabilityWarning: null }))).toEqual([]);
  });
});
