import { DatabaseAdapter, LedgerRepository, CategoryGroup } from './types';
import { BudgetState, Account, Category, Transaction } from '../domain/ledger/types';
import {
  postOutflowTransaction,
  postInflowTransaction,
  allocateEnvelope,
  postCreditCardPayment,
} from '../domain/ledger/ledgerEngine';
import { performMonthRollover, MonthRolloverResult } from '../domain/ledger/rollover';
import { seedDatabase } from './schema';

interface CategoryGroupRow {
  id: string;
  name: string;
  sort_order: number;
}

interface AccountRow {
  id: string;
  name: string;
  account_type: Account['accountType'];
  balance_cents: number;
  credit_payment_category_id: string | null;
  created_at: string;
}

interface CategoryRow {
  id: string;
  group_id: string;
  name: string;
  target_cents: number;
  assigned_cents: number;
  available_cents: number;
  is_credit_payment: number;
  unfunded_debt_cents: number | null;
  sort_order: number;
}

interface TransactionRow {
  id: string;
  account_id: string;
  category_id: string | null;
  payee: string;
  amount_cents: number;
  direction: Transaction['direction'];
  occurred_at: string;
  sync_status: Transaction['syncStatus'];
  unfunded_debt_cents: number | null;
  transferred_to_reserve_cents: number | null;
}

export class SQLiteLedgerRepository implements LedgerRepository {
  constructor(private db: DatabaseAdapter) {}

  getCategoryGroups(): CategoryGroup[] {
    const rows = this.db.getAllSync<CategoryGroupRow>(
      'SELECT id, name, sort_order FROM category_groups ORDER BY sort_order ASC'
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      sortOrder: Number(r.sort_order),
    }));
  }

  getBudgetState(): BudgetState {
    const metaRow = this.db.getFirstSync<{ value: string }>(
      'SELECT value FROM metadata WHERE key = ?',
      'ready_to_assign_cents'
    );
    const readyToAssignCents = metaRow ? parseInt(metaRow.value, 10) : 0;

    const accountRows = this.db.getAllSync<AccountRow>('SELECT * FROM accounts');
    const accounts: Record<string, Account> = {};
    for (const r of accountRows) {
      accounts[r.id] = {
        id: r.id,
        name: r.name,
        accountType: r.account_type,
        balanceCents: Number(r.balance_cents),
        creditPaymentCategoryId: r.credit_payment_category_id || undefined,
      };
    }

    const categoryRows = this.db.getAllSync<CategoryRow>(
      'SELECT * FROM categories ORDER BY sort_order ASC'
    );
    const categories: Record<string, Category> = {};
    for (const r of categoryRows) {
      categories[r.id] = {
        id: r.id,
        groupId: r.group_id,
        name: r.name,
        targetCents: Number(r.target_cents),
        assignedCents: Number(r.assigned_cents),
        availableCents: Number(r.available_cents),
        isCreditPayment: Boolean(r.is_credit_payment),
        unfundedDebtCents: Number(r.unfunded_debt_cents || 0),
      };
    }

    const txRows = this.db.getAllSync<TransactionRow>(
      'SELECT * FROM transactions ORDER BY occurred_at DESC'
    );
    const transactions: Transaction[] = txRows.map((r) => ({
      id: r.id,
      accountId: r.account_id,
      categoryId: r.category_id || undefined,
      payee: r.payee,
      amountCents: Number(r.amount_cents),
      direction: r.direction,
      occurredAt: r.occurred_at,
      syncStatus: r.sync_status,
      unfundedDebtCents: Number(r.unfunded_debt_cents || 0),
      transferredToReserveCents: Number(r.transferred_to_reserve_cents || 0),
    }));


    let totalOutflowCents = 0;
    let totalInflowCents = 0;
    for (const tx of transactions) {
      if (tx.direction === 'outflow') {
        totalOutflowCents += tx.amountCents;
      } else {
        totalInflowCents += tx.amountCents;
      }
    }

    return {
      readyToAssignCents,
      accounts,
      categories,
      transactions,
      totalOutflowCents,
      totalInflowCents,
    };
  }

  postOutflow(params: {
    id: string;
    accountId: string;
    categoryId: string;
    amountCents: number;
    payee: string;
    occurredAt?: string;
  }): { transaction: Transaction; isOverspent: boolean } {
    const currentState = this.getBudgetState();
    const result = postOutflowTransaction({
      state: currentState,
      id: params.id,
      accountId: params.accountId,
      categoryId: params.categoryId,
      amountCents: params.amountCents,
      payee: params.payee,
      occurredAt: params.occurredAt,
    });

    this.db.withTransactionSync(() => {
      // 1. Update account balance
      const acc = result.state.accounts[params.accountId];
      this.db.runSync(
        'UPDATE accounts SET balance_cents = ? WHERE id = ?',
        acc.balanceCents,
        acc.id
      );

      // 2. Update category available balance & unfunded debt
      const cat = result.state.categories[params.categoryId];
      this.db.runSync(
        'UPDATE categories SET available_cents = ?, unfunded_debt_cents = ? WHERE id = ?',
        cat.availableCents,
        cat.unfundedDebtCents || 0,
        cat.id
      );

      // 3. If credit payment reserve category was updated, persist it
      if (acc.accountType === 'credit' && acc.creditPaymentCategoryId) {
        const paymentCat = result.state.categories[acc.creditPaymentCategoryId];
        if (paymentCat) {
          this.db.runSync(
            'UPDATE categories SET available_cents = ? WHERE id = ?',
            paymentCat.availableCents,
            paymentCat.id
          );
        }
      }

      // 4. Insert transaction record
      this.db.runSync(
        'INSERT INTO transactions (id, account_id, category_id, payee, amount_cents, direction, occurred_at, sync_status, unfunded_debt_cents, transferred_to_reserve_cents) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        result.transaction.id,
        result.transaction.accountId,
        result.transaction.categoryId || null,
        result.transaction.payee,
        result.transaction.amountCents,
        result.transaction.direction,
        result.transaction.occurredAt,
        result.transaction.syncStatus,
        result.transaction.unfundedDebtCents || 0,
        result.transaction.transferredToReserveCents || 0
      );
    });

    return {
      transaction: result.transaction,
      isOverspent: result.isOverspent,
    };
  }

  postInflow(params: {
    id: string;
    accountId: string;
    amountCents: number;
    payee: string;
    occurredAt?: string;
  }): { transaction: Transaction } {
    const currentState = this.getBudgetState();
    const result = postInflowTransaction({
      state: currentState,
      id: params.id,
      accountId: params.accountId,
      amountCents: params.amountCents,
      payee: params.payee,
      occurredAt: params.occurredAt,
    });

    this.db.withTransactionSync(() => {
      // 1. Update account balance
      const acc = result.state.accounts[params.accountId];
      this.db.runSync(
        'UPDATE accounts SET balance_cents = ? WHERE id = ?',
        acc.balanceCents,
        acc.id
      );

      // 2. Update ready_to_assign in metadata
      this.db.runSync(
        'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
        'ready_to_assign_cents',
        String(result.state.readyToAssignCents)
      );

      // 3. Insert transaction record
      this.db.runSync(
        'INSERT INTO transactions (id, account_id, payee, amount_cents, direction, occurred_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        result.transaction.id,
        result.transaction.accountId,
        result.transaction.payee,
        result.transaction.amountCents,
        result.transaction.direction,
        result.transaction.occurredAt,
        result.transaction.syncStatus
      );
    });

    return {
      transaction: result.transaction,
    };
  }

  allocateEnvelope(params: {
    categoryId: string;
    amountCents: number;
  }): { isOverAssigned: boolean } {
    const currentState = this.getBudgetState();
    const result = allocateEnvelope({
      state: currentState,
      categoryId: params.categoryId,
      amountCents: params.amountCents,
    });

    this.db.withTransactionSync(() => {
      const cat = result.state.categories[params.categoryId];
      this.db.runSync(
        'UPDATE categories SET assigned_cents = ?, available_cents = ? WHERE id = ?',
        cat.assignedCents,
        cat.availableCents,
        cat.id
      );

      this.db.runSync(
        'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
        'ready_to_assign_cents',
        String(result.state.readyToAssignCents)
      );
    });

    return {
      isOverAssigned: result.isOverAssigned,
    };
  }

  postCreditCardPayment(params: {
    id: string;
    fromAccountId: string;
    toAccountId: string;
    amountCents: number;
    payee?: string;
    occurredAt?: string;
  }): { transaction: Transaction } {
    const currentState = this.getBudgetState();
    const result = postCreditCardPayment({
      state: currentState,
      id: params.id,
      fromAccountId: params.fromAccountId,
      toAccountId: params.toAccountId,
      amountCents: params.amountCents,
      payee: params.payee,
      occurredAt: params.occurredAt,
    });

    this.db.withTransactionSync(() => {
      // 1. Update fromAccount
      const fromAcc = result.state.accounts[params.fromAccountId];
      this.db.runSync(
        'UPDATE accounts SET balance_cents = ? WHERE id = ?',
        fromAcc.balanceCents,
        fromAcc.id
      );

      // 2. Update toAccount
      const toAcc = result.state.accounts[params.toAccountId];
      this.db.runSync(
        'UPDATE accounts SET balance_cents = ? WHERE id = ?',
        toAcc.balanceCents,
        toAcc.id
      );

      // 3. Update payment category
      if (toAcc.creditPaymentCategoryId) {
        const paymentCat = result.state.categories[toAcc.creditPaymentCategoryId];
        if (paymentCat) {
          this.db.runSync(
            'UPDATE categories SET available_cents = ? WHERE id = ?',
            paymentCat.availableCents,
            paymentCat.id
          );
        }
      }

      // 4. Insert transaction
      this.db.runSync(
        'INSERT INTO transactions (id, account_id, category_id, payee, amount_cents, direction, occurred_at, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        result.transaction.id,
        result.transaction.accountId,
        result.transaction.categoryId || null,
        result.transaction.payee,
        result.transaction.amountCents,
        result.transaction.direction,
        result.transaction.occurredAt,
        result.transaction.syncStatus
      );
    });

    return {
      transaction: result.transaction,
    };
  }

  performMonthRollover(targetMonth?: string): MonthRolloverResult {
    const currentState = this.getBudgetState();
    const result = performMonthRollover({ state: currentState, targetMonth });

    this.db.withTransactionSync(() => {
      // 1. Update Ready to Assign in metadata
      this.db.runSync(
        'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
        'ready_to_assign_cents',
        String(result.state.readyToAssignCents)
      );

      // 2. Track current cycle month if provided
      if (targetMonth) {
        this.db.runSync(
          'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
          'current_cycle_month',
          targetMonth
        );
      }

      // 3. Update category envelopes (assigned resets to 0, deficits cleared, unspent rolled over)
      for (const cat of Object.values(result.state.categories)) {
        this.db.runSync(
          'UPDATE categories SET assigned_cents = ?, available_cents = ?, unfunded_debt_cents = ? WHERE id = ?',
          cat.assignedCents,
          cat.availableCents,
          cat.unfundedDebtCents || 0,
          cat.id
        );
      }
    });

    return result;
  }

  resetDatabase(): void {
    seedDatabase(this.db);
  }
}

