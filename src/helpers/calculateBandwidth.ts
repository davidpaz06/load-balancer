import { formatBytes } from './formatBytes';

export const calculateBandwidth = (
  responseSizeBytes: number,
  durationMs: number,
): string => {
  const durationSeconds = durationMs / 1000;
  if (durationSeconds <= 0) return '0 B/s';
  const bytesPerSecond = responseSizeBytes / durationSeconds;
  return `${formatBytes(bytesPerSecond)}/s`;
};
