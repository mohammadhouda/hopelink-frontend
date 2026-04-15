export interface Stats {
  volunteers: number;
  charities: number;
  opportunities: number;
}

export function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K+`;
  return `${n}+`;
}
