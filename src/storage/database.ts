import { DatabaseAdapter } from './types';
import { initializeDatabase } from './schema';

export class DatabaseInitializationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'DatabaseInitializationError';
  }
}

interface AtomicsWithOptionalPause {
  pause?: () => void;
}

// In modern Chrome/V8 on web, Atomics.pause causes expo-sqlite invokeWorkerSync to time out
// after only ~1.8ms (1,000,000 loops of a 1-cycle yield) before the Web Worker thread can initialize.
// Removing Atomics.pause allows invokeWorkerSync to use the 1,000,000,000 loop fallback (~2s budget).
if (typeof window !== 'undefined' && typeof Atomics !== 'undefined') {
  const atomicsWithPause = Atomics as unknown as AtomicsWithOptionalPause;
  if (typeof atomicsWithPause.pause === 'function') {
    try {
      delete atomicsWithPause.pause;
    } catch (error: unknown) {
      console.warn('[database] Unable to delete Atomics.pause on web:', error);
      atomicsWithPause.pause = undefined;
    }
  }
}

export interface NodeSqliteStatement {
  run(...params: readonly unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  all(...params: readonly unknown[]): unknown[];
  get(...params: readonly unknown[]): unknown;
}

export interface NodeSqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): NodeSqliteStatement;
  close(): void;
}

interface ExpoSqliteDatabaseSync {
  execSync(sql: string): void;
  runSync(sql: string, ...params: readonly unknown[]): { lastInsertRowId: number; changes: number };
  getAllSync<T = unknown>(sql: string, ...params: readonly unknown[]): T[];
  getFirstSync<T = unknown>(sql: string, ...params: readonly unknown[]): T | null;
  withTransactionSync<T>(task: () => T): T;
  closeSync?(): void;
}

interface ExpoSqliteModule {
  openDatabaseSync(dbName: string): ExpoSqliteDatabaseSync;
}

let _database: DatabaseAdapter | null = null;

export function createNodeSqliteAdapter(nodeDb: NodeSqliteDatabase): DatabaseAdapter {
  return {
    execSync: (sql: string): void => {
      nodeDb.exec(sql);
    },
    runSync: (sql: string, ...params: unknown[]): { lastInsertRowId: number; changes: number } => {
      const stmt = nodeDb.prepare(sql);
      const res = stmt.run(...params);
      return {
        changes: Number(res.changes ?? 0),
        lastInsertRowId: Number(res.lastInsertRowid ?? 0),
      };
    },
    getAllSync: <T = unknown>(sql: string, ...params: unknown[]): T[] => {
      const stmt = nodeDb.prepare(sql);
      return stmt.all(...params) as T[];
    },
    getFirstSync: <T = unknown>(sql: string, ...params: unknown[]): T | null => {
      const stmt = nodeDb.prepare(sql);
      const res = stmt.get(...params);
      return (res ?? null) as T | null;
    },
    withTransactionSync: <T>(task: () => T): T => {
      nodeDb.exec('BEGIN');
      try {
        const result = task();
        nodeDb.exec('COMMIT');
        return result;
      } catch (err: unknown) {
        nodeDb.exec('ROLLBACK');
        throw err;
      }
    },
    closeSync: (): void => {
      nodeDb.close();
    },
  };
}

export function getDatabase(dbName: string = 'almotacen.db'): DatabaseAdapter {
  if (_database) {
    return _database;
  }

  let lastInitializationError: unknown = null;

  // Attempt to use expo-sqlite in React Native / Expo environment
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SQLite = require('expo-sqlite') as ExpoSqliteModule | undefined;
    if (SQLite && typeof SQLite.openDatabaseSync === 'function') {
      let nativeDb: ExpoSqliteDatabaseSync | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          nativeDb = SQLite.openDatabaseSync(dbName);
          break;
        } catch (err: unknown) {
          lastInitializationError = err;
          if (err instanceof Error && typeof window !== 'undefined' && err.message.includes('timeout')) {
            continue;
          }
          throw err;
        }
      }
      if (!nativeDb && lastInitializationError) {
        throw lastInitializationError;
      }

      if (nativeDb) {
        const activeDb = nativeDb;
        _database = {
          execSync: (sql: string): void => activeDb.execSync(sql),
          runSync: (sql: string, ...params: unknown[]) => activeDb.runSync(sql, ...params),
          getAllSync: <T = unknown>(sql: string, ...params: unknown[]): T[] =>
            activeDb.getAllSync<T>(sql, ...params),
          getFirstSync: <T = unknown>(sql: string, ...params: unknown[]): T | null =>
            activeDb.getFirstSync<T>(sql, ...params),
          withTransactionSync: <T>(task: () => T): T => activeDb.withTransactionSync(task),
          closeSync: (): void => activeDb.closeSync?.(),
        };
        initializeDatabase(_database);
        return _database;
      }
    }
  } catch (expoErr: unknown) {
    console.warn('[getDatabase] expo-sqlite initialization failed:', expoErr);
    lastInitializationError = expoErr;
  }

  // Fall back to node:sqlite (unit test / Node environment)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DatabaseSync } = require('node:sqlite');
    if (typeof DatabaseSync === 'function') {
      const nodeDb = new DatabaseSync(dbName) as NodeSqliteDatabase;
      _database = createNodeSqliteAdapter(nodeDb);
      initializeDatabase(_database);
      return _database;
    }
  } catch (nodeErr: unknown) {
    console.debug('[getDatabase] node:sqlite fallback not available:', nodeErr);
    if (!lastInitializationError) {
      lastInitializationError = nodeErr;
    }
  }

  throw new DatabaseInitializationError(
    'Failed to initialize SQLite storage: neither expo-sqlite nor node:sqlite is available.',
    lastInitializationError
  );
}

export function setDatabaseInstance(db: DatabaseAdapter | null): void {
  _database = db;
}
