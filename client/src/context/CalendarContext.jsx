import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  updateEvent,
  updateEventDate,
} from "../api/eventsApi";
import { DEV_AUTH_BYPASS } from "../utils/env";

export const CalendarContext = createContext(null);

const FAVORITES_STORAGE_KEY = "calendo:favorites";
const SUGGESTIONS_STORAGE_KEY = "calendo:suggestions";

const readStoredCollection = (key) => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

const writeStoredCollection = (key, items) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Ignore storage write failures in private windows or locked environments.
  }
};

const createLocalId = (prefix = "demo-event") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeTags = (value) => {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
};

const buildDemoEvents = (anchorDate = new Date()) => {
  const baseDate = new Date(anchorDate);
  baseDate.setHours(0, 0, 0, 0);

  const createDemoEvent = (offsetDays, hour, durationHours, overrides = {}) => {
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() + offsetDays);
    start.setHours(hour, 0, 0, 0);

    const end = new Date(start);
    end.setHours(start.getHours() + durationHours);

    return {
      _id: createLocalId(),
      title: "Holiday Event",
      description: "Demo content while the backend is offline.",
      color: "#7c6f64",
      start: start.toISOString(),
      end: end.toISOString(),
      country: "International",
      type: "Cultural",
      location: "Worldwide",
      tags: ["Holiday"],
      ...overrides,
    };
  };

  return [
    createDemoEvent(0, 10, 2, {
      title: "International Cat Day",
      description:
        "The  first featured placeholder holiday so the homepage has some content.",
      color: "#4b4743",
      country: "International",
      type: "Awareness",
      location: "Worldwide",
      tags: ["Animals", "Community"],
    }),
    createDemoEvent(1, 12, 1, {
      title: "Bloomsday Picnic",
      description:
        "The second placeholder, this one is a real irish holiday apparently but I have never heard of it before.",
      color: "#8c7b6b",
      country: "Ireland",
      type: "Cultural",
      location: "Dublin",
      tags: ["Literature", "Festival"],
    }),
    createDemoEvent(3, 9, 1, {
      title: "Harvest Craft Market",
      description:
        "The third placeholder holiday, this one is from France 'oui oui, la bagettue'.",
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
  color: eventData.color || "#3b82f6",
  description: eventData.description || "",
  recurrence: eventData.recurrence || null,
  country: eventData.country || "International",
  type: eventData.type || "Cultural",
  location: eventData.location || "",
  tags: normalizeTags(eventData.tags),
});

export const CalendarProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [favorites, setFavorites] = useState(() =>
    readStoredCollection(FAVORITES_STORAGE_KEY),
  );
  const [suggestions, setSuggestions] = useState(() =>
    readStoredCollection(SUGGESTIONS_STORAGE_KEY),
  );
  const [filters, setFilters] = useState({ country: "all", type: "all" });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const demoEventsInitialized = useRef(false);

  useEffect(() => {
    writeStoredCollection(FAVORITES_STORAGE_KEY, favorites);
  }, [favorites]);

  useEffect(() => {
    writeStoredCollection(SUGGESTIONS_STORAGE_KEY, suggestions);
  }, [suggestions]);

  const syncFavoriteSnapshot = useCallback((nextEvent) => {
    if (!nextEvent?._id) {
      return;
    }

    setFavorites((prev) =>
      prev.map((favorite) =>
        favorite._id === nextEvent._id
          ? {
              ...favorite,
              ...buildLocalEvent({ ...favorite, ...nextEvent }),
              favoritedAt: favorite.favoritedAt,
            }
          : favorite,
      ),
    );
  }, []);

  const loadEvents = useCallback(async (start, end) => {
    if (DEV_AUTH_BYPASS) {
      setLoading(true);
      setError("");
      setEvents((prev) => {
        if (demoEventsInitialized.current) {
          return prev;
        }

        demoEventsInitialized.current = true;
        return prev.length > 0 ? prev : buildDemoEvents(start);
      });
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await fetchEvents({ start, end });
      const raw = Array.isArray(data) ? data : (data?.events ?? []);
      setEvents(raw.filter((item) => item != null && typeof item === "object"));
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
        const localEvent = buildLocalEvent(eventData);
        setEvents((prev) => [...prev, localEvent]);
        return localEvent;
      }

      const { data } = await createEvent(eventData);
      setEvents((prev) => [...prev, data]);
      return data;
    } catch (createError) {
      setError(createError.response?.data?.message ?? createError.message);
      throw createError;
    }
  }, []);

  const editEvent = useCallback(
    async (id, eventData) => {
      setError("");

      try {
        if (DEV_AUTH_BYPASS) {
          let updatedEvent = null;

          setEvents((prev) =>
            prev.map((event) => {
              if (event._id !== id) {
                return event;
              }

              updatedEvent = buildLocalEvent({
                ...event,
                ...eventData,
                _id: id,
              });
              return updatedEvent;
            }),
          );

          syncFavoriteSnapshot(updatedEvent);
          return updatedEvent;
        }

        const { data } = await updateEvent(id, eventData);
        setEvents((prev) =>
          prev.map((event) => (event._id === id ? data : event)),
        );
        syncFavoriteSnapshot(data);
        return data;
      } catch (updateError) {
        setError(updateError.response?.data?.message ?? updateError.message);
        throw updateError;
      }
    },
    [syncFavoriteSnapshot],
  );

  const removeEvent = useCallback(async (id) => {
    setError("");

    try {
      if (DEV_AUTH_BYPASS) {
        setEvents((prev) => prev.filter((event) => event._id !== id));
        setFavorites((prev) => prev.filter((favorite) => favorite._id !== id));
        return;
      }

      await deleteEvent(id);
      setEvents((prev) => prev.filter((event) => event._id !== id));
      setFavorites((prev) => prev.filter((favorite) => favorite._id !== id));
    } catch (deleteError) {
      setError(deleteError.response?.data?.message ?? deleteError.message);
      throw deleteError;
    }
  }, []);

  const moveEvent = useCallback(
    async (id, newStart, newEnd) => {
      setError("");

      try {
        if (DEV_AUTH_BYPASS) {
          let updatedEvent = null;

          setEvents((prev) =>
            prev.map((event) => {
              if (event._id !== id) {
                return event;
              }

              updatedEvent = { ...event, start: newStart, end: newEnd };
              return updatedEvent;
            }),
          );

          syncFavoriteSnapshot(updatedEvent);
          return updatedEvent;
        }

        const { data } = await updateEventDate(id, {
          start: newStart,
          end: newEnd,
        });
        setEvents((prev) =>
          prev.map((event) => (event._id === id ? data : event)),
        );
        syncFavoriteSnapshot(data);
        return data;
      } catch (moveError) {
        setError(moveError.response?.data?.message ?? moveError.message);
        throw moveError;
      }
    },
    [syncFavoriteSnapshot],
  );

  const toggleFavorite = useCallback((eventData) => {
    if (!eventData?._id) {
      return;
    }

    setFavorites((prev) => {
      const alreadyFavorite = prev.some(
        (favorite) => favorite._id === eventData._id,
      );

      if (alreadyFavorite) {
        return prev.filter((favorite) => favorite._id !== eventData._id);
      }

      return [
        {
          ...buildLocalEvent(eventData),
          favoritedAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  }, []);

  const isFavorite = useCallback(
    (eventId) => favorites.some((favorite) => favorite._id === eventId),
    [favorites],
  );

  const submitSuggestion = useCallback((suggestionData) => {
    const nextSuggestion = {
      _id: createLocalId("suggestion"),
      name: suggestionData.name?.trim() || "Anonymous",
      holidayName: suggestionData.holidayName?.trim() || "Untitled holiday",
      description: suggestionData.description?.trim() || "",
      referenceLink: suggestionData.referenceLink?.trim() || "",
      status: suggestionData.status || "pending",
      createdAt: new Date().toISOString(),
    };

    setSuggestions((prev) => [nextSuggestion, ...prev]);
    return nextSuggestion;
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

  const countries = useMemo(
    () =>
      [...new Set(events.map((event) => event?.country).filter(Boolean))].sort(
        (left, right) => left.localeCompare(right),
      ),
    [events],
  );

  const types = useMemo(
    () =>
      [...new Set(events.map((event) => event?.type).filter(Boolean))].sort(
        (left, right) => left.localeCompare(right),
      ),
    [events],
  );

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        if (!event) {
          return false;
        }

        const matchesCountry =
          filters.country === "all" || event.country === filters.country;
        const matchesType =
          filters.type === "all" || event.type === filters.type;

        return matchesCountry && matchesType;
      }),
    [events, filters],
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
      countries,
      types,
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
    ],
  );

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};
