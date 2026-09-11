import { DatabaseAdapter, LedgerRepository, CategoryGroup } from './types';
import { BudgetState, Account, Category, Transaction, isTargetType } from '../domain/ledger/types';
import {
  postOutflowTransaction,
  postInflowTransaction,
  allocateEnvelope,
  postCreditCardPayment,
} from '../domain/ledger/ledgerEngine';
import { performMonthRollover, MonthRolloverResult } from '../domain/ledger/rollover';
import { calculateAutoAssignAllocations } from '../domain/ledger/autoAssign';
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
  target_type: string | null;
  target_due_day: number | null;
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
    const groupRows = this.db.getAllSync<CategoryGroupRow>(
      'SELECT id, name, sort_order FROM category_groups ORDER BY sort_order ASC'
    );
    return groupRows.map((groupRow) => ({
      id: groupRow.id,
      name: groupRow.name,
      sortOrder: Number(groupRow.sort_order),
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
    for (const accountRow of accountRows) {
      accounts[accountRow.id] = {
        id: accountRow.id,
        name: accountRow.name,
        accountType: accountRow.account_type,
        balanceCents: Number(accountRow.balance_cents),
        creditPaymentCategoryId: accountRow.credit_payment_category_id || undefined,
      };
    }

    const categoryRows = this.db.getAllSync<CategoryRow>(
      'SELECT * FROM categories ORDER BY sort_order ASC'
    );
    const categories: Record<string, Category> = {};
    for (const categoryRow of categoryRows) {
      const targetType = isTargetType(categoryRow.target_type)
        ? categoryRow.target_type
        : 'NEEDED_FOR_SPENDING';

      categories[categoryRow.id] = {
        id: categoryRow.id,
        groupId: categoryRow.group_id,
        name: categoryRow.name,
        targetCents: Number(categoryRow.target_cents),
        targetType,
        targetDueDay:
          categoryRow.target_due_day !== null && categoryRow.target_due_day !== undefined
            ? Number(categoryRow.target_due_day)
            : undefined,
        assignedCents: Number(categoryRow.assigned_cents),
        availableCents: Number(categoryRow.available_cents),
        isCreditPayment: Boolean(categoryRow.is_credit_payment),
        unfundedDebtCents: Number(categoryRow.unfunded_debt_cents || 0),
      };
    }

    const transactionRows = this.db.getAllSync<TransactionRow>(
      'SELECT * FROM transactions ORDER BY occurred_at DESC'
    );
    const transactions: Transaction[] = transactionRows.map((transactionRow) => ({
      id: transactionRow.id,
      accountId: transactionRow.account_id,
      categoryId: transactionRow.category_id || undefined,
      payee: transactionRow.payee,
      amountCents: Number(transactionRow.amount_cents),
      direction: transactionRow.direction,
      occurredAt: transactionRow.occurred_at,
      syncStatus: transactionRow.sync_status,
      unfundedDebtCents: Number(transactionRow.unfunded_debt_cents || 0),
      transferredToReserveCents: Number(transactionRow.transferred_to_reserve_cents || 0),
    }));

    let totalOutflowCents = 0;
    let totalInflowCents = 0;
    for (const transaction of transactions) {
      if (transaction.direction === 'outflow') {
        totalOutflowCents += transaction.amountCents;
      } else {
        totalInflowCents += transaction.amountCents;
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
      const account = result.state.accounts[params.accountId];
      this.db.runSync(
        'UPDATE accounts SET balance_cents = ? WHERE id = ?',
        account.balanceCents,
        account.id
      );

      // 2. Update category available balance & unfunded debt
      const category = result.state.categories[params.categoryId];
      this.db.runSync(
        'UPDATE categories SET available_cents = ?, unfunded_debt_cents = ? WHERE id = ?',
        category.availableCents,
        category.unfundedDebtCents || 0,
        category.id
      );

      // 3. If credit payment reserve category was updated, persist it
      if (account.accountType === 'credit' && account.creditPaymentCategoryId) {
        const paymentCategory = result.state.categories[account.creditPaymentCategoryId];
        if (paymentCategory) {
          this.db.runSync(
            'UPDATE categories SET available_cents = ? WHERE id = ?',
            paymentCategory.availableCents,
            paymentCategory.id
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
      const account = result.state.accounts[params.accountId];
      this.db.runSync(
        'UPDATE accounts SET balance_cents = ? WHERE id = ?',
        account.balanceCents,
        account.id
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
      const fromAccount = result.state.accounts[params.fromAccountId];
      this.db.runSync(
        'UPDATE accounts SET balance_cents = ? WHERE id = ?',
        fromAccount.balanceCents,
        fromAccount.id
      );

      // 2. Update toAccount
      const toAccount = result.state.accounts[params.toAccountId];
      this.db.runSync(
        'UPDATE accounts SET balance_cents = ? WHERE id = ?',
        toAccount.balanceCents,
        toAccount.id
      );

      // 3. Update payment category
      if (toAccount.creditPaymentCategoryId) {
        const paymentCategory = result.state.categories[toAccount.creditPaymentCategoryId];
        if (paymentCategory) {
          this.db.runSync(
            'UPDATE categories SET available_cents = ? WHERE id = ?',
            paymentCategory.availableCents,
            paymentCategory.id
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

  applyAutoAssign(): { totalAllocatedCents: number; assignedCount: number } {
    const currentState = this.getBudgetState();
    const groups = this.getCategoryGroups();

    const autoAssignResult = calculateAutoAssignAllocations({
      readyToAssignCents: currentState.readyToAssignCents,
      categories: Object.values(currentState.categories),
      groups,
    });

    if (autoAssignResult.totalAllocatedCents === 0) {
      return { totalAllocatedCents: 0, assignedCount: 0 };
    }

    let assignedCount = 0;
    this.db.withTransactionSync(() => {
      for (const [categoryId, allocatedCents] of Object.entries(autoAssignResult.allocations)) {
        if (allocatedCents > 0) {
          const category = currentState.categories[categoryId];
          if (category) {
            const newAssignedCents = category.assignedCents + allocatedCents;
            const newAvailableCents = category.availableCents + allocatedCents;
            this.db.runSync(
              'UPDATE categories SET assigned_cents = ?, available_cents = ? WHERE id = ?',
              newAssignedCents,
              newAvailableCents,
              category.id
            );
            assignedCount++;
          }
        }
      }

      this.db.runSync(
        'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
        'ready_to_assign_cents',
        String(autoAssignResult.remainingReadyToAssignCents)
      );
    });

    return {
      totalAllocatedCents: autoAssignResult.totalAllocatedCents,
      assignedCount,
    };
  }

  resetDatabase(): void {
    seedDatabase(this.db);
  }
}

