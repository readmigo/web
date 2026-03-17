type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_ICONS: Record<LogLevel, string> = {
  debug: '\ud83d\udc1b',
  info: '\u2139\ufe0f',
  warn: '\u26a0\ufe0f',
  error: '\u274c',
};

const MODULE_COLORS: Record<string, string> = {
  reader: '#4ade80',
  audiobook: '#60a5fa',
  auth: '#f472b6',
  api: '#a78bfa',
  offline: '#94a3b8',
  search: '#fbbf24',
  subscription: '#34d399',
  share: '#fb923c',
  pdf: '#e879f9',
  stripe: '#818cf8',
  app: '#9ca3af',
};

function getMinLevel(): number {
  // Server-side: use env var
  if (typeof window === 'undefined') {
    const env = process.env.LOG_LEVEL?.toLowerCase();
    if (env && env in LOG_LEVELS) return LOG_LEVELS[env as LogLevel];
    return process.env.NODE_ENV === 'production' ? LOG_LEVELS.warn : LOG_LEVELS.debug;
  }

  // Client-side: use localStorage
  try {
    const stored = localStorage.getItem('log_level')?.toLowerCase();
    if (stored && stored in LOG_LEVELS) return LOG_LEVELS[stored as LogLevel];
  } catch {
    // localStorage may be unavailable
  }
  return process.env.NODE_ENV === 'production' ? LOG_LEVELS.warn : LOG_LEVELS.debug;
}

function getEnabledModules(): Set<string> | '*' {
  // Server-side
  if (typeof window === 'undefined') {
    const env = process.env.DEBUG_MODULES;
    if (!env || env === '*') return '*';
    return new Set(env.split(',').map((m) => m.trim().toLowerCase()));
  }

  // Client-side
  try {
    const stored = localStorage.getItem('debug');
    if (!stored || stored === '*') return '*';
    return new Set(stored.split(',').map((m) => m.trim().toLowerCase()));
  } catch {
    return '*';
  }
}

function isModuleEnabled(module: string): boolean {
  const enabled = getEnabledModules();
  if (enabled === '*') return true;
  return enabled.has(module.toLowerCase());
}

function formatArgs(args: unknown[]): unknown[] {
  return args.map((arg) => {
    if (arg instanceof Error) return arg;
    if (typeof arg === 'object' && arg !== null) return arg;
    return arg;
  });
}

interface ModuleLogger {
  debug: (msg: string, ...args: unknown[]) => void;
  info: (msg: string, ...args: unknown[]) => void;
  warn: (msg: string, ...args: unknown[]) => void;
  error: (msg: string, ...args: unknown[]) => void;
}

function createModuleLogger(module: string): ModuleLogger {
  const color = MODULE_COLORS[module] || '#9ca3af';
  const tag = module.charAt(0).toUpperCase() + module.slice(1);

  const emit = (level: LogLevel, msg: string, ...args: unknown[]) => {
    if (LOG_LEVELS[level] < getMinLevel()) return;
    if (!isModuleEnabled(module)) return;

    const formatted = formatArgs(args);
    const icon = LEVEL_ICONS[level];

    if (typeof window !== 'undefined') {
      // Browser: colored console output
      const prefix = `%c[${tag}]%c ${icon} ${msg}`;
      const consoleFn = level === 'debug' ? console.debug
        : level === 'info' ? console.info
        : level === 'warn' ? console.warn
        : console.error;
      consoleFn(
        prefix,
        `color: ${color}; font-weight: bold`,
        'color: inherit',
        ...formatted,
      );
    } else {
      // Server: structured JSON
      const consoleFn = level === 'error' ? console.error
        : level === 'warn' ? console.warn
        : console.log;
      const data = formatted.length === 1 ? formatted[0]
        : formatted.length > 1 ? formatted
        : undefined;
      consoleFn(JSON.stringify({
        level,
        module,
        msg,
        ...(data !== undefined ? { data } : {}),
        ts: new Date().toISOString(),
      }));
    }
  };

  return {
    debug: (msg, ...args) => emit('debug', msg, ...args),
    info: (msg, ...args) => emit('info', msg, ...args),
    warn: (msg, ...args) => emit('warn', msg, ...args),
    error: (msg, ...args) => emit('error', msg, ...args),
  };
}

export const log = {
  reader: createModuleLogger('reader'),
  audiobook: createModuleLogger('audiobook'),
  auth: createModuleLogger('auth'),
  api: createModuleLogger('api'),
  offline: createModuleLogger('offline'),
  search: createModuleLogger('search'),
  subscription: createModuleLogger('subscription'),
  share: createModuleLogger('share'),
  pdf: createModuleLogger('pdf'),
  stripe: createModuleLogger('stripe'),
  app: createModuleLogger('app'),
};

export default log;
