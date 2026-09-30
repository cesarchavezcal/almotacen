import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Database Optimization, RLS InitPlan & Realtime DDL Migration (SCEN-012, SCEN-013)', () => {
  const migrationPath = path.resolve(
    __dirname,
    '../../../../supabase/migrations/20260930_optimize_rls_and_realtime.sql'
  );

  it('migration file exists on disk', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  describe('SCEN-013: Foreign Key Indexing & Cascade Deletes', () => {
    it('creates index on categories(credit_account_id) to eliminate table scans on card deletion', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      expect(sql).toMatch(
        /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_categories_credit_account\s+ON\s+categories\s*\(\s*credit_account_id\s*\)/i
      );
    });

    it('creates index on transactions(transfer_account_id) to optimize account transfers and cascade cleanup', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      expect(sql).toMatch(
        /CREATE\s+INDEX\s+IF\s+NOT\s+EXISTS\s+idx_transactions_transfer_account\s+ON\s+transactions\s*\(\s*transfer_account_id\s*\)/i
      );
    });
  });

  describe('SCEN-012: InitPlan RLS Performance & Least Privilege Role Access', () => {
    const tables = ['metadata', 'accounts', 'category_groups', 'categories', 'transactions'];

    tables.forEach((table) => {
      describe(`Table: ${table}`, () => {
        it(`drops legacy bare policies on ${table}`, () => {
          const sql = fs.readFileSync(migrationPath, 'utf8');
          expect(sql).toMatch(
            new RegExp(`DROP\\s+POLICY\\s+IF\\s+EXISTS\\s+"Users can only read own ${table}"\\s+ON\\s+${table}`, 'i')
          );
          expect(sql).toMatch(
            new RegExp(`DROP\\s+POLICY\\s+IF\\s+EXISTS\\s+"Users can only insert own ${table}"\\s+ON\\s+${table}`, 'i')
          );
          expect(sql).toMatch(
            new RegExp(`DROP\\s+POLICY\\s+IF\\s+EXISTS\\s+"Users can only update own ${table}"\\s+ON\\s+${table}`, 'i')
          );
          expect(sql).toMatch(
            new RegExp(`DROP\\s+POLICY\\s+IF\\s+EXISTS\\s+"Users can only delete own ${table}"\\s+ON\\s+${table}`, 'i')
          );
        });

        it(`recreates SELECT policy on ${table} with TO authenticated and cached (select auth.uid()) InitPlan`, () => {
          const sql = fs.readFileSync(migrationPath, 'utf8');
          const selectRegex = new RegExp(
            `CREATE\\s+POLICY\\s+"Users can only read own ${table}"\\s+ON\\s+${table}\\s+FOR\\s+SELECT\\s+TO\\s+authenticated\\s+USING\\s*\\(\\s*\\(\\s*select\\s+auth\\.uid\\(\\)\\s*\\)\\s*=\\s*user_id\\s*\\)`,
            'i'
          );
          expect(sql).toMatch(selectRegex);
        });

        it(`recreates INSERT policy on ${table} with TO authenticated and (select auth.uid()) InitPlan`, () => {
          const sql = fs.readFileSync(migrationPath, 'utf8');
          const insertRegex = new RegExp(
            `CREATE\\s+POLICY\\s+"Users can only insert own ${table}"\\s+ON\\s+${table}\\s+FOR\\s+INSERT\\s+TO\\s+authenticated\\s+WITH\\s+CHECK\\s*\\(\\s*\\(\\s*select\\s+auth\\.uid\\(\\)\\s*\\)\\s*=\\s*user_id\\s*\\)`,
            'i'
          );
          expect(sql).toMatch(insertRegex);
        });

        it(`recreates UPDATE policy on ${table} with TO authenticated and (select auth.uid()) InitPlan on USING and WITH CHECK`, () => {
          const sql = fs.readFileSync(migrationPath, 'utf8');
          const updateRegex = new RegExp(
            `CREATE\\s+POLICY\\s+"Users can only update own ${table}"\\s+ON\\s+${table}\\s+FOR\\s+UPDATE\\s+TO\\s+authenticated\\s+USING\\s*\\(\\s*\\(\\s*select\\s+auth\\.uid\\(\\)\\s*\\)\\s*=\\s*user_id\\s*\\)\\s+WITH\\s+CHECK\\s*\\(\\s*\\(\\s*select\\s+auth\\.uid\\(\\)\\s*\\)\\s*=\\s*user_id\\s*\\)`,
            'i'
          );
          expect(sql).toMatch(updateRegex);
        });

        it(`recreates DELETE policy on ${table} with TO authenticated and (select auth.uid()) InitPlan`, () => {
          const sql = fs.readFileSync(migrationPath, 'utf8');
          const deleteRegex = new RegExp(
            `CREATE\\s+POLICY\\s+"Users can only delete own ${table}"\\s+ON\\s+${table}\\s+FOR\\s+DELETE\\s+TO\\s+authenticated\\s+USING\\s*\\(\\s*\\(\\s*select\\s+auth\\.uid\\(\\)\\s*\\)\\s*=\\s*user_id\\s*\\)`,
            'i'
          );
          expect(sql).toMatch(deleteRegex);
        });
      });
    });

    it('contains zero bare "auth.uid() = user_id" policy expressions without select wrapper', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      // Look for any policy check that has auth.uid() = user_id NOT preceded by select
      const bareAuthRegex = /USING\s*\(\s*auth\.uid\(\)\s*=\s*user_id/i;
      expect(sql).not.toMatch(bareAuthRegex);
    });
  });

  describe('Realtime DDL: Publication Enrollment', () => {
    it('idempotently registers all 5 ledger tables in supabase_realtime publication', () => {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      expect(sql).toContain('supabase_realtime');
      expect(sql).toMatch(/accounts/i);
      expect(sql).toMatch(/category_groups/i);
      expect(sql).toMatch(/categories/i);
      expect(sql).toMatch(/transactions/i);
      expect(sql).toMatch(/metadata/i);
      expect(sql).toMatch(/ALTER\s+PUBLICATION\s+supabase_realtime\s+ADD\s+TABLE/i);
    });
  });
});
