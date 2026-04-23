export const formatMonthYear = (date) =>
  new Date(date).toLocaleDateString("en-IE", { month: "long", year: "numeric" });

export const startOfDay = (date) => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

export const endOfDay = (date) => {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
};

export const getMonthRange = (date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  return { start, end };
};

export const getWeekRange = (date) => {
  const baseDate = startOfDay(date);
  const day = baseDate.getDay();
  const start = new Date(baseDate);

  start.setDate(baseDate.getDate() - day);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export const getDayRange = (date) => ({
  start: startOfDay(date),
  end: endOfDay(date),
});

export const isSameDay = (left, right) =>
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate();

export const isSameMonth = (left, right) =>
  left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();

export const getDaysInMonth = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const first = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  return { firstDayOfWeek: first, totalDays: total };
};

export const getMonthGrid = (date) => {
  const { firstDayOfWeek } = getDaysInMonth(date);
  const firstVisibleDate = new Date(date.getFullYear(), date.getMonth(), 1 - firstDayOfWeek);

  return Array.from({ length: 42 }, (_, index) => {
    const nextDate = new Date(firstVisibleDate);
    nextDate.setDate(firstVisibleDate.getDate() + index);
    return nextDate;
  });
};

export const getWeekDates = (date) => {
  const { start } = getWeekRange(date);

  return Array.from({ length: 7 }, (_, index) => {
    const nextDate = new Date(start);
    nextDate.setDate(start.getDate() + index);
    return nextDate;
  });
};

export const formatDayHeading = (date) =>
  new Date(date).toLocaleDateString("en-IE", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

export const formatWeekday = (date) =>
  new Date(date).toLocaleDateString("en-IE", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

export const formatClockTime = (date = new Date()) =>
  new Date(date).toLocaleTimeString("en-IE", {
    hour: "numeric",
    minute: "2-digit",
  });

export const formatTimeRange = (start, end) => {
  const format = (value) =>
    new Date(value).toLocaleTimeString("en-IE", {
      hour: "numeric",
      minute: "2-digit",
    });

  if (!start && !end) {
    return "All day";
  }

  if (!end) {
    return format(start);
  }

  return `${format(start)} - ${format(end)}`;
};

export const toDateTimeLocalValue = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const eventOccursOnDate = (event, date) => {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end ?? event.start);

  return eventStart <= dayEnd && eventEnd >= dayStart;
};
