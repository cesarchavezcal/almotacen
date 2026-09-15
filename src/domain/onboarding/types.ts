import { TargetType } from '../ledger/types';

export type ArchetypePresetId = 'STANDARD_BALANCED' | 'DEBT_CRUSHER' | 'MINIMALIST_LIVING';

export interface CategoryTemplateItem {
  id: string;
  groupId: string;
  name: string;
  targetCents: number;
  targetType: TargetType;
  targetDueDay?: number;
  priority: number;
}

export interface CategoryGroupTemplate {
  id: string;
  name: string;
  sortOrder: number;
}

export interface ArchetypeTemplate {
  id: ArchetypePresetId;
  name: string;
  description: string;
  groups: CategoryGroupTemplate[];
  categories: CategoryTemplateItem[];
}

export interface InitialAllocationResult {
  allocations: Record<string, number>;
  totalAssignedCents: number;
  remainingReadyToAssignCents: number;
}

export interface DepositoryAccountInput {
  name: string;
  startingBalanceCents: number;
  id?: string;
}

export interface CreditCardAccountInput {
  name: string;
  startingDebtCents: number;
  id?: string;
}

export interface CommitOnboardingConfigParams {
  depositoryAccount: DepositoryAccountInput;
  creditCardAccount?: CreditCardAccountInput;
  template: ArchetypeTemplate;
  allocations: Record<string, number>;
  remainingReadyToAssignCents: number;
}

export interface ValidatedOnboardingConfig {
  depositoryAccount: {
    id: string;
    name: string;
    startingBalanceCents: number;
  };
  creditCardAccount?: {
    id: string;
    name: string;
    startingDebtCents: number;
  };
  template: ArchetypeTemplate;
  allocations: Record<string, number>;
  remainingReadyToAssignCents: number;
}

export interface OnboardingRepository {
  commitOnboardingConfig(config: ValidatedOnboardingConfig): void;
}
