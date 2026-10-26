/**
 * Fractional ordering helpers for Kanban columns and cards.
 * Items hold a float `position`.
 * Inserting between two items sets position to the midpoint, requiring only
 * an O(1) single-document write with no sibling re-indexing.
 */

export const POSITION_STEP = 1000;

export function appendPosition(maxPosition) {
  if (maxPosition === null || maxPosition === undefined) return POSITION_STEP;
  return maxPosition + POSITION_STEP;
}

export function between(before, after) {
  if (before == null && after == null) return POSITION_STEP;
  if (before == null) return after - POSITION_STEP;
  if (after == null) return before + POSITION_STEP;
  return (before + after) / 2;
}
