export const POSITION_STEP = 1000;

export function appendPosition(items = []) {
  if (!items || items.length === 0) return POSITION_STEP;
  const max = Math.max(...items.map((i) => i.position || 0));
  return max + POSITION_STEP;
}

export function positionBetween(before, after) {
  if (before == null && after == null) return POSITION_STEP;
  if (before == null) return after - POSITION_STEP;
  if (after == null) return before + POSITION_STEP;
  return (before + after) / 2;
}
