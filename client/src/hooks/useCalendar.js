import { useContext } from "react";
import { CalendarContext } from "../context/CalendarContext";

export const useCalendar = () => {
  const context = useContext(CalendarContext);

  if (!context) {
    throw new Error("useCalendar must be used inside CalendarProvider.");
  }

  return context;
};
