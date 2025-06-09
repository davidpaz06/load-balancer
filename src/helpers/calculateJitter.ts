export const calculateJitter = (latencies: number[]): string | number => {
  if (!latencies.length) return 0;
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const variance =
    latencies.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
    latencies.length;

  const result = `${variance.toFixed(2)}ms`;
  return result;
};
