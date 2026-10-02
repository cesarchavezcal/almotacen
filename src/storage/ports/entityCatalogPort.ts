import {
  Account,
  Category,
  CategoryGroup,
  CreateAccountInput,
  UpdateAccountInput,
  CreateCategoryGroupInput,
  UpdateCategoryGroupInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../../domain/ledger/types';

export interface EntityCatalogPort {
  createAccount(input: CreateAccountInput): Account;
  updateAccount(input: UpdateAccountInput): Account;
  deleteAccount(id: string): void;
  createCategoryGroup(input: CreateCategoryGroupInput): CategoryGroup;
  updateCategoryGroup(input: UpdateCategoryGroupInput): CategoryGroup;
  deleteCategoryGroup(id: string): void;
  createCategory(input: CreateCategoryInput): Category;
  updateCategory(input: UpdateCategoryInput): Category;
  deleteCategory(id: string): void;
}
