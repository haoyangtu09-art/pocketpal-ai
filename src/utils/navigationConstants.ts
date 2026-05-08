// Navigation route names
export const ROUTES = {
  // Main app routes
  CHAT: 'Chat',
  MODELS: 'Models',
  PALS: 'Pals (experimental)',
  BENCHMARK: 'Benchmark',
  SETTINGS: 'Settings',
  APP_INFO: 'App Info',

  // Dev tools route. Only available in debug mode.
  DEV_TOOLS: 'Dev Tools',

  // E2E-only deep-link-driven matrix runner. Hidden from drawer sidebar via
  // drawerItemStyle:{display:'none'}; reachable only by the deep link
  BENCHMARK_RUNNER: 'BenchmarkRunner',
};

export const BENCHMARK_RUNNER_URL_PREFIX = 'lumo://e2e/benchmark';

export function isBenchmarkRunnerUrl(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.startsWith(BENCHMARK_RUNNER_URL_PREFIX);
}
