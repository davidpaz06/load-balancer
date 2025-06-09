export interface ConcurrencyLatencyEntry {
  concurrent: number;
  latency: number;
}

export const calculateSafeConcurrency = (
  history: ConcurrencyLatencyEntry[],
  latencyThreshold: number,
  errorRate: number,
  errorRateThreshold: number,
): number => {
  return Math.max(
    ...history
      .filter(
        (entry) =>
          entry.latency < latencyThreshold && errorRate < errorRateThreshold,
      )
      .map((entry) => entry.concurrent),
    0,
  );
};
