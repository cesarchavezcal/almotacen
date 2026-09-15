import {
  ArchetypePresetId,
  ArchetypeTemplate,
  CategoryTemplateItem,
  InitialAllocationResult,
} from './types';

export class InvalidArchetypePresetError extends Error {
  constructor(public readonly presetId: string) {
    super(`Unknown archetype preset ID: "${presetId}"`);
    this.name = 'InvalidArchetypePresetError';
  }
}

export class CategoryNotFoundError extends Error {
  constructor(public readonly categoryId: string) {
    super(`Category with ID "${categoryId}" not found in template.`);
    this.name = 'CategoryNotFoundError';
  }
}

export const ARCHETYPE_PRESET_IDS: ArchetypePresetId[] = [
  'STANDARD_BALANCED',
  'DEBT_CRUSHER',
  'MINIMALIST_LIVING',
];

const ARCHETYPE_PRESETS: Record<ArchetypePresetId, ArchetypeTemplate> = {
  STANDARD_BALANCED: {
    id: 'STANDARD_BALANCED',
    name: 'Standard Balanced',
    description:
      'A balanced baseline covering immediate bills, true expenses, quality of life, and emergency savings.',
    groups: [
      { id: 'grp-immediate', name: 'Immediate Obligations', sortOrder: 1 },
      { id: 'grp-true', name: 'True Expenses', sortOrder: 2 },
      { id: 'grp-qol', name: 'Quality of Life', sortOrder: 3 },
      { id: 'grp-savings', name: 'Savings & Goals', sortOrder: 4 },
    ],
    categories: [
      {
        id: 'cat-rent',
        groupId: 'grp-immediate',
        name: 'Rent & Housing',
        targetCents: 120000, // $1,200.00
        targetType: 'MONTHLY_SET_ASIDE',
        targetDueDay: 1,
        priority: 1,
      },
      {
        id: 'cat-groceries',
        groupId: 'grp-immediate',
        name: 'Groceries & Household',
        targetCents: 40000, // $400.00
        targetType: 'NEEDED_FOR_SPENDING',
        targetDueDay: 15,
        priority: 2,
      },
      {
        id: 'cat-utilities',
        groupId: 'grp-immediate',
        name: 'Utilities & Internet',
        targetCents: 15000, // $150.00
        targetType: 'MONTHLY_SET_ASIDE',
        targetDueDay: 20,
        priority: 3,
      },
      {
        id: 'cat-auto',
        groupId: 'grp-true',
        name: 'Auto Maintenance',
        targetCents: 10000, // $100.00
        targetType: 'NEEDED_FOR_SPENDING',
        priority: 4,
      },
      {
        id: 'cat-dining',
        groupId: 'grp-qol',
        name: 'Dining & Coffee',
        targetCents: 15000, // $150.00
        targetType: 'NEEDED_FOR_SPENDING',
        priority: 5,
      },
      {
        id: 'cat-emergency',
        groupId: 'grp-savings',
        name: 'Emergency Fund',
        targetCents: 20000, // $200.00
        targetType: 'MONTHLY_SET_ASIDE',
        priority: 6,
      },
    ],
  },
  DEBT_CRUSHER: {
    id: 'DEBT_CRUSHER',
    name: 'Debt Crusher',
    description:
      'Accelerate debt freedom with aggressive payoff allocations, bare-minimum essentials, and a margin safety buffer.',
    groups: [
      { id: 'grp-debt', name: 'Credit Card & Debt Payoff', sortOrder: 1 },
      { id: 'grp-essentials', name: 'Bare Minimum Essentials', sortOrder: 2 },
      { id: 'grp-margin', name: 'Margin Buffer', sortOrder: 3 },
    ],
    categories: [
      {
        id: 'cat-debt-payoff',
        groupId: 'grp-debt',
        name: 'Credit Card Payoff',
        targetCents: 50000, // $500.00
        targetType: 'MONTHLY_SET_ASIDE',
        priority: 1,
      },
      {
        id: 'cat-min-housing',
        groupId: 'grp-essentials',
        name: 'Minimum Housing',
        targetCents: 100000, // $1,000.00
        targetType: 'MONTHLY_SET_ASIDE',
        targetDueDay: 1,
        priority: 2,
      },
      {
        id: 'cat-essential-groceries',
        groupId: 'grp-essentials',
        name: 'Essential Groceries',
        targetCents: 30000, // $300.00
        targetType: 'NEEDED_FOR_SPENDING',
        priority: 3,
      },
      {
        id: 'cat-basic-utilities',
        groupId: 'grp-essentials',
        name: 'Basic Utilities',
        targetCents: 10000, // $100.00
        targetType: 'MONTHLY_SET_ASIDE',
        priority: 4,
      },
      {
        id: 'cat-snowball-buffer',
        groupId: 'grp-margin',
        name: 'Emergency Snowball Buffer',
        targetCents: 5000, // $50.00
        targetType: 'MONTHLY_SET_ASIDE',
        priority: 5,
      },
    ],
  },
  MINIMALIST_LIVING: {
    id: 'MINIMALIST_LIVING',
    name: 'Minimalist Living',
    description:
      'Simple, streamlined budgeting with 3 broad buckets for low maintenance.',
    groups: [
      { id: 'grp-fixed', name: 'Fixed Living', sortOrder: 1 },
      { id: 'grp-daily', name: 'Flexible Daily', sortOrder: 2 },
      { id: 'grp-buffer', name: 'Discretionary Buffer', sortOrder: 3 },
    ],
    categories: [
      {
        id: 'cat-fixed-shelter',
        groupId: 'grp-fixed',
        name: 'Shelter & Utilities',
        targetCents: 130000, // $1,300.00
        targetType: 'MONTHLY_SET_ASIDE',
        targetDueDay: 1,
        priority: 1,
      },
      {
        id: 'cat-flexible-living',
        groupId: 'grp-daily',
        name: 'Living & Food',
        targetCents: 45000, // $450.00
        targetType: 'NEEDED_FOR_SPENDING',
        priority: 2,
      },
      {
        id: 'cat-buffer-discretionary',
        groupId: 'grp-buffer',
        name: 'Buffer & Discretionary',
        targetCents: 10000, // $100.00
        targetType: 'NEEDED_FOR_SPENDING',
        priority: 3,
      },
    ],
  },
};

export function getArchetypeTemplate(presetId: ArchetypePresetId): ArchetypeTemplate {
  const preset = ARCHETYPE_PRESETS[presetId];
  if (!preset) {
    throw new InvalidArchetypePresetError(String(presetId));
  }
  return structuredClone(preset);
}

export function calculateInitialAllocation(
  cashCents: number,
  categories: CategoryTemplateItem[]
): InitialAllocationResult {
  const safeCash = Math.max(0, Math.floor(cashCents));
  let remainingCash = safeCash;
  let totalAssigned = 0;
  const allocations: Record<string, number> = {};

  // Sort ascending by priority so higher priority (lower number) gets funded first
  const sorted = [...categories].sort((a, b) => a.priority - b.priority);

  for (const cat of sorted) {
    const target = Math.max(0, Math.floor(cat.targetCents));
    const allocate = Math.min(remainingCash, target);
    allocations[cat.id] = allocate;
    remainingCash -= allocate;
    totalAssigned += allocate;
  }

  return {
    allocations,
    totalAssignedCents: totalAssigned,
    remainingReadyToAssignCents: remainingCash,
  };
}

export function addCategoryToTemplate(
  template: ArchetypeTemplate,
  item: Omit<CategoryTemplateItem, 'id' | 'priority'> & { id?: string; priority?: number },
  idGenerator: () => string = () => `cat-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
): ArchetypeTemplate {
  const cloned = structuredClone(template);
  const maxPriority = cloned.categories.reduce((max, c) => Math.max(max, c.priority), 0);
  const newId = item.id ?? idGenerator();

  cloned.categories.push({
    ...item,
    id: newId,
    priority: item.priority ?? maxPriority + 1,
  });

  return cloned;
}

export function removeCategoryFromTemplate(
  template: ArchetypeTemplate,
  categoryId: string
): ArchetypeTemplate {
  const cloned = structuredClone(template);
  cloned.categories = cloned.categories.filter((c) => c.id !== categoryId);
  return cloned;
}

export function updateCategoryInTemplate(
  template: ArchetypeTemplate,
  categoryId: string,
  updates: Partial<Omit<CategoryTemplateItem, 'id' | 'groupId'>>
): ArchetypeTemplate {
  const cloned = structuredClone(template);
  const index = cloned.categories.findIndex((c) => c.id === categoryId);
  if (index === -1) {
    throw new CategoryNotFoundError(categoryId);
  }
  cloned.categories[index] = {
    ...cloned.categories[index],
    ...updates,
  };
  return cloned;
}
