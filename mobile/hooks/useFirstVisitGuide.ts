import { useCallback, useEffect, useRef, useState } from "react";
import { InteractionManager } from "react-native";

import type { ContextHelpContent, ContextHelpController, GuidedContextHelp } from "@/components/ContextHelp";
import {
  hasCompletedFirstVisitGuide,
  markFirstVisitGuideCompleted,
} from "@/services/firstVisitGuideStorage";

export type FirstVisitGuideStep = {
  content: ContextHelpContent;
  afterAcknowledge?: () => void;
};

type Options = {
  guideId: string;
  steps: FirstVisitGuideStep[];
  controller: ContextHelpController;
  enabled?: boolean;
};

function sameContent(left: ContextHelpContent | null, right: ContextHelpContent): boolean {
  return Boolean(left && left.title === right.title && left.body === right.body);
}

export function useFirstVisitGuide({ guideId, steps, controller, enabled = true }: Options) {
  const [mandatory, setMandatory] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const startedRef = useRef(false);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const { enter, exit, close } = controller;

  useEffect(() => {
    if (!enabled) {
      startedRef.current = false;
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      const beginGuide = () => {
        if (cancelled || stepsRef.current.length === 0) return;
        setStepIndex(0);
        setMandatory(true);
        enter();
      };
      void hasCompletedFirstVisitGuide(guideId)
        .then((completed) => {
          if (!completed) beginGuide();
        })
        .catch(beginGuide);
    });

    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [enabled, enter, guideId]);

  const acknowledge = useCallback((selected: ContextHelpContent | null) => {
    const current = stepsRef.current[stepIndex];
    if (!current || !sameContent(selected, current.content)) {
      close();
      return;
    }

    current.afterAcknowledge?.();
    close();

    if (stepIndex < stepsRef.current.length - 1) {
      setStepIndex((value) => value + 1);
      return;
    }

    setMandatory(false);
    exit();
    void markFirstVisitGuideCompleted(guideId);
  }, [close, exit, guideId, stepIndex]);

  const guided: GuidedContextHelp | undefined = mandatory && steps[stepIndex]
    ? {
        index: stepIndex,
        total: steps.length,
        expected: steps[stepIndex].content,
        onAcknowledge: acknowledge,
      }
    : undefined;

  return {
    mandatory,
    guided,
    onHelpPress: mandatory ? (() => {}) : controller.toggle,
  };
}
