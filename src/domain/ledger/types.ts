export type AccountType = 'checking' | 'savings' | 'credit' | 'cash';

export interface Account {
  id: string;
  name: string;
  accountType: AccountType;
  balanceCents: number;
  creditPaymentCategoryId?: string;
}

export interface CategoryGroup {
  id: string;
  name: string;
  sortOrder: number;
}

export type TargetType = 'NEEDED_FOR_SPENDING' | 'MONTHLY_SET_ASIDE';

export function isTargetType(value: unknown): value is TargetType {
  return value === 'NEEDED_FOR_SPENDING' || value === 'MONTHLY_SET_ASIDE';
}

export interface Category {
  id: string;
  groupId: string;
  name: string;
  targetCents: number;
  targetType?: TargetType;
  targetDueDay?: number;
  assignedCents: number;
  availableCents: number;
  isCreditPayment?: boolean;
  unfundedDebtCents?: number;
}

export interface CategoryUnderfundedInfo {
  categoryId: string;
  targetCents: number;
  targetType: TargetType;
  underfundedCents: number;
  isFunded: boolean;
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

export interface CreateAccountInput {
  id?: string;
  name: string;
  accountType: Account['accountType'];
  balanceCents: number;
}

export interface UpdateAccountInput {
  id: string;
  name: string;
  balanceCents?: number;
}

export interface CreateCategoryGroupInput {
  id?: string;
  name: string;
}

export interface UpdateCategoryGroupInput {
  id: string;
  name: string;
}

export interface CreateCategoryInput {
  id?: string;
  groupId: string;
  name: string;
  targetCents?: number;
  targetType?: Category['targetType'];
  targetDueDay?: number;
}

export interface UpdateCategoryInput {
  id: string;
  groupId?: string;
  name?: string;
  targetCents?: number;
  targetType?: Category['targetType'];
  targetDueDay?: number;
}
