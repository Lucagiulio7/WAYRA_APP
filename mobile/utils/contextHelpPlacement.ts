export type ContextHelpAnchor = { x: number; y: number };

export type ContextHelpPlacement = {
  left: number;
  top: number;
  side: "above" | "below" | "center";
};

export function calculateContextHelpPlacement({
  screenWidth,
  screenHeight,
  cardWidth,
  cardHeight,
  anchor,
  safeTop = 0,
  safeBottom = 0,
}: {
  screenWidth: number;
  screenHeight: number;
  cardWidth: number;
  cardHeight: number;
  anchor: ContextHelpAnchor | null;
  safeTop?: number;
  safeBottom?: number;
}): ContextHelpPlacement {
  const margin = 12;
  const gap = 16;
  const minTop = safeTop + margin;
  const maxTop = Math.max(minTop, screenHeight - safeBottom - cardHeight - margin);
  const maxLeft = Math.max(margin, screenWidth - cardWidth - margin);

  if (!anchor) {
    return {
      left: Math.max(margin, Math.min(maxLeft, (screenWidth - cardWidth) / 2)),
      top: maxTop,
      side: "center",
    };
  }

  const left = Math.max(margin, Math.min(maxLeft, anchor.x - cardWidth / 2));
  const fitsBelow = anchor.y + gap + cardHeight <= screenHeight - safeBottom - margin;
  const fitsAbove = anchor.y - gap - cardHeight >= minTop;

  if (fitsBelow) return { left, top: anchor.y + gap, side: "below" };
  if (fitsAbove) return { left, top: anchor.y - gap - cardHeight, side: "above" };
  return {
    left,
    top: Math.max(minTop, Math.min(maxTop, anchor.y - cardHeight / 2)),
    side: "center",
  };
}
