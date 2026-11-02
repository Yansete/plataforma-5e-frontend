/**
 * HU-048: de qué parte del material sale cada paso de la exploración guiada. Cada paso guarda los fragmentos que lo
 * respaldan (`fragmentIds`) y la evidencia del recurso trae su documento y su página.
 */
import type { Evidence, Resource } from '@/shared/types/domain';

/** «apuntes.pdf, p. 2» por paso; vacío si el paso no cita un fragmento del recurso (por ejemplo, uno agregado al editar). */
export function stepSources(resource: Resource): string[] {
  const byId = new Map(resource.evidence.map((e) => [e.id, e]));
  return (resource.structure?.guidedSteps ?? []).map((step) =>
    (step.fragmentIds ?? [])
      .map((id) => byId.get(id))
      .filter((e): e is Evidence => e !== undefined)
      .map((e) => [e.documentName, e.location].filter(Boolean).join(', '))
      .join('; '),
  );
}
