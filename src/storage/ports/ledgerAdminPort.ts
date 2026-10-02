import { ValidatedOnboardingConfig } from '../../domain/onboarding/types';

export interface DiagnosticsData {
  schemaVersion: number;
  accountCount: number;
  categoryGroupCount: number;
  categoryCount: number;
  transactionCount: number;
}

export interface LedgerAdminPort {
  initializeAsync?(): Promise<void>;
  isOnboardingCompleted(): boolean;
  commitOnboardingConfig(config: ValidatedOnboardingConfig): void;
  resetDatabase(): void;
  factoryReset(): void;
  clearTransactionsOnly(): void;
  seedDemoData(): void;
  getDiagnostics(): DiagnosticsData;
  dispose?(): void;
}
