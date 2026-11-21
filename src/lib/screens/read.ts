/** Small checks for reading saved settings back from localStorage. Anything unexpected falls back to the default. */
export const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
export const num = (value: unknown, fallback: number): number => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
export const str = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);
export const bool = (value: unknown, fallback: boolean): boolean => (typeof value === 'boolean' ? value : fallback);
export const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback);
