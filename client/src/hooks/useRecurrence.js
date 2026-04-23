import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_RULE,
  buildRRuleString,
  normalizeRecurrenceRule,
} from "../utils/recurrenceUtils";

export const useRecurrence = (initial = DEFAULT_RULE) => {
  const [rule, setRule] = useState(() => normalizeRecurrenceRule(initial));

  useEffect(() => {
    setRule(normalizeRecurrenceRule(initial));
  }, [initial]);

  const update = useCallback((field, value) => {
    setRule((prev) => ({ ...prev, [field]: value }));
  }, []);

  const reset = useCallback(() => {
    setRule(normalizeRecurrenceRule(DEFAULT_RULE));
  }, []);

  const toRRuleString = useCallback(() => buildRRuleString(rule), [rule]);

  return { rule, update, reset, toRRuleString };
};
