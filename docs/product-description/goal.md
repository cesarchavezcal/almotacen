# Product Description Drafting Guidelines

## 1. Outside-In Behavioral Perspective
- Describe what the user perceives, hears, sees, and touches.
- Never mention internal database schemas, table names, SQL queries, or React state variables in behavioral descriptions.
- Technical mechanisms appear exclusively in blockquotes prefixed with `> Technical note:`.

## 2. Mandatory 5-Family Interrupt Checklist
Every feature flow must explicitly address:
1. *Family 1: Explicit Abort* (Escape key, Cancel button, back swipe).
2. *Family 2: User Distraction* (Switching app tabs, incoming phone call, backgrounding app).
3. *Family 3: Clean Complete Events* (Submit button tap, return key press).
4. *Family 4: Environment & Network Failures* (Offline status, airplane mode, slow connection).
5. *Family 5: Target Mutation* (Category or account deleted in background, balance altered).
