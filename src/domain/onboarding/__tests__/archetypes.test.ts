import { describe, it, expect } from '@jest/globals';
import {
  getArchetypeTemplate,
  calculateInitialAllocation,
  addCategoryToTemplate,
  removeCategoryFromTemplate,
  updateCategoryInTemplate,
  ARCHETYPE_PRESET_IDS,
  InvalidArchetypePresetError,
  CategoryNotFoundError,
} from '../archetypes';
import { ArchetypePresetId, CategoryTemplateItem } from '../types';

describe('Financial Archetype Template Generator (Ticket 02 / SCEN-049, SCEN-050)', () => {
  describe('SCEN-049: Archetype Preset Generation & Immutability', () => {
    it('exports the 3 supported archetype preset IDs', () => {
      expect(ARCHETYPE_PRESET_IDS).toEqual([
        'STANDARD_BALANCED',
        'DEBT_CRUSHER',
        'MINIMALIST_LIVING',
      ]);
    });

    it('generates the STANDARD_BALANCED template with 4 distinct groups and realistic targets', () => {
      const template = getArchetypeTemplate('STANDARD_BALANCED');
      expect(template.id).toBe('STANDARD_BALANCED');
      expect(template.name).toBe('Standard Balanced');
      expect(template.groups.length).toBe(4);

      const groupNames = template.groups.map((g) => g.name);
      expect(groupNames).toContain('Immediate Obligations');
      expect(groupNames).toContain('True Expenses');
      expect(groupNames).toContain('Quality of Life');
      expect(groupNames).toContain('Savings & Goals');

      // Verify category targets in integer cents
      const rentCat = template.categories.find((c) => c.name.includes('Rent'));
      expect(rentCat).toBeDefined();
      expect(rentCat?.targetCents).toBe(120000); // $1,200.00
      expect(rentCat?.targetType).toBe('MONTHLY_SET_ASIDE');

      const groceriesCat = template.categories.find((c) => c.name.includes('Groceries'));
      expect(groceriesCat).toBeDefined();
      expect(groceriesCat?.targetCents).toBe(40000); // $400.00
      expect(groceriesCat?.targetType).toBe('NEEDED_FOR_SPENDING');
    });

    it('generates the DEBT_CRUSHER template with aggressive debt payoff prioritisation', () => {
      const template = getArchetypeTemplate('DEBT_CRUSHER');
      expect(template.id).toBe('DEBT_CRUSHER');
      expect(template.name).toBe('Debt Crusher');

      const debtGroup = template.groups.find((g) => g.name.includes('Debt'));
      expect(debtGroup).toBeDefined();

      const debtCat = template.categories.find((c) => c.groupId === debtGroup?.id);
      expect(debtCat).toBeDefined();
      expect(debtCat?.targetCents).toBeGreaterThan(0);
    });

    it('generates the MINIMALIST_LIVING template with simplified high-level categories', () => {
      const template = getArchetypeTemplate('MINIMALIST_LIVING');
      expect(template.id).toBe('MINIMALIST_LIVING');
      expect(template.name).toBe('Minimalist Living');
      expect(template.groups.length).toBe(3);
      expect(template.categories.length).toBeLessThanOrEqual(5);
    });

    it('returns a deep copy to prevent mutation of base templates', () => {
      const templateA = getArchetypeTemplate('STANDARD_BALANCED');
      templateA.categories.push({
        id: 'cat-mutated',
        groupId: templateA.groups[0].id,
        name: 'Mutated Category',
        targetCents: 99900,
        targetType: 'NEEDED_FOR_SPENDING',
        priority: 99,
      });

      const templateB = getArchetypeTemplate('STANDARD_BALANCED');
      expect(templateB.categories.some((c) => c.id === 'cat-mutated')).toBe(false);
    });

    it('throws InvalidArchetypePresetError when requesting an invalid archetype preset ID', () => {
      expect(() => getArchetypeTemplate('UNKNOWN_PRESET' as ArchetypePresetId)).toThrow(
        InvalidArchetypePresetError
      );
    });
  });

  describe('SCEN-050: Initial Cash Allocation & Priority Distribution', () => {
    const mockCategories: CategoryTemplateItem[] = [
      {
        id: 'cat-rent',
        groupId: 'grp-1',
        name: 'Rent',
        targetCents: 100000, // $1,000
        targetType: 'MONTHLY_SET_ASIDE',
        priority: 1,
      },
      {
        id: 'cat-groceries',
        groupId: 'grp-1',
        name: 'Groceries',
        targetCents: 40000, // $400
        targetType: 'NEEDED_FOR_SPENDING',
        priority: 2,
      },
      {
        id: 'cat-dining',
        groupId: 'grp-2',
        name: 'Dining',
        targetCents: 20000, // $200
        targetType: 'NEEDED_FOR_SPENDING',
        priority: 3,
      },
    ];

    it('allocates zero across all categories when starting cash is zero', () => {
      const result = calculateInitialAllocation(0, mockCategories);
      expect(result.allocations['cat-rent']).toBe(0);
      expect(result.allocations['cat-groceries']).toBe(0);
      expect(result.allocations['cat-dining']).toBe(0);
      expect(result.totalAssignedCents).toBe(0);
      expect(result.remainingReadyToAssignCents).toBe(0);
    });

    it('allocates sequentially by priority when starting cash is less than total targets', () => {
      // Total targets = $1,600. Available cash = $1,200.
      // Rent ($1,000, p=1) -> fully funded ($1,000)
      // Groceries ($400, p=2) -> partially funded ($200)
      // Dining ($200, p=3) -> unfunded ($0)
      const result = calculateInitialAllocation(120000, mockCategories);

      expect(result.allocations['cat-rent']).toBe(100000);
      expect(result.allocations['cat-groceries']).toBe(20000);
      expect(result.allocations['cat-dining']).toBe(0);
      expect(result.totalAssignedCents).toBe(120000);
      expect(result.remainingReadyToAssignCents).toBe(0);
    });

    it('funds all categories 100% and holds excess cash in remainingReadyToAssignCents', () => {
      // Total targets = $1,600. Available cash = $2,500.
      // All funded 100%, $900 leftover in RTA.
      const result = calculateInitialAllocation(250000, mockCategories);

      expect(result.allocations['cat-rent']).toBe(100000);
      expect(result.allocations['cat-groceries']).toBe(40000);
      expect(result.allocations['cat-dining']).toBe(20000);
      expect(result.totalAssignedCents).toBe(160000);
      expect(result.remainingReadyToAssignCents).toBe(90000); // $900.00
    });

    it('respects priority sorting even when categories are passed out of order', () => {
      const shuffled = [mockCategories[2], mockCategories[0], mockCategories[1]];
      const result = calculateInitialAllocation(100000, shuffled);

      expect(result.allocations['cat-rent']).toBe(100000);
      expect(result.allocations['cat-groceries']).toBe(0);
      expect(result.allocations['cat-dining']).toBe(0);
    });
  });

  describe('SCEN-050: Template Customization Helpers', () => {
    it('adds a new custom category using a deterministic ID generator', () => {
      const template = getArchetypeTemplate('MINIMALIST_LIVING');
      const targetGroup = template.groups[0];
      const initialCount = template.categories.length;

      const updated = addCategoryToTemplate(
        template,
        {
          groupId: targetGroup.id,
          name: 'Gym Membership',
          targetCents: 5000,
          targetType: 'MONTHLY_SET_ASIDE',
        },
        () => 'cat-custom-deterministic-id'
      );

      expect(updated.categories.length).toBe(initialCount + 1);
      const added = updated.categories.find((c) => c.id === 'cat-custom-deterministic-id');
      expect(added).toBeDefined();
      expect(added?.targetCents).toBe(5000);
      expect(added?.groupId).toBe(targetGroup.id);
    });

    it('removes a category by ID from the template', () => {
      const template = getArchetypeTemplate('STANDARD_BALANCED');
      const targetCat = template.categories[0];

      const updated = removeCategoryFromTemplate(template, targetCat.id);
      expect(updated.categories.some((c) => c.id === targetCat.id)).toBe(false);
      expect(updated.categories.length).toBe(template.categories.length - 1);
    });

    it('updates category target amount and target type in the template', () => {
      const template = getArchetypeTemplate('STANDARD_BALANCED');
      const targetCat = template.categories[0];

      const updated = updateCategoryInTemplate(template, targetCat.id, {
        targetCents: 150000,
        name: 'Updated Name',
      });

      const found = updated.categories.find((c) => c.id === targetCat.id);
      expect(found?.targetCents).toBe(150000);
      expect(found?.name).toBe('Updated Name');
    });

    it('throws CategoryNotFoundError when updating a non-existent category ID', () => {
      const template = getArchetypeTemplate('STANDARD_BALANCED');
      expect(() =>
        updateCategoryInTemplate(template, 'non-existent-id', { targetCents: 5000 })
      ).toThrow(CategoryNotFoundError);
    });
  });
});
