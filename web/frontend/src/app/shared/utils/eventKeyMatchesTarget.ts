export function eventKeyMatchesTarget(eventKey: string, targetKeys: string[]) {
  return targetKeys.includes(eventKey);
}