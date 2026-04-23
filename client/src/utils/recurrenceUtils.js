export const DEFAULT_RULE = {
  freq: "none",
  interval: 1,
  until: "",
  days: [],
};

const cloneDefaultRule = () => ({
  ...DEFAULT_RULE,
  days: [...DEFAULT_RULE.days],
});

export const parseRRuleString = (value) => {
  if (!value || typeof value !== "string") {
    return cloneDefaultRule();
  }

  const fields = value.split(";").reduce((accumulator, part) => {
    const [key, fieldValue] = part.split("=");

    if (key && fieldValue) {
      accumulator[key] = fieldValue;
    }

    return accumulator;
  }, {});

  return {
    freq: fields.FREQ?.toLowerCase() ?? "none",
    interval: Number(fields.INTERVAL ?? 1),
    until: fields.UNTIL ? fields.UNTIL.slice(0, 10) : "",
    days: fields.BYDAY ? fields.BYDAY.split(",").filter(Boolean) : [],
  };
};

export const normalizeRecurrenceRule = (value) => {
  if (!value) {
    return cloneDefaultRule();
  }

  if (typeof value === "string") {
    return parseRRuleString(value);
  }

  return {
    freq: value.freq ?? "none",
    interval: Number(value.interval ?? 1),
    until: value.until ?? "",
    days: Array.isArray(value.days) ? value.days : [],
  };
};

export const buildRRuleString = (rule) => {
  if (!rule || rule.freq === "none") {
    return null;
  }

  let result = `FREQ=${rule.freq.toUpperCase()};INTERVAL=${rule.interval}`;

  if (rule.until) {
    result += `;UNTIL=${rule.until}`;
  }

  if (rule.days?.length) {
    result += `;BYDAY=${rule.days.join(",")}`;
  }

  return result;
};
