/**
 * HU-019: lo que la revisión muestra debajo de cada distractor, además de su justificación (retroalimentación):
 * el error conceptual que representa y, si la plataforma lo descartó al generarlo, la oración del material que lo
 * muestra como correcto. La respuesta correcta no lleva notas.
 */
import type { ItemOption } from '@/shared/types/domain';

export interface DistractorNote {
  kind: 'misconception' | 'reliability';
  label: string;
  text: string;
}

export function distractorNotes(option: ItemOption): DistractorNote[] {
  if (option.isCorrect) return [];
  const notes: DistractorNote[] = [];
  const misconception = option.misconception?.trim();
  if (misconception) notes.push({ kind: 'misconception', label: 'Error conceptual', text: misconception });
  const warning = option.reliabilityWarning?.trim();
  if (warning) notes.push({ kind: 'reliability', label: 'Descartado al generar', text: warning });
  return notes;
}
