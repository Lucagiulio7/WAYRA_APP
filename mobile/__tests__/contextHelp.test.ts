import { calculateContextHelpPlacement } from "@/utils/contextHelpPlacement";

const base = {
  screenWidth: 390,
  screenHeight: 844,
  cardWidth: 360,
  cardHeight: 260,
  safeTop: 47,
  safeBottom: 34,
};

describe("context help placement", () => {
  it("places the card below an element near the top", () => {
    const placement = calculateContextHelpPlacement({ ...base, anchor: { x: 195, y: 120 } });
    expect(placement.side).toBe("below");
    expect(placement.top).toBeGreaterThan(120);
  });

  it("places the card above an element near the bottom", () => {
    const placement = calculateContextHelpPlacement({ ...base, anchor: { x: 195, y: 760 } });
    expect(placement.side).toBe("above");
    expect(placement.top + base.cardHeight).toBeLessThan(760);
  });

  it("never leaves the horizontal viewport", () => {
    for (const x of [0, 390]) {
      const placement = calculateContextHelpPlacement({ ...base, anchor: { x, y: 400 } });
      expect(placement.left).toBeGreaterThanOrEqual(12);
      expect(placement.left + base.cardWidth).toBeLessThanOrEqual(base.screenWidth - 12);
    }
  });

  it("keeps the fallback above the bottom safe area", () => {
    const placement = calculateContextHelpPlacement({ ...base, anchor: null });
    expect(placement.top + base.cardHeight).toBeLessThanOrEqual(base.screenHeight - base.safeBottom - 12);
  });
});
