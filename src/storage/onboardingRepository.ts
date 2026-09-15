import { DatabaseAdapter } from './types';
import { OnboardingRepository, ValidatedOnboardingConfig } from '../domain/onboarding/types';

export class SQLiteOnboardingRepository implements OnboardingRepository {
  constructor(private readonly db: DatabaseAdapter) {}

  commitOnboardingConfig(config: ValidatedOnboardingConfig): void {
    this.db.withTransactionSync(() => {
      const now = new Date().toISOString();
      const checkingId = config.depositoryAccount.id;

      // Insert Primary Depository Account
      this.db.runSync(
        'INSERT INTO accounts (id, name, account_type, balance_cents, credit_payment_category_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        checkingId,
        config.depositoryAccount.name,
        'checking',
        config.depositoryAccount.startingBalanceCents,
        null,
        now
      );

      // Optional Credit Card Account & Payment Category
      if (config.creditCardAccount) {
        const creditCardAccountId = config.creditCardAccount.id;
        const creditCardName = config.creditCardAccount.name;
        const creditCardStartingDebtCents = config.creditCardAccount.startingDebtCents;
        const paymentCatId = 'cat-cc-payment';
        const paymentGroupId = 'grp-payments';

        // Insert or ensure payment category group
        const existingGroup = this.db.getFirstSync(
          'SELECT id FROM category_groups WHERE id = ?',
          paymentGroupId
        );
        if (!existingGroup) {
          this.db.runSync(
            'INSERT INTO category_groups (id, name, sort_order) VALUES (?, ?, ?)',
            paymentGroupId,
            'Credit Card Payments',
            0
          );
        }

        // Insert linked Credit Card Payment category with initial unfunded debt
        this.db.runSync(
          'INSERT INTO categories (id, group_id, name, target_cents, target_type, target_due_day, assigned_cents, available_cents, is_credit_payment, unfunded_debt_cents, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          paymentCatId,
          paymentGroupId,
          `${creditCardName} Payment`,
          0,
          'NEEDED_FOR_SPENDING',
          null,
          0,
          0,
          1,
          creditCardStartingDebtCents,
          0
        );

        // Insert Credit Card Account with negative balance representing debt
        this.db.runSync(
          'INSERT INTO accounts (id, name, account_type, balance_cents, credit_payment_category_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          creditCardAccountId,
          creditCardName,
          'credit',
          -Math.abs(creditCardStartingDebtCents),
          paymentCatId,
          now
        );
      }

      // Insert Archetype Category Groups
      for (const group of config.template.groups) {
        this.db.runSync(
          'INSERT INTO category_groups (id, name, sort_order) VALUES (?, ?, ?)',
          group.id,
          group.name,
          group.sortOrder
        );
      }

      // Insert Archetype Categories with configured targets and initial allocations
      let sortOrder = 1;
      for (const category of config.template.categories) {
        const allocatedCents = Math.max(0, Math.floor(config.allocations[category.id] ?? 0));
        this.db.runSync(
          'INSERT INTO categories (id, group_id, name, target_cents, target_type, target_due_day, assigned_cents, available_cents, is_credit_payment, unfunded_debt_cents, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          category.id,
          category.groupId,
          category.name,
          category.targetCents,
          category.targetType,
          category.targetDueDay ?? null,
          allocatedCents,
          allocatedCents,
          0,
          0,
          sortOrder++
        );
      }

      // Update metadata
      this.db.runSync(
        'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
        'ready_to_assign_cents',
        String(config.remainingReadyToAssignCents)
      );
      this.db.runSync(
        'INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)',
        'onboarding_completed',
        'true'
      );
    });
  }
}

export function createOnboardingRepository(db: DatabaseAdapter): OnboardingRepository {
  return new SQLiteOnboardingRepository(db);
}
