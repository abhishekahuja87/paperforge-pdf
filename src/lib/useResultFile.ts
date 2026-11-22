import { useCallback, useEffect, useState } from 'react';

interface ResultFile {
  url: string;
  name: string;
  /** Fingerprint of the settings the file was made with; see `isOutdated`. */
  key: string;
  /** A short line shown under the file name, for example a count. */
  detail?: string;
}

/** A finished file kept as an object URL until it is replaced or the page is left, so the Save banner can offer it. */
export function useResultFile() {
  const [result, setResult] = useState<ResultFile | null>(null);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);
  const set = useCallback((blob: Blob, name: string, options: { key?: string; detail?: string } = {}) => {
    setResult({ url: URL.createObjectURL(blob), name, key: options.key ?? '', detail: options.detail });
  }, []);
  const clear = useCallback(() => setResult(null), []);
  /** True when the settings now differ from the ones the file was made with. */
  const isOutdated = (currentKey: string) => result !== null && result.key !== currentKey;
  return { result, set, clear, isOutdated };
}
