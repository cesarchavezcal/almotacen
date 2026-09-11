# Design & Architecture: Design System Modernization

## Architecture Overview
The design system architecture establishes `@/src/theme` as the single authoritative layer for all atomic tokens (colors, spacing, radius, typography, shadows). All visual and interactive components in `@/src/components` depend strictly on these tokens.

```
┌──────────────────────────────────────────────────────────┐
│                       @/src/theme                        │
│  ┌────────────┐ ┌────────────┐ ┌─────────┐ ┌──────────┐ │
│  │   colors   │ │ typography │ │ spacing │ │  radius  │ │
│  └────────────┘ └────────────┘ └─────────┘ └──────────┘ │
│  ┌────────────────────────────────────────────────────┐  │
│  │           shadows (elevation & iOS depth)          │  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│                     @/src/components                     │
│  ┌───────────┐ ┌──────────────────┐ ┌─────────────────┐  │
│  │   Card    │ │      Button      │ │ TransactionRow  │  │
│  └───────────┘ └──────────────────┘ └─────────────────┘  │
│  ┌───────────────────┐ ┌──────────────────────────────┐  │
│  │   AppleCardFace   │ │       EnvelopePassFace       │  │
│  └───────────────────┘ └──────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Token Specifications

### 1. Shadows & Depth (`src/theme/shadows.ts`)
```ts
export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  hero: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;
```

### 2. Surface Color Extensions (`src/theme/colors.ts`)
- Retain strict OLED black `#000000` canvas.
- Ensure `surfaceCard: '#1C1C1E'` and `surfaceCardSubtle: '#2C2C2E'` are consumed uniformly.
- Add interactive state tokens:
  - `pressedOverlay: 'rgba(255, 255, 255, 0.08)'`
  - `pressedOverlayDark: 'rgba(0, 0, 0, 0.2)'`

### 3. Component Refactoring Contracts

#### `Card.tsx`
- Remove all hardcoded white background values (`#FFFFFF`).
- `outline` variant: `backgroundColor: colors.surfaceCard`, `borderColor: colors.border`.
- `elevated` variant: `backgroundColor: colors.surfaceCard`, applies `shadows.card`.
- `hero` variant: `backgroundColor: colors.surfaceCard`, applies `shadows.hero`.

#### `Button.tsx`
- Add `loading?: boolean` prop.
- Render `ActivityIndicator` (color: `colors.onPrimary` for primary, `colors.label` for secondary).
- Set `accessibilityRole="button"`.
- Set `accessibilityState={{ disabled: Boolean(disabled || loading), busy: Boolean(loading) }}`.
- Replace arbitrary font sizes with `typography` token styles.

#### Financial Pass Faces (`AppleCardFace`, `CreditCardFace`, `EnvelopePassFace`, `TransactionRow`)
- Provide comprehensive `accessibilityLabel` formatting.
- Map row paddings to `spacing` tokens (`spacing.md`, `spacing.sm`).
