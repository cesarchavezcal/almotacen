import { describe, it, expect } from '@jest/globals';
import { shadows } from '../shadows';
import { colors } from '../colors';

describe('Theme Shadows & Surface Overlays (SCEN-039, SCEN-046)', () => {
  it('exports valid shadow presets with iOS and Android elevation properties', () => {
    expect(shadows).toBeDefined();
    expect(shadows.card).toBeDefined();
    expect(shadows.hero).toBeDefined();
    expect(shadows.floating).toBeDefined();

    // Verify card shadow structure
    expect(shadows.card.shadowColor).toBe('#000');
    expect(shadows.card.shadowOffset).toEqual({ width: 0, height: 4 });
    expect(shadows.card.shadowOpacity).toBeGreaterThan(0);
    expect(shadows.card.shadowRadius).toBeGreaterThan(0);
    expect(shadows.card.elevation).toBeGreaterThanOrEqual(2);

    // Verify hero shadow structure
    expect(shadows.hero.elevation).toBeGreaterThan(shadows.card.elevation);
  });

  it('exports interactive state alpha overlays in colors', () => {
    expect(colors.pressedOverlay).toBeDefined();
    expect(colors.pressedOverlayDark).toBeDefined();
  });
});
