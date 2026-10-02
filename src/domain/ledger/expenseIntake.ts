import { Category, Transaction } from './types';
import { ValidationError } from './errors';
import { parseCurrencyToCents } from './currency';

export interface ExpenseImpactPreview {
  parsedCents: number;
  remainingAvailableCents: number;
  isOverspent: boolean;
  warningBadge: 'OVERSPENT' | null;
}

export interface PreviewImpactParams {
  category: Category | undefined;
  amountText: string;
}

export interface PayeeSuggestion {
  categoryId: string;
  accountId: string;
}

export interface ResolvePayeeSuggestionParams {
  transactions: Transaction[];
  payeeText: string;
}

export interface ValidateAndBuildOutflowParams {
  amountText: string;
  payeeText: string;
  categoryId: string;
  accountId: string;
}

export interface BuiltOutflow {
  amountCents: number;
  payee: string;
  categoryId: string;
  accountId: string;
}

export class ExpenseIntake {
  /**
   * Evaluates the live impact of an entered expense amount against the selected envelope.
   */
  static previewImpact(params: PreviewImpactParams): ExpenseImpactPreview {
    const { category, amountText } = params;
    const parsedCents = parseCurrencyToCents(amountText);
    const availableCents = category?.availableCents ?? 0;
    const remainingAvailableCents = availableCents - parsedCents;
    const isOverspent = remainingAvailableCents < 0;

    return {
      parsedCents,
      remainingAvailableCents,
      isOverspent,
      warningBadge: isOverspent ? 'OVERSPENT' : null,
    };
  }

  /**
   * Case-insensitively looks up the most recent matching transaction for the entered payee
   * and suggests the last used category and account.
   */
  static resolvePayeeSuggestion(params: ResolvePayeeSuggestionParams): PayeeSuggestion | null {
    const { transactions, payeeText } = params;
    const trimmed = payeeText.trim().toLowerCase();
    if (!trimmed) {
      return null;
    }

    for (const tx of transactions) {
      if (tx.payee && tx.payee.toLowerCase() === trimmed && tx.categoryId && tx.accountId) {
        return {
          categoryId: tx.categoryId,
          accountId: tx.accountId,
        };
      }
    }

    return null;
  }

  /**
   * Validates raw inputs and builds the payload for ledger outflow posting.
   */
  static validateAndBuildOutflow(params: ValidateAndBuildOutflowParams): BuiltOutflow {
    const { amountText, payeeText, categoryId, accountId } = params;
    const amountCents = parseCurrencyToCents(amountText);

    if (amountCents <= 0) {
      throw new ValidationError('Please enter an amount greater than $0.00');
    }

    if (!categoryId) {
      throw new ValidationError('Please select an envelope category');
    }

    if (!accountId) {
      throw new ValidationError('Please select a payment account');
    }

    const payee = payeeText.trim() || 'Outflow';

    return {
      amountCents,
      payee,
      categoryId,
      accountId,
    };
  }
}
