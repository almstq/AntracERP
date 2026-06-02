/**
 * Shared list comparators.
 *
 * `byName` — case-insensitive A→Z on a string field (people, sites, suppliers).
 * `byCode` — numeric-aware on an ID/code field so WL-HV-0002 sorts before
 *            WL-HV-0010 (asset registers and any asset-keyed list).
 */

export function byName<T>(get: (x: T) => string | undefined | null) {
  return (a: T, b: T) =>
    (get(a) ?? '').localeCompare(get(b) ?? '', undefined, { sensitivity: 'base' });
}

export function byCode<T>(get: (x: T) => string | undefined | null) {
  return (a: T, b: T) =>
    (get(a) ?? '').localeCompare(get(b) ?? '', undefined, { numeric: true, sensitivity: 'base' });
}
