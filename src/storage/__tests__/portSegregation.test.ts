import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createTestDatabase } from '../testDatabase';
import { SQLiteLedgerRepository } from '../ledgerRepository';
import { DatabaseAdapter } from '../types';
import { Account, Category } from '../../domain/ledger/types';
import { LedgerTransactionsPort } from '../ports/ledgerTransactionsPort';
import { EntityCatalogPort } from '../ports/entityCatalogPort';
import { LedgerAdminPort } from '../ports/ledgerAdminPort';

describe('Storage Port Segregation (Ticket 02 / SCEN-063)', () => {
  let db: DatabaseAdapter;
  let repo: SQLiteLedgerRepository;

  beforeEach(() => {
    db = createTestDatabase();
    repo = new SQLiteLedgerRepository(db);
  });

  afterEach(() => {
    db.closeSync?.();
  });

  it('SCEN-063: allows interaction purely through LedgerTransactionsPort', () => {
    const transactionsPort: LedgerTransactionsPort = repo;

    const state = transactionsPort.getBudgetState();
    expect(state).toBeDefined();

    const checkingAccount = Object.values(state.accounts).find((a: Account) => a.accountType === 'checking');
    expect(checkingAccount).toBeDefined();

    const category = Object.values(state.categories)[0] as Category;
    expect(category).toBeDefined();

    const initialRta = state.readyToAssignCents;

    // Allocate envelope
    const allocResult = transactionsPort.allocateEnvelope({
      categoryId: category.id,
      amountCents: 10000,
    });
    expect(allocResult.isOverAssigned).toBe(false);

    // Post outflow
    const outflowResult = transactionsPort.postOutflow({
      id: 'tx-port-outflow',
      accountId: checkingAccount!.id,
      categoryId: category.id,
      amountCents: 5000,
      payee: 'Coffee Roasters',
    });
    expect(outflowResult.transaction.amountCents).toBe(5000);
    expect(outflowResult.transaction.payee).toBe('Coffee Roasters');

    const updatedState = transactionsPort.getBudgetState();
    expect(updatedState.readyToAssignCents).toBe(initialRta - 10000);
  });

  it('SCEN-063: allows interaction purely through EntityCatalogPort', () => {
    const catalogPort: EntityCatalogPort = repo;

    const newGroup = catalogPort.createCategoryGroup({ name: 'Subscriptions' });
    expect(newGroup.id).toBeDefined();
    expect(newGroup.name).toBe('Subscriptions');

    const newCat = catalogPort.createCategory({
      groupId: newGroup.id,
      name: 'Streaming',
      targetCents: 2000,
    });
    expect(newCat.groupId).toBe(newGroup.id);
    expect(newCat.name).toBe('Streaming');

    const newAccount = catalogPort.createAccount({
      name: 'High Yield Savings',
      accountType: 'savings',
      balanceCents: 500000,
    });
    expect(newAccount.name).toBe('High Yield Savings');
    expect(newAccount.balanceCents).toBe(500000);
  });

  it('SCEN-063: allows interaction purely through LedgerAdminPort', () => {
    const adminPort: LedgerAdminPort = repo;

    const diagnostics = adminPort.getDiagnostics();
    expect(diagnostics.schemaVersion).toBeGreaterThan(0);
    expect(diagnostics.accountCount).toBeGreaterThan(0);

    adminPort.factoryReset();
    const postResetDiag = adminPort.getDiagnostics();
    expect(postResetDiag.accountCount).toBe(0);
    expect(postResetDiag.transactionCount).toBe(0);

    adminPort.seedDemoData();
    const postSeedDiag = adminPort.getDiagnostics();
    expect(postSeedDiag.accountCount).toBeGreaterThan(0);
  });
});
