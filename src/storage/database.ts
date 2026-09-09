import { DatabaseAdapter } from './types';
import { initializeDatabase } from './schema';

let _database: DatabaseAdapter | null = null;

export function createNodeSqliteAdapter(nodeDb: any): DatabaseAdapter {
  return {
    execSync: (sql: string) => {
      nodeDb.exec(sql);
    },
    runSync: (sql: string, ...params: any[]) => {
      const stmt = nodeDb.prepare(sql);
      const res = stmt.run(...params);
      return {
        changes: Number(res.changes ?? 0),
        lastInsertRowId: Number(res.lastInsertRowid ?? 0),
      };
    },
    getAllSync: <T = any>(sql: string, ...params: any[]): T[] => {
      const stmt = nodeDb.prepare(sql);
      return stmt.all(...params) as T[];
    },
    getFirstSync: <T = any>(sql: string, ...params: any[]): T | null => {
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
      } catch (err) {
        nodeDb.exec('ROLLBACK');
        throw err;
      }
    },
    closeSync: () => {
      nodeDb.close();
    },
  };
}

export function getDatabase(dbName: string = 'almotacen.db'): DatabaseAdapter {
  if (_database) {
    return _database;
  }

  // Attempt to use expo-sqlite in React Native / Expo environment
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const SQLite = require('expo-sqlite');
    if (SQLite && typeof SQLite.openDatabaseSync === 'function') {
      const nativeDb = SQLite.openDatabaseSync(dbName);
      _database = {
        execSync: (sql: string) => nativeDb.execSync(sql),
        runSync: (sql: string, ...params: any[]) => nativeDb.runSync(sql, ...params),
        getAllSync: (sql: string, ...params: any[]) => nativeDb.getAllSync(sql, ...params),
        getFirstSync: (sql: string, ...params: any[]) => nativeDb.getFirstSync(sql, ...params),
        withTransactionSync: <T>(task: () => T) => nativeDb.withTransactionSync(task),
        closeSync: () => nativeDb.closeSync?.(),
      };
      initializeDatabase(_database);
      return _database;
    }
  } catch {
    // Native SQLite not available, fall back to node:sqlite
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DatabaseSync } = require('node:sqlite');
    const nodeDb = new DatabaseSync(dbName);
    _database = createNodeSqliteAdapter(nodeDb);
    initializeDatabase(_database);
    return _database;
  } catch (error) {
    throw new Error(`Failed to initialize SQLite storage: ${(error as Error).message}`);
  }
}

export function setDatabaseInstance(db: DatabaseAdapter | null): void {
  _database = db;
}
