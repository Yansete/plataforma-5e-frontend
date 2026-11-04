/**
 * De qué parte del material sale cada elemento de una actividad: cada paso de la exploración guiada (HU-048) y cada
 * predicción del reto (HU-047) guardan los fragmentos que los respaldan (`fragmentIds`), y la evidencia del recurso
 * trae su documento y su página.
 */
import type { Evidence, Resource } from '@/shared/types/domain';

/** «apuntes.pdf, p. 2» por elemento; vacío si no cita un fragmento del recurso (por ejemplo, uno agregado al editar). */
export function itemSources(resource: Resource, items: { fragmentIds?: string[] }[]): string[] {
  const byId = new Map(resource.evidence.map((e) => [e.id, e]));
  return items.map((item) =>
    (item.fragmentIds ?? [])
      .map((id) => byId.get(id))
      .filter((e): e is Evidence => e !== undefined)
      .map((e) => [e.documentName, e.location].filter(Boolean).join(', '))
      .join('; '),
  );
}

export const stepSources = (resource: Resource) => itemSources(resource, resource.structure?.guidedSteps ?? []);
export const predictionSources = (resource: Resource) => itemSources(resource, resource.structure?.predictions ?? []);
