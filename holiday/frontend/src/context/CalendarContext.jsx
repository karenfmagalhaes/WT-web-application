import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addSavedHoliday,
  deleteSavedHoliday,
  getSavedHolidays,
} from "../api/favouriteApi";
import {
  createHoliday,
  deleteHoliday,
  getHolidays,
  updateHoliday,
} from "../api/holidayApi";
import { addSuggestion, getMySuggestions } from "../api/suggestionApi";
import { useAuth } from "../hooks/useAuth";
import { DEV_AUTH_BYPASS } from "../utils/env";
import { eventToHoliday, holidayToEvent } from "../utils/holidayUtils";

export const CalendarContext = createContext(null);

const FAVORITES_STORAGE_KEY = "calendo:favorites";
const SUGGESTIONS_STORAGE_KEY = "calendo:suggestions";

const readStoredCollection = (key) => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStoredCollection = (key, items) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // ignore write failures
  }
};

const createLocalId = (prefix = "demo-event") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeTags = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string")
    return value.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
};

const buildDemoEvents = (anchorDate = new Date()) => {
  const base = new Date(anchorDate);
  base.setHours(0, 0, 0, 0);

  const make = (offsetDays, overrides = {}) => {
    const start = new Date(base);
    start.setDate(base.getDate() + offsetDays);
    return {
      _id: createLocalId(),
      title: "Holiday Event",
      description: "Demo content while the backend is offline.",
      color: "#7c6f64",
      start: start.toISOString(),
      end: start.toISOString(),
      country: "International",
      type: "Cultural",
      location: "Worldwide",
      tags: ["Holiday"],
      ...overrides,
    };
  };

  return [
    make(0, {
      title: "International Cat Day",
      description: "The first placeholder holiday so the homepage has some content.",
      color: "#4b4743",
      country: "International",
      type: "Awareness",
      location: "Worldwide",
      tags: ["Animals", "Community"],
    }),
    make(1, {
      title: "Bloomsday Picnic",
      description: "A real Irish holiday celebrated annually on June 16th.",
      color: "#8c7b6b",
      country: "Ireland",
      type: "Cultural",
      location: "Dublin",
      tags: ["Literature", "Festival"],
    }),
    make(3, {
      title: "Harvest Craft Market",
      description: "A seasonal craft market celebrating local artisans.",
      color: "#b38867",
      country: "France",
      type: "Community",
      location: "Lyon",
      tags: ["Food", "Family"],
    }),
  ];
};

const buildLocalEvent = (eventData = {}) => ({
  ...eventData,
  _id: eventData._id ?? createLocalId(),
  title: eventData.title || "Untitled Holiday",
  start: eventData.start,
  end: eventData.end,
  color: eventData.color || "#7c6f64",
  description: eventData.description || "",
  country: eventData.country || "International",
  type: eventData.type || "Cultural",
  location: eventData.location || "",
  tags: normalizeTags(eventData.tags),
});

export const CalendarProvider = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState(() =>
    DEV_AUTH_BYPASS ? buildDemoEvents(new Date()) : []
  );
  const [favorites, setFavorites] = useState(() =>
    readStoredCollection(FAVORITES_STORAGE_KEY)
  );
  const [suggestions, setSuggestions] = useState(() =>
    readStoredCollection(SUGGESTIONS_STORAGE_KEY)
  );
  const [filterOptions, setFilterOptions] = useState({ countries: [], types: [] });
  const [filters, setFilters] = useState({ country: "all", type: "all" });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const demoEventsInitialized = useRef(false);

  // Persist favourites and suggestions to localStorage in bypass mode
  useEffect(() => {
    if (DEV_AUTH_BYPASS) {
      writeStoredCollection(FAVORITES_STORAGE_KEY, favorites);
    }
  }, [favorites]);

  useEffect(() => {
    if (DEV_AUTH_BYPASS) {
      writeStoredCollection(SUGGESTIONS_STORAGE_KEY, suggestions);
    }
  }, [suggestions]);

  // Load all holidays once on mount to populate filter option lists
  useEffect(() => {
    if (DEV_AUTH_BYPASS) return;
    getHolidays({}).then(({ data }) => {
      const all = Array.isArray(data.holidays) ? data.holidays : [];
      const countries = [...new Set(all.map((h) => h.country).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      );
      const types = [...new Set(all.map((h) => h.category).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      );
      setFilterOptions({ countries, types });
    }).catch(() => {});
  }, []);

  // Load real favourites and suggestions whenever the logged-in user changes
  useEffect(() => {
    if (DEV_AUTH_BYPASS) return;

    if (!user) {
      setFavorites([]);
      setSuggestions([]);
      return;
    }

    getSavedHolidays()
      .then(({ data }) => {
        const normalized = (data.savedHolidays ?? []).map((f) => ({
          favouriteId: f._id,
          ...holidayToEvent(f.holiday),
        }));
        setFavorites(normalized);
      })
      .catch(() => {});

    getMySuggestions()
      .then(({ data }) => {
        setSuggestions(data.suggestions ?? []);
      })
      .catch(() => {});
  }, [user]);

  const syncFavoriteSnapshot = useCallback((nextEvent) => {
    if (!nextEvent?._id) return;
    setFavorites((prev) =>
      prev.map((f) =>
        f._id === nextEvent._id
          ? { ...f, ...buildLocalEvent({ ...f, ...nextEvent }), favouriteId: f.favouriteId, favoritedAt: f.favoritedAt }
          : f
      )
    );
  }, []);

  const loadEvents = useCallback(async (start) => {
    if (DEV_AUTH_BYPASS) {
      setLoading(true);
      setError("");
      setEvents((prev) => {
        if (demoEventsInitialized.current) return prev;
        demoEventsInitialized.current = true;
        return prev.length > 0 ? prev : buildDemoEvents(start);
      });
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError("");

    try {
      const viewDate = start ? new Date(start) : new Date();
      const month = viewDate.getMonth() + 1;
      const viewYear = viewDate.getFullYear();
      const { data } = await getHolidays({ month });
      const raw = Array.isArray(data.holidays) ? data.holidays : [];
      setEvents(
        raw.map((h) => {
          const d = new Date(h.date);
          d.setFullYear(viewYear);
          return holidayToEvent({ ...h, date: d.toISOString() });
        }),
      );
    } catch (loadError) {
      setError(loadError.response?.data?.message ?? loadError.message);
      throw loadError;
    } finally {
      setLoading(false);
    }
  }, []);

  const addEvent = useCallback(async (eventData) => {
    setError("");

    try {
      if (DEV_AUTH_BYPASS) {
        const local = buildLocalEvent(eventData);
        setEvents((prev) => [...prev, local]);
        return local;
      }

      const { data } = await createHoliday(eventToHoliday(eventData));
      const event = holidayToEvent(data.holiday);
      setEvents((prev) => [...prev, event]);
      return event;
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
      throw err;
    }
  }, []);

  const editEvent = useCallback(
    async (id, eventData) => {
      setError("");

      try {
        if (DEV_AUTH_BYPASS) {
          let updated = null;
          setEvents((prev) =>
            prev.map((e) => {
              if (e._id !== id) return e;
              updated = buildLocalEvent({ ...e, ...eventData, _id: id });
              return updated;
            })
          );
          syncFavoriteSnapshot(updated);
          return updated;
        }

        const { data } = await updateHoliday(id, eventToHoliday(eventData));
        const event = holidayToEvent(data.holiday);
        setEvents((prev) => prev.map((e) => (e._id === id ? event : e)));
        syncFavoriteSnapshot(event);
        return event;
      } catch (err) {
        setError(err.response?.data?.message ?? err.message);
        throw err;
      }
    },
    [syncFavoriteSnapshot]
  );

  const removeEvent = useCallback(async (id) => {
    setError("");

    try {
      if (!DEV_AUTH_BYPASS) {
        await deleteHoliday(id);
      }
      setEvents((prev) => prev.filter((e) => e._id !== id));
      setFavorites((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
      throw err;
    }
  }, []);

  const moveEvent = useCallback(
    async (id, newStart, newEnd) => {
      setError("");

      try {
        if (DEV_AUTH_BYPASS) {
          let updated = null;
          setEvents((prev) =>
            prev.map((e) => {
              if (e._id !== id) return e;
              updated = { ...e, start: newStart, end: newEnd };
              return updated;
            })
          );
          syncFavoriteSnapshot(updated);
          return updated;
        }

        const { data } = await updateHoliday(id, {
          date: newStart,
          month: new Date(newStart).getMonth() + 1,
        });
        const event = holidayToEvent(data.holiday);
        setEvents((prev) => prev.map((e) => (e._id === id ? event : e)));
        syncFavoriteSnapshot(event);
        return event;
      } catch (err) {
        setError(err.response?.data?.message ?? err.message);
        throw err;
      }
    },
    [syncFavoriteSnapshot]
  );

  const toggleFavorite = useCallback(async (eventData) => {
    if (!eventData?._id) return;

    const existing = favorites.find((f) => f._id === eventData._id);

    if (DEV_AUTH_BYPASS) {
      setFavorites((prev) =>
        existing
          ? prev.filter((f) => f._id !== eventData._id)
          : [{ ...buildLocalEvent(eventData), favoritedAt: new Date().toISOString() }, ...prev]
      );
      return;
    }

    try {
      if (existing) {
        await deleteSavedHoliday(existing.favouriteId);
        setFavorites((prev) => prev.filter((f) => f._id !== eventData._id));
      } else {
        const { data } = await addSavedHoliday(eventData._id);
        const normalized = {
          favouriteId: data.savedHoliday._id,
          ...holidayToEvent(data.savedHoliday.holiday),
        };
        setFavorites((prev) => [normalized, ...prev]);
      }
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
    }
  }, [favorites]);

  const isFavorite = useCallback(
    (eventId) => favorites.some((f) => f._id === eventId),
    [favorites]
  );

  const submitSuggestion = useCallback(async (suggestionData) => {
    if (DEV_AUTH_BYPASS) {
      const local = {
        _id: createLocalId("suggestion"),
        name: suggestionData.name?.trim() || "Untitled holiday",
        country: suggestionData.country?.trim() || "",
        date: suggestionData.date || new Date().toISOString(),
        category: suggestionData.category || "Other",
        description: suggestionData.description?.trim() || "",
        referenceLink: suggestionData.referenceLink?.trim() || "",
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      setSuggestions((prev) => [local, ...prev]);
      return local;
    }

    try {
      const { data } = await addSuggestion(suggestionData);
      setSuggestions((prev) => [data.suggestion, ...prev]);
      return data.suggestion;
    } catch (err) {
      setError(err.response?.data?.message ?? err.message);
      throw err;
    }
  }, []);

  const openModal = useCallback((event = null) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedEvent(null);
    setIsModalOpen(false);
  }, []);

  const setCountryFilter = useCallback((country) => {
    setFilters((prev) => ({ ...prev, country }));
  }, []);

  const setTypeFilter = useCallback((type) => {
    setFilters((prev) => ({ ...prev, type }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ country: "all", type: "all" });
  }, []);

  const countries = filterOptions.countries;
  const types = filterOptions.types;

  const filteredEvents = useMemo(
    () =>
      events.filter((e) => {
        if (!e) return false;
        const matchesCountry = filters.country === "all" || e.country === filters.country;
        const matchesType = filters.type === "all" || e.type === filters.type;
        return matchesCountry && matchesType;
      }),
    [events, filters]
  );

  const value = useMemo(
    () => ({
      events: filteredEvents,
      allEvents: events,
      favorites,
      suggestions,
      filters,
      countries,
      types,
      currentDate,
      setCurrentDate,
      view,
      setView,
      selectedEvent,
      isModalOpen,
      loading,
      error,
      loadEvents,
      addEvent,
      editEvent,
      removeEvent,
      moveEvent,
      toggleFavorite,
      isFavorite,
      submitSuggestion,
      setCountryFilter,
      setTypeFilter,
      clearFilters,
      openModal,
      closeModal,
    }),
    [
      filteredEvents,
      events,
      favorites,
      suggestions,
      filters,
      filterOptions,
      currentDate,
      view,
      selectedEvent,
      isModalOpen,
      loading,
      error,
      loadEvents,
      addEvent,
      editEvent,
      removeEvent,
      moveEvent,
      toggleFavorite,
      isFavorite,
      submitSuggestion,
      setCountryFilter,
      setTypeFilter,
      clearFilters,
      openModal,
      closeModal,
    ]
  );

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};
