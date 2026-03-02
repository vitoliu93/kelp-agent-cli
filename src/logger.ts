import { createConsola, type ConsolaInstance } from "consola";

export type Logger = Pick<ConsolaInstance, "info">;

export function createLogger(): Logger {
  return createConsola({ stdout: process.stderr as any });
}

export function truncate(value: string, maxLen: number): string {
  if (value.length <= maxLen) return value;
  return value.slice(0, maxLen) + "...";
}
