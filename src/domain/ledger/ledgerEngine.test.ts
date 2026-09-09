import { describe, it, expect } from '@jest/globals';
import {
  postOutflowTransaction,
  postInflowTransaction,
  allocateEnvelope,
  postCreditCardPayment,
} from './ledgerEngine';
import { BudgetState } from './types';
import { ValidationError } from './errors';

function createInitialState(): BudgetState {
  return {
    readyToAssignCents: 0,
    accounts: {
      'acc-1': {
        id: 'acc-1',
        name: 'Checking',
        accountType: 'checking',
        balanceCents: 100000, // $1,000.00
      },
      'acc-cc': {
        id: 'acc-cc',
        name: 'Apple Card',
        accountType: 'credit',
        balanceCents: 0, // $0.00
        creditPaymentCategoryId: 'cat-cc-payment',
      },
    },
    categories: {
      'cat-1': {
        id: 'cat-1',
        groupId: 'grp-1',
        name: 'Groceries',
        targetCents: 50000,
        assignedCents: 25000,
        availableCents: 25000, // $250.00
      },
      'cat-2': {
        id: 'cat-2',
        groupId: 'grp-1',
        name: 'Dining Out',
        targetCents: 10000,
        assignedCents: 2000,
        availableCents: 2000, // $20.00
      },
      'cat-3': {
        id: 'cat-3',
        groupId: 'grp-1',
        name: 'Rent',
        targetCents: 120000,
        assignedCents: 0,
        availableCents: 0,
      },
      'cat-cc-payment': {
        id: 'cat-cc-payment',
        groupId: 'grp-payments',
        name: 'Apple Card Payment',
        targetCents: 0,
        assignedCents: 0,
        availableCents: 0,
        isCreditPayment: true,
      },
    },
    transactions: [],
    totalOutflowCents: 0,
    totalInflowCents: 0,
  };
}

describe('Dual Ledger Engine (Spec Contract SCEN-001..SCEN-006)', () => {
  it('SCEN-001: atomically updates account and category balances on outflow', () => {
    const state = createInitialState();

    const result = postOutflowTransaction({
      state,
      id: 'tx-1',
      accountId: 'acc-1',
      categoryId: 'cat-1',
      amountCents: 7500, // $75.00
      payee: 'Supermarket',
    });

    expect(result.state.accounts['acc-1'].balanceCents).toBe(92500); // $925.00
    expect(result.state.categories['cat-1'].availableCents).toBe(17500); // $175.00
    expect(result.state.totalOutflowCents).toBe(7500);
    expect(result.isOverspent).toBe(false);
    expect(result.transaction.syncStatus).toBe('pending');
  });

  it('SCEN-002: allows category overspending while flagging overspent status', () => {
    const state = createInitialState();

    const result = postOutflowTransaction({
      state,
      id: 'tx-2',
      accountId: 'acc-1',
      categoryId: 'cat-2',
      amountCents: 3500, // $35.00 on $20.00 available
      payee: 'Bistro',
    });

    expect(result.state.categories['cat-2'].availableCents).toBe(-1500); // -$15.00
    expect(result.isOverspent).toBe(true);
  });

  it('SCEN-003: rejects zero or negative outflow submissions with ValidationError', () => {
    const state = createInitialState();

    expect(() => {
      postOutflowTransaction({
        state,
        id: 'tx-3',
        accountId: 'acc-1',
        categoryId: 'cat-1',
        amountCents: 0,
        payee: 'Free Item',
      });
    }).toThrow(ValidationError);
  });

  it('SCEN-004: credits readyToAssign pool upon income inflow', () => {
    const state = createInitialState();

    const result = postInflowTransaction({
      state,
      id: 'tx-4',
      accountId: 'acc-1',
      amountCents: 200000, // $2,000.00
      payee: 'Employer Payroll',
    });

    expect(result.state.accounts['acc-1'].balanceCents).toBe(300000); // $3,000.00
    expect(result.state.readyToAssignCents).toBe(200000); // $2,000.00
    expect(result.state.totalInflowCents).toBe(200000);
  });

  it('SCEN-005: transfers funds from readyToAssign into budget envelope', () => {
    const state = {
      ...createInitialState(),
      readyToAssignCents: 200000, // $2,000.00
    };

    const result = allocateEnvelope({
      state,
      categoryId: 'cat-3',
      amountCents: 120000, // $1,200.00
    });

    expect(result.state.readyToAssignCents).toBe(80000); // $800.00 remaining
    expect(result.state.categories['cat-3'].availableCents).toBe(120000); // $1,200.00
    expect(result.isOverAssigned).toBe(false);
  });

  it('SCEN-006: warns when envelope assignments exceed readyToAssign pool', () => {
    const state = {
      ...createInitialState(),
      readyToAssignCents: 200000, // $2,000.00
    };

    const result = allocateEnvelope({
      state,
      categoryId: 'cat-3',
      amountCents: 250000, // $2,500.00 ($500 over readyToAssign)
    });

    expect(result.state.readyToAssignCents).toBe(-50000); // -$500.00
    expect(result.isOverAssigned).toBe(true);
  });

  it('SCEN-008: credit card outflow with sufficient envelope cash transfers full amount to payment reserve', () => {
    const state = createInitialState();

    const result = postOutflowTransaction({
      state,
      id: 'tx-cc-1',
      accountId: 'acc-cc',
      categoryId: 'cat-1',
      amountCents: 5000, // $50.00
      payee: 'Grocery Store',
    });

    expect(result.state.accounts['acc-cc'].balanceCents).toBe(-5000); // -$50.00
    expect(result.state.categories['cat-1'].availableCents).toBe(20000); // $200.00 remaining
    expect(result.state.categories['cat-cc-payment'].availableCents).toBe(5000); // $50.00 reserved
    expect(result.transferredToReserveCents).toBe(5000);
    expect(result.unfundedDebtCents).toBe(0);
    expect(result.isOverspent).toBe(false);
    expect(result.transaction.unfundedDebtCents).toBe(0);
    expect(result.transaction.transferredToReserveCents).toBe(5000);
  });

  it('SCEN-009: credit card outflow with partial envelope cash transfers available cash and flags unfunded debt', () => {
    const state = createInitialState();

    const result = postOutflowTransaction({
      state,
      id: 'tx-cc-2',
      accountId: 'acc-cc',
      categoryId: 'cat-2',
      amountCents: 5000, // $50.00 on $20.00 available
      payee: 'Fancy Dinner',
    });

    expect(result.state.accounts['acc-cc'].balanceCents).toBe(-5000);
    expect(result.state.categories['cat-2'].availableCents).toBe(-3000); // -$30.00
    expect(result.state.categories['cat-cc-payment'].availableCents).toBe(2000); // Only $20.00 reserved
    expect(result.transferredToReserveCents).toBe(2000);
    expect(result.unfundedDebtCents).toBe(3000); // $30.00 unfunded debt
    expect(result.state.categories['cat-2'].unfundedDebtCents).toBe(3000);
    expect(result.isOverspent).toBe(true);
    expect(result.transaction.unfundedDebtCents).toBe(3000);
  });

  it('SCEN-010: credit card outflow with zero available cash flags entire amount as unfunded credit debt', () => {
    const state = createInitialState();

    const result = postOutflowTransaction({
      state,
      id: 'tx-cc-3',
      accountId: 'acc-cc',
      categoryId: 'cat-3',
      amountCents: 4000, // $40.00 on $0.00 available
      payee: 'Emergency Repair',
    });

    expect(result.state.accounts['acc-cc'].balanceCents).toBe(-4000);
    expect(result.state.categories['cat-3'].availableCents).toBe(-4000);
    expect(result.state.categories['cat-cc-payment'].availableCents).toBe(0); // $0.00 reserved
    expect(result.transferredToReserveCents).toBe(0);
    expect(result.unfundedDebtCents).toBe(4000);
    expect(result.state.categories['cat-3'].unfundedDebtCents).toBe(4000);
    expect(result.isOverspent).toBe(true);
  });

  it('SCEN-011: credit card payment transfers cash from checking to credit account and reduces payment envelope', () => {
    const state: BudgetState = {
      ...createInitialState(),
      accounts: {
        'acc-1': {
          id: 'acc-1',
          name: 'Checking',
          accountType: 'checking',
          balanceCents: 100000, // $1,000.00
        },
        'acc-cc': {
          id: 'acc-cc',
          name: 'Apple Card',
          accountType: 'credit',
          balanceCents: -10000, // -$100.00 debt
          creditPaymentCategoryId: 'cat-cc-payment',
        },
      },
      categories: {
        ...createInitialState().categories,
        'cat-cc-payment': {
          id: 'cat-cc-payment',
          groupId: 'grp-payments',
          name: 'Apple Card Payment',
          targetCents: 0,
          assignedCents: 10000,
          availableCents: 10000, // $100.00 reserved
          isCreditPayment: true,
        },
      },
    };

    const result = postCreditCardPayment({
      state,
      id: 'tx-pay-1',
      fromAccountId: 'acc-1',
      toAccountId: 'acc-cc',
      amountCents: 10000, // $100.00
    });

    expect(result.state.accounts['acc-1'].balanceCents).toBe(90000); // $900.00
    expect(result.state.accounts['acc-cc'].balanceCents).toBe(0); // $0.00 (debt paid)
    expect(result.state.categories['cat-cc-payment'].availableCents).toBe(0); // $0.00 envelope consumed
    expect(result.transaction.direction).toBe('outflow');
    expect(result.transaction.amountCents).toBe(10000);
  });
});
