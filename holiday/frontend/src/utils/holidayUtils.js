const CATEGORY_COLORS = {
  Public: "#5d7a5d",
  Religious: "#7a5d6a",
  Cultural: "#6a6a7a",
  National: "#7a6a5d",
  Seasonal: "#5d7a7a",
  International: "#7a7a5d",
  Other: "#7c6f64",
};

export const holidayToEvent = (holiday) => ({
  _id: holiday._id,
  title: holiday.name,
  name: holiday.name,
  start: holiday.date,
  end: holiday.date,
  country: holiday.country,
  type: holiday.category,
  category: holiday.category,
  description: holiday.description || "",
  color: CATEGORY_COLORS[holiday.category] || "#7c6f64",
  month: holiday.month,
  date: holiday.date,
});

export const eventToHoliday = (event) => {
  const date = new Date(event.date || event.start);
  return {
    name: (event.name || event.title || "").trim(),
    country: (event.country || "").trim(),
    date: date.toISOString(),
    month: date.getMonth() + 1,
    category: event.category || event.type || "Other",
    description: event.description ? event.description.trim() : undefined,
  };
};
