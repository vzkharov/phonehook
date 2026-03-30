type Level = "debug" | "info" | "warn" | "error";

function line(level: Level, msg: string, extra?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...extra,
  };
  console.log(JSON.stringify(entry));
}

export const log = {
  debug: (msg: string, extra?: Record<string, unknown>) => line("debug", msg, extra),
  info: (msg: string, extra?: Record<string, unknown>) => line("info", msg, extra),
  warn: (msg: string, extra?: Record<string, unknown>) => line("warn", msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => line("error", msg, extra),
};
