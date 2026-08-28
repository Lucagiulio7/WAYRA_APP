import type { View } from "react-native";
import { measureGuideTarget } from "@/utils/guideMeasurement";

describe("measureGuideTarget", () => {
  it("uses coordinates relative to the screen root without adding the safe inset twice", () => {
    const onMeasured = jest.fn();
    const root = {} as View;
    const target = {
      measureLayout: (_root: View, success: (x: number, y: number, width: number, height: number) => void) => {
        success(16, 32, 34, 34);
      },
      measureInWindow: jest.fn(),
    } as unknown as View;

    measureGuideTarget(target, root, 24, onMeasured);

    expect(onMeasured).toHaveBeenCalledWith({ x: 16, y: 32, width: 34, height: 34 });
  });

  it("adds the top inset only to the window-measurement fallback", () => {
    const onMeasured = jest.fn();
    const target = {
      measureInWindow: (success: (x: number, y: number, width: number, height: number) => void) => {
        success(16, 8, 34, 34);
      },
    } as unknown as View;

    measureGuideTarget(target, null, 24, onMeasured);

    expect(onMeasured).toHaveBeenCalledWith({ x: 16, y: 32, width: 34, height: 34 });
  });
});