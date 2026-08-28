import type { View } from "react-native";

export interface GuideTargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type MeasurableView = View & {
  measureLayout: (
    relativeToNativeNode: View,
    onSuccess: (x: number, y: number, width: number, height: number) => void,
    onFail?: () => void,
  ) => void;
};

export function measureGuideTarget(
  target: View,
  root: View | null,
  topInset: number,
  onMeasured: (rect: GuideTargetRect) => void,
): void {
  const fallback = () => {
    target.measureInWindow((x, y, width, height) => {
      onMeasured({ x, y: y + topInset, width, height });
    });
  };

  if (!root) {
    fallback();
    return;
  }

  try {
    (target as MeasurableView).measureLayout(
      root,
      (x, y, width, height) => onMeasured({ x, y, width, height }),
      fallback,
    );
  } catch {
    fallback();
  }
}