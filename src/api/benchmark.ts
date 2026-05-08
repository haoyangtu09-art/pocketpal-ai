import {BenchmarkResult, DeviceInfo} from '../utils/types';

export async function submitBenchmark(
  _deviceInfo: DeviceInfo,
  _benchmarkResult: BenchmarkResult,
): Promise<{message: string; id: number}> {
  throw new Error('Benchmark submission is not available in this build.');
}
