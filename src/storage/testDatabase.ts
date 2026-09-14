import { DatabaseSync, SQLInputValue } from 'node:sqlite';
import { fromAny } from '@total-typescript/shoehorn';
import { DatabaseAdapter } from './types';
import { initializeDatabase, seedDemoData } from './schema';

export interface TestDatabaseOptions {
  seed?: boolean;
}

export function createTestDatabase(options: TestDatabaseOptions = { seed: true }): DatabaseAdapter {
  const nodeDb = new DatabaseSync(':memory:');
  const adapter: DatabaseAdapter = {
    execSync: (sql: string): void => {
      nodeDb.exec(sql);
    },
    runSync: (sql: string, ...params: unknown[]): { lastInsertRowId: number; changes: number } => {
      const stmt = nodeDb.prepare(sql);
      const sqlParams = fromAny<SQLInputValue[], unknown>(params);
      const res = stmt.run(...sqlParams);
      return {
        changes: Number(res.changes ?? 0),
        lastInsertRowId: Number(res.lastInsertRowid ?? 0),
      };
    },
    getAllSync: <T = unknown>(sql: string, ...params: unknown[]): T[] => {
      const stmt = nodeDb.prepare(sql);
      const sqlParams = fromAny<SQLInputValue[], unknown>(params);
      const rows = stmt.all(...sqlParams);
      return fromAny<T[], unknown>(rows);
    },
    getFirstSync: <T = unknown>(sql: string, ...params: unknown[]): T | null => {
      const stmt = nodeDb.prepare(sql);
      const sqlParams = fromAny<SQLInputValue[], unknown>(params);
      const row = stmt.get(...sqlParams);
      return row ? fromAny<T, unknown>(row) : null;
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
    closeSync: (): void => {
      nodeDb.close();
    },
  };

  initializeDatabase(adapter);
  if (options.seed !== false) {
    seedDemoData(adapter);
  }
  return adapter;
}

export function createCleanTestDatabase(): DatabaseAdapter {
  return createTestDatabase({ seed: false });
}
