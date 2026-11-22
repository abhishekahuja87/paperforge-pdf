/** Team scoreboard logic. */
export interface Team { id: string; name: string; score: number }

export const clampScore = (value: number): number => Math.max(-99999, Math.min(99999, Math.round(value)));

/** Rank for each team, where teams with the same score share a rank (1, 2, 2, 4). Keys are team ids. */
export function ranks(teams: readonly Team[]): Record<string, number> {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const out: Record<string, number> = {};
  sorted.forEach((team, position) => {
    const before = sorted[position - 1];
    out[team.id] = before && before.score === team.score ? out[before.id]! : position + 1;
  });
  return out;
}

/** Teams in the order to show: highest score first when `sort` is on, otherwise as typed. */
export function ordered(teams: readonly Team[], sort: boolean): Team[] {
  return sort ? [...teams].sort((a, b) => b.score - a.score) : [...teams];
}

/** Names that lead the board right now, for the "leading" line. */
export function leaders(teams: readonly Team[]): string[] {
  if (teams.length === 0) return [];
  const top = Math.max(...teams.map((team) => team.score));
  return teams.filter((team) => team.score === top).map((team) => team.name);
}
