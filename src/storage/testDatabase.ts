import { DatabaseAdapter } from './types';
import { initializeDatabase } from './schema';

export function createTestDatabase(): DatabaseAdapter {
  if (typeof (globalThis as any).Bun !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Database } = require('bun:sqlite');
    const bunDb = new Database(':memory:');
    const adapter: DatabaseAdapter = {
      execSync: (sql: string) => {
        bunDb.exec(sql);
      },
      runSync: (sql: string, ...params: any[]) => {
        const stmt = bunDb.prepare(sql);
        const res = stmt.run(...params);
        return {
          changes: Number(res.changes ?? 0),
          lastInsertRowId: Number(res.lastInsertRowid ?? 0),
        };
      },
      getAllSync: <T = any>(sql: string, ...params: any[]): T[] => {
        const stmt = bunDb.prepare(sql);
        return stmt.all(...params) as T[];
      },
      getFirstSync: <T = any>(sql: string, ...params: any[]): T | null => {
        const stmt = bunDb.prepare(sql);
        return (stmt.get(...params) ?? null) as T | null;
      },
      withTransactionSync: <T>(task: () => T): T => {
        return bunDb.transaction(task)();
      },
      closeSync: () => {
        bunDb.close();
      },
    };
    initializeDatabase(adapter);
    return adapter;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { DatabaseSync } = require('node:sqlite');
  const nodeDb = new DatabaseSync(':memory:');
  const adapter: DatabaseAdapter = {
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
  initializeDatabase(adapter);
  return adapter;
}
