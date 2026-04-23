import { useContext } from "react";
import { CalendarContext } from "../context/CalendarContext";

export const useEvents = () => {
  const context = useContext(CalendarContext);

  if (!context) {
    throw new Error("useEvents must be used inside CalendarProvider.");
  }

  return {
    events: context.events,
    allEvents: context.allEvents,
    favorites: context.favorites,
    suggestions: context.suggestions,
    filters: context.filters,
    countries: context.countries,
    types: context.types,
    addEvent: context.addEvent,
    editEvent: context.editEvent,
    removeEvent: context.removeEvent,
    moveEvent: context.moveEvent,
    toggleFavorite: context.toggleFavorite,
    isFavorite: context.isFavorite,
    submitSuggestion: context.submitSuggestion,
    setCountryFilter: context.setCountryFilter,
    setTypeFilter: context.setTypeFilter,
    clearFilters: context.clearFilters,
  };
};
