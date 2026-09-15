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
