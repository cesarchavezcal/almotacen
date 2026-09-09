import { describe, it, expect, beforeEach } from '@jest/globals';
import { createTestDatabase } from './testDatabase';
import { SQLiteLedgerRepository } from './ledgerRepository';
import { DatabaseAdapter } from './types';

describe('SQLite Local-First Ledger Store (Ticket 2 / ALM-002)', () => {
  let db: DatabaseAdapter;
  let repo: SQLiteLedgerRepository;

  beforeEach(() => {
    db = createTestDatabase();
    repo = new SQLiteLedgerRepository(db);
  });

  it('initializes and seeds default accounts and envelope categories', () => {
    const state = repo.getBudgetState();
    const groups = repo.getCategoryGroups();

    // Accounts seeded
    expect(state.accounts['acc-checking']).toBeDefined();
    expect(state.accounts['acc-checking'].balanceCents).toBe(250000); // $2,500.00
    expect(state.accounts['acc-credit']).toBeDefined();
    expect(state.accounts['acc-credit'].balanceCents).toBe(0);

    // Groups & categories seeded
    expect(groups.length).toBe(4);
    expect(state.categories['cat-rent']).toBeDefined();
    expect(state.categories['cat-groceries']).toBeDefined();
    expect(state.categories['cat-cc-payment']).toBeDefined();
    expect(state.categories['cat-cc-payment'].isCreditPayment).toBe(true);
    expect(state.readyToAssignCents).toBe(50000); // $500.00
  });

  it('atomically executes outflow and persists changes across repository reload', () => {
    // 1. Post outflow of $75.00 from Groceries on Checking
    const result = repo.postOutflow({
      id: 'tx-test-1',
      accountId: 'acc-checking',
      categoryId: 'cat-groceries',
      amountCents: 7500, // $75.00
      payee: 'Whole Foods',
    });

    expect(result.transaction.amountCents).toBe(7500);
    expect(result.isOverspent).toBe(false);

    // 2. Re-instantiate repository using the same database to simulate app reload
    const reloadedRepo = new SQLiteLedgerRepository(db);
    const reloadedState = reloadedRepo.getBudgetState();

    expect(reloadedState.accounts['acc-checking'].balanceCents).toBe(242500); // $2,500 - $75 = $2,425
    expect(reloadedState.categories['cat-groceries'].availableCents).toBe(32500); // $400 - $75 = $325
    expect(reloadedState.transactions.length).toBe(1);
    expect(reloadedState.transactions[0].payee).toBe('Whole Foods');
    expect(reloadedState.totalOutflowCents).toBe(7500);
  });

  it('credit card purchase transfers category cash to payment reserve in SQLite', () => {
    // Outflow $50.00 on Apple Card for Groceries ($400 available)
    repo.postOutflow({
      id: 'tx-test-cc-1',
      accountId: 'acc-credit',
      categoryId: 'cat-groceries',
      amountCents: 5000,
      payee: 'Trader Joe',
    });

    const reloadedRepo = new SQLiteLedgerRepository(db);
    const state = reloadedRepo.getBudgetState();

    expect(state.accounts['acc-credit'].balanceCents).toBe(-5000); // -$50.00 debt
    expect(state.categories['cat-groceries'].availableCents).toBe(35000); // $400 - $50 = $350
    expect(state.categories['cat-cc-payment'].availableCents).toBe(5000); // $50 reserved
    expect(state.categories['cat-groceries'].unfundedDebtCents).toBe(0);
  });

  it('credit card purchase with deficit flags unfunded debt and reserves only available cash', () => {
    // Groceries has $400. Charge $450.
    repo.postOutflow({
      id: 'tx-test-cc-over',
      accountId: 'acc-credit',
      categoryId: 'cat-groceries',
      amountCents: 45000,
      payee: 'Bulk Store',
    });

    const state = repo.getBudgetState();
    expect(state.accounts['acc-credit'].balanceCents).toBe(-45000);
    expect(state.categories['cat-groceries'].availableCents).toBe(-5000); // -$50 overspent
    expect(state.categories['cat-cc-payment'].availableCents).toBe(40000); // Only $400 transferred
    expect(state.categories['cat-groceries'].unfundedDebtCents).toBe(5000); // $50 unfunded debt
  });

  it('inflow credits checking account and readyToAssign pool in SQLite metadata', () => {
    repo.postInflow({
      id: 'tx-inflow-1',
      accountId: 'acc-checking',
      amountCents: 300000, // $3,000.00 paycheck
      payee: 'Acme Corp',
    });

    const state = repo.getBudgetState();
    expect(state.accounts['acc-checking'].balanceCents).toBe(550000); // $2,500 + $3,000 = $5,500
    expect(state.readyToAssignCents).toBe(350000); // $500 + $3,000 = $3,500
    expect(state.totalInflowCents).toBe(300000);
  });

  it('allocating envelope updates assigned and available balances and decrements readyToAssign', () => {
    // Assign $200 from readyToAssign ($500) to Groceries ($400)
    repo.allocateEnvelope({
      categoryId: 'cat-groceries',
      amountCents: 20000,
    });

    const state = repo.getBudgetState();
    expect(state.readyToAssignCents).toBe(30000); // $500 - $200 = $300
    expect(state.categories['cat-groceries'].assignedCents).toBe(60000); // $400 + $200 = $600
    expect(state.categories['cat-groceries'].availableCents).toBe(60000);
  });

  it('credit card payment settles debt and reduces payment envelope balance', () => {
    // First, make a $50 purchase on Apple Card
    repo.postOutflow({
      id: 'tx-cc-init',
      accountId: 'acc-credit',
      categoryId: 'cat-dining',
      amountCents: 5000,
      payee: 'Coffee Roasters',
    });

    expect(repo.getBudgetState().accounts['acc-credit'].balanceCents).toBe(-5000);
    expect(repo.getBudgetState().categories['cat-cc-payment'].availableCents).toBe(5000);

    // Pay off the card from checking
    repo.postCreditCardPayment({
      id: 'tx-pay-cc',
      fromAccountId: 'acc-checking',
      toAccountId: 'acc-credit',
      amountCents: 5000,
    });

    const state = repo.getBudgetState();
    expect(state.accounts['acc-checking'].balanceCents).toBe(245000); // $2,500 - $50 = $2,450
    expect(state.accounts['acc-credit'].balanceCents).toBe(0); // $0 balance
    expect(state.categories['cat-cc-payment'].availableCents).toBe(0); // Payment envelope consumed
  });
});
