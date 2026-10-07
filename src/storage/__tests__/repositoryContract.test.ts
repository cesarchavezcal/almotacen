import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTestDatabase } from '../testDatabase';
import { SQLiteLedgerRepository } from '../ledgerRepository';
import { DatabaseAdapter, LedgerRepository } from '../types';
import { Account, Category } from '../../domain/ledger/types';

describe('Unified LedgerRepository Contract (Ticket 03 / SCEN-020)', () => {
  let db: DatabaseAdapter;
  let repo: LedgerRepository;

  beforeEach(() => {
    db = createTestDatabase();
    repo = new SQLiteLedgerRepository(db);
  });

  afterEach(() => {
    db.closeSync?.();
  });

  it('SCEN-020: executes core transaction workflows through unified LedgerRepository', () => {
    const state = repo.getBudgetState();
    expect(state).toBeDefined();

    const checkingAccount = Object.values(state.accounts).find((a: Account) => a.accountType === 'checking');
    expect(checkingAccount).toBeDefined();

    const category = Object.values(state.categories)[0] as Category;
    expect(category).toBeDefined();

    const initialRta = state.readyToAssignCents;

    // Allocate envelope
    const allocResult = repo.allocateEnvelope({
      categoryId: category.id,
      amountCents: 10000,
    });
    expect(allocResult.isOverAssigned).toBe(false);

    // Post outflow
    const outflowResult = repo.postOutflow({
      id: 'tx-port-outflow',
      accountId: checkingAccount!.id,
      categoryId: category.id,
      amountCents: 5000,
      payee: 'Coffee Roasters',
    });
    expect(outflowResult.transaction.amountCents).toBe(5000);
    expect(outflowResult.transaction.payee).toBe('Coffee Roasters');

    const updatedState = repo.getBudgetState();
    expect(updatedState.readyToAssignCents).toBe(initialRta - 10000);
  });

  it('SCEN-020: executes entity catalog mutations through unified LedgerRepository', () => {
    const newGroup = repo.createCategoryGroup({ name: 'Subscriptions' });
    expect(newGroup.id).toBeDefined();
    expect(newGroup.name).toBe('Subscriptions');

    const newCat = repo.createCategory({
      groupId: newGroup.id,
      name: 'Streaming',
      targetCents: 2000,
    });
    expect(newCat.groupId).toBe(newGroup.id);
    expect(newCat.name).toBe('Streaming');

    const newAccount = repo.createAccount({
      name: 'High Yield Savings',
      accountType: 'savings',
      balanceCents: 500000,
    });
    expect(newAccount.name).toBe('High Yield Savings');
    expect(newAccount.balanceCents).toBe(500000);
  });

  it('SCEN-020: executes admin lifecycle operations through unified LedgerRepository', () => {
    const diagnostics = repo.getDiagnostics();
    expect(diagnostics.schemaVersion).toBeGreaterThan(0);
    expect(diagnostics.accountCount).toBeGreaterThan(0);

    repo.factoryReset();
    const postResetDiag = repo.getDiagnostics();
    expect(postResetDiag.accountCount).toBe(0);
    expect(postResetDiag.transactionCount).toBe(0);

    repo.seedDemoData();
    const postSeedDiag = repo.getDiagnostics();
    expect(postSeedDiag.accountCount).toBeGreaterThan(0);
  });
});
