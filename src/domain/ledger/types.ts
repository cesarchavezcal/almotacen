export type AccountType = 'checking' | 'savings' | 'credit' | 'cash';

export interface Account {
  id: string;
  name: string;
  accountType: AccountType;
  balanceCents: number;
  creditPaymentCategoryId?: string;
}

export interface Category {
  id: string;
  groupId: string;
  name: string;
  targetCents: number;
  assignedCents: number;
  availableCents: number;
  isCreditPayment?: boolean;
  unfundedDebtCents?: number;
}

export type TransactionDirection = 'inflow' | 'outflow';
export type SyncStatus = 'synced' | 'pending';

export interface Transaction {
  id: string;
  accountId: string;
  categoryId?: string;
  payee: string;
  amountCents: number;
  direction: TransactionDirection;
  occurredAt: string;
  syncStatus: SyncStatus;
  unfundedDebtCents?: number;
  transferredToReserveCents?: number;
}

export interface BudgetState {
  readyToAssignCents: number;
  accounts: Record<string, Account>;
  categories: Record<string, Category>;
  transactions: Transaction[];
  totalOutflowCents: number;
  totalInflowCents: number;
}
