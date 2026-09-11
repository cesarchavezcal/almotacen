# Ticket 04: Financial Card & Row Accessibility Summaries

## Scenario Binding
- `SCEN-043`: Transaction Row Accessibility Announcement
- `SCEN-044`: Credit Card Face Accessibility Summary
- `SCEN-045`: Envelope Pass Face Accessibility Tree

## Description
Refactor `TransactionRow.tsx`, `AppleCardFace.tsx`, `CreditCardFace.tsx`, and `EnvelopePassFace.tsx` to provide comprehensive screen reader summaries, proper accessibility roles, and tokenized spacing. Write tests in `src/components/__tests__/TransactionRow.test.tsx` and `src/components/__tests__/CardFaces.test.tsx`.

## Acceptance Criteria
1. `TransactionRow` provides formatted `accessibilityLabel` with merchant, amount, date, and category.
2. `CreditCardFace` and `AppleCardFace` provide `accessibilityLabel` with issuer, balance, and last 4.
3. `EnvelopePassFace` header pressable announces name, balance, and status badge.
4. Unit tests pass cleanly.
