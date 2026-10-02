import { describe, it, expect } from '@jest/globals';
import { ExpenseIntake } from './expenseIntake';
import { Category, Transaction } from './types';

describe('ExpenseIntake Domain Module (Ticket 04 / SCEN-065, SCEN-066, SCEN-067)', () => {
  describe('SCEN-065: Quick Expense Live Deficit Impact Evaluation', () => {
    it('returns positive remaining balance when expense is within available funds', () => {
      const category: Category = {
        id: 'cat-groceries',
        groupId: 'grp-living',
        name: 'Groceries',
        targetCents: 50000,
        assignedCents: 50000,
        availableCents: 10000, // $100.00
      };

      const preview = ExpenseIntake.previewImpact({
        category,
        amountText: '$45.00',
      });

      expect(preview.parsedCents).toBe(4500);
      expect(preview.remainingAvailableCents).toBe(5500);
      expect(preview.isOverspent).toBe(false);
      expect(preview.warningBadge).toBeNull();
    });

    it('SCEN-065: detects overspending deficit and sets OVERSPENT warning badge', () => {
      const category: Category = {
        id: 'cat-dining',
        groupId: 'grp-living',
        name: 'Dining Out',
        targetCents: 20000,
        assignedCents: 20000,
        availableCents: 5000, // $50.00
      };

      const preview = ExpenseIntake.previewImpact({
        category,
        amountText: '$75.00',
      });

      expect(preview.parsedCents).toBe(7500);
      expect(preview.remainingAvailableCents).toBe(-2500);
      expect(preview.isOverspent).toBe(true);
      expect(preview.warningBadge).toBe('OVERSPENT');
    });

    it('handles undefined category gracefully with zero available', () => {
      const preview = ExpenseIntake.previewImpact({
        category: undefined,
        amountText: '$25.00',
      });

      expect(preview.parsedCents).toBe(2500);
      expect(preview.remainingAvailableCents).toBe(-2500);
      expect(preview.isOverspent).toBe(true);
    });
  });

  describe('SCEN-066: Quick Expense Smart Payee Resolution & Auto-Fill', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        accountId: 'acc-checking',
        categoryId: 'cat-groceries',
        payee: 'Whole Foods',
        amountCents: 4500,
        direction: 'outflow',
        occurredAt: '2026-09-01T12:00:00Z',
        syncStatus: 'synced',
      },
      {
        id: 'tx-2',
        accountId: 'acc-credit',
        categoryId: 'cat-coffee',
        payee: 'Starbucks',
        amountCents: 650,
        direction: 'outflow',
        occurredAt: '2026-09-02T08:30:00Z',
        syncStatus: 'synced',
      },
    ];

    it('SCEN-066: resolves category and account for known payee case-insensitively', () => {
      const suggestion = ExpenseIntake.resolvePayeeSuggestion({
        transactions,
        payeeText: 'whole foods',
      });

      expect(suggestion).toEqual({
        categoryId: 'cat-groceries',
        accountId: 'acc-checking',
      });
    });

    it('SCEN-066: returns null for unknown payee strings', () => {
      const suggestion = ExpenseIntake.resolvePayeeSuggestion({
        transactions,
        payeeText: 'Unknown Merchant',
      });

      expect(suggestion).toBeNull();
    });

    it('returns null for blank or empty payee strings', () => {
      expect(ExpenseIntake.resolvePayeeSuggestion({ transactions, payeeText: '' })).toBeNull();
      expect(ExpenseIntake.resolvePayeeSuggestion({ transactions, payeeText: '   ' })).toBeNull();
    });
  });

  describe('SCEN-067: Atomic Expense Intake Validation & Outflow Construction', () => {
    it('SCEN-067: validates and builds valid outflow parameters', () => {
      const params = ExpenseIntake.validateAndBuildOutflow({
        amountText: '$24.50',
        payeeText: 'Coffee Shop',
        categoryId: 'cat-coffee',
        accountId: 'acc-checking',
      });

      expect(params.amountCents).toBe(2450);
      expect(params.payee).toBe('Coffee Shop');
      expect(params.categoryId).toBe('cat-coffee');
      expect(params.accountId).toBe('acc-checking');
    });

    it('throws validation error when amount is zero or negative', () => {
      expect(() =>
        ExpenseIntake.validateAndBuildOutflow({
          amountText: '$0.00',
          payeeText: 'Store',
          categoryId: 'cat-1',
          accountId: 'acc-1',
        })
      ).toThrow('Please enter an amount greater than $0.00');
    });

    it('throws validation error when categoryId is missing', () => {
      expect(() =>
        ExpenseIntake.validateAndBuildOutflow({
          amountText: '$10.00',
          payeeText: 'Store',
          categoryId: '',
          accountId: 'acc-1',
        })
      ).toThrow('Please select an envelope category');
    });

    it('throws validation error when accountId is missing', () => {
      expect(() =>
        ExpenseIntake.validateAndBuildOutflow({
          amountText: '$10.00',
          payeeText: 'Store',
          categoryId: 'cat-1',
          accountId: '',
        })
      ).toThrow('Please select a payment account');
    });

    it('defaults payee to Outflow when empty', () => {
      const params = ExpenseIntake.validateAndBuildOutflow({
        amountText: '$10.00',
        payeeText: '',
        categoryId: 'cat-1',
        accountId: 'acc-1',
      });

      expect(params.payee).toBe('Outflow');
    });
  });
});
