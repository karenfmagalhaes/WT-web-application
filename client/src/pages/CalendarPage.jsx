import { useEffect, useMemo, useState } from "react";
import CalendarHeader from "../components/calendar/CalendarHeader";
import DayView from "../components/calendar/DayView";
import MonthView from "../components/calendar/MonthView";
import WeekView from "../components/calendar/WeekView";
import EventModal from "../components/events/EventModal";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import { useAuth } from "../hooks/useAuth";
import { useCalendar } from "../hooks/useCalendar";
import { useEvents } from "../hooks/useEvents";
import {
  formatDayHeading,
  formatMonthYear,
  getDayRange,
  getMonthRange,
  getWeekRange,
  isSameDay,
} from "../utils/dateUtils";

const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const CalendarPage = () => {
  const {
    currentDate,
    setCurrentDate,
    setView,
    view,
    loading,
    error,
    loadEvents,
    openModal,
  } = useCalendar();
  const { user } = useAuth();
  const {
    events,
    allEvents,
    countries,
    types,
    filters,
    setCountryFilter,
    setTypeFilter,
    clearFilters,
    submitSuggestion,
  } = useEvents();
  const [dateSearch, setDateSearch] = useState({ month: "", day: "" });
  const [holidayQuery, setHolidayQuery] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [requestForm, setRequestForm] = useState({
    name: user?.name || "",
    holidayName: "",
    description: "",
    referenceLink: "",
  });
  const [requestStatus, setRequestStatus] = useState("");

  useEffect(() => {
    let range;

    if (view === "month") {
      const monthRange = getMonthRange(currentDate);
      const todayRange = getDayRange(new Date());
      range = {
        start:
          monthRange.start < todayRange.start
            ? monthRange.start
            : todayRange.start,
        end: monthRange.end > todayRange.end ? monthRange.end : todayRange.end,
      };
    } else if (view === "week") {
      range = getWeekRange(currentDate);
    } else {
      range = getDayRange(currentDate);
    }

    loadEvents(range.start, range.end).catch(() => {});
  }, [currentDate, view, loadEvents]);

  useEffect(() => {
    setDateSearch({
      month: String(currentDate.getMonth() + 1),
      day: String(currentDate.getDate()),
    });
  }, [currentDate]);

  useEffect(() => {
    setRequestForm((prev) => ({
      ...prev,
      name: prev.name || user?.name || "",
    }));
  }, [user]);

  const todaySpotlightEvent = useMemo(() => {
    const today = new Date();
    return events.find((event) => isSameDay(new Date(event.start), today));
  }, [events]);

  const handleDateSearch = (event) => {
    event.preventDefault();

    const month = Number(dateSearch.month);
    const day = Number(dateSearch.day);

    if (!month || !day) {
      setSearchStatus("Choose a month and day.");
      return;
    }

    const maxDay = new Date(currentDate.getFullYear(), month, 0).getDate();

    if (day < 1 || day > maxDay) {
      setSearchStatus(`That month has ${maxDay} days.`);
      return;
    }

    const nextDate = new Date(currentDate.getFullYear(), month - 1, day);
    setCurrentDate(nextDate);
    setView("day");
    setSearchStatus(`Jumped to ${formatDayHeading(nextDate)}.`);
  };

  const handleHolidaySearch = (event) => {
    event.preventDefault();

    const query = holidayQuery.trim().toLowerCase();

    if (!query) {
      setSearchStatus("Enter a holiday name.");
      return;
    }

    const match = events.find((eventItem) => {
      if (!eventItem) {
        return false;
      }

      return [
        eventItem.title,
        eventItem.description,
        eventItem.country,
        eventItem.type,
        eventItem.location,
        ...(Array.isArray(eventItem.tags)
          ? eventItem.tags
          : eventItem.tags
            ? [eventItem.tags]
            : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    if (!match) {
      setSearchStatus("No match in the current results.");
      return;
    }

    setCurrentDate(new Date(match.start));
    setView("day");
    openModal(match);
    setSearchStatus(`Showing ${match.title}.`);
  };

  const handleRequestSubmit = (event) => {
    event.preventDefault();

    if (!requestForm.holidayName.trim()) {
      setRequestStatus("Add a holiday name first.");
      return;
    }

    const suggestion = submitSuggestion({
      ...requestForm,
      name: requestForm.name || user?.name || "Anonymous",
    });

    setRequestStatus(`Suggestion saved as ${suggestion.status}.`);
    setRequestForm({
      name: user?.name || "",
      holidayName: "",
      description: "",
      referenceLink: "",
    });
  };

  const renderMonthLayout = () => (
    <>
      <section className="soft-panel px-6 py-6 sm:px-7" id="calendar-home">
        <div>
          <p className="soft-kicker">Current Day</p>
          <h1 className="soft-display mt-3 text-[clamp(2.2rem,4.8vw,4rem)] italic leading-[0.98] tracking-tight text-[#4d463f]">
            {todaySpotlightEvent?.title || formatDayHeading(new Date())}
          </h1>
          <p className="mt-3 text-sm text-[#7a6f62]">
            {todaySpotlightEvent
              ? formatDayHeading(new Date(todaySpotlightEvent.start))
              : formatMonthYear(new Date())}
          </p>
          {todaySpotlightEvent?.description ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#75695d]">
              {todaySpotlightEvent.description}
            </p>
          ) : null}
        </div>
      </section>

      <section className="soft-panel p-3 sm:p-4">
        <MonthView />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="soft-panel p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="soft-kicker">Find Holidays</p>
              <h2 className="mt-2 text-2xl font-medium tracking-tight text-[#4d463f]">
                Search and filter
              </h2>
            </div>
            <p className="text-sm text-[#8a7e70]">
              {events.length} of {allEvents.length}
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <form className="soft-subpanel grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <select
                className="soft-field"
                onChange={(event) => setCountryFilter(event.target.value)}
                value={filters?.country ?? "all"}
              >
                <option value="all">All countries</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              <select
                className="soft-field"
                onChange={(event) => setTypeFilter(event.target.value)}
                value={filters?.type ?? "all"}
              >
                <option value="all">All types</option>
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <Button
                onClick={clearFilters}
                size="small"
                type="button"
                variant="outline"
              >
                Clear
              </Button>
            </form>

            <form
              className="soft-subpanel grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto]"
              onSubmit={handleDateSearch}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  className="soft-field"
                  onChange={(event) =>
                    setDateSearch((prev) => ({
                      ...prev,
                      month: event.target.value,
                    }))
                  }
                  value={dateSearch.month}
                >
                  {MONTH_OPTIONS.map((month, index) => (
                    <option key={month} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <input
                  className="soft-field"
                  max={31}
                  min={1}
                  onChange={(event) =>
                    setDateSearch((prev) => ({
                      ...prev,
                      day: event.target.value,
                    }))
                  }
                  placeholder="Day"
                  type="number"
                  value={dateSearch.day}
                />
              </div>
              <Button size="small" type="submit">
                Go to Date
              </Button>
            </form>

            <form
              className="soft-subpanel grid gap-3 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto]"
              onSubmit={handleHolidaySearch}
            >
              <input
                className="soft-field"
                onChange={(event) => setHolidayQuery(event.target.value)}
                placeholder="Search by holiday name"
                type="text"
                value={holidayQuery}
              />
              <Button size="small" type="submit">
                Search
              </Button>
            </form>
          </div>

          {searchStatus ? (
            <p className="mt-4 text-sm text-[#7d7164]">{searchStatus}</p>
          ) : null}
        </section>

        <section className="soft-panel p-6">
          <p className="soft-kicker">Suggest</p>
          <h2 className="mt-2 text-2xl font-medium tracking-tight text-[#4d463f]">
            Suggest a holiday
          </h2>

          <form className="mt-5 space-y-3" onSubmit={handleRequestSubmit}>
            {!user ? (
              <input
                className="soft-field"
                onChange={(event) =>
                  setRequestForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Name"
                type="text"
                value={requestForm.name}
              />
            ) : null}
            <input
              className="soft-field"
              onChange={(event) =>
                setRequestForm((prev) => ({
                  ...prev,
                  holidayName: event.target.value,
                }))
              }
              placeholder="Holiday name"
              type="text"
              value={requestForm.holidayName}
            />
            <input
              className="soft-field"
              onChange={(event) =>
                setRequestForm((prev) => ({
                  ...prev,
                  referenceLink: event.target.value,
                }))
              }
              placeholder="Reference link (optional)"
              type="url"
              value={requestForm.referenceLink}
            />
            <textarea
              className="soft-field min-h-[120px] resize-none"
              onChange={(event) =>
                setRequestForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              placeholder="Short note (optional)"
              value={requestForm.description}
            />
            <Button type="submit">Send</Button>
          </form>

          {requestStatus ? (
            <p className="mt-4 text-sm text-[#7d7164]">{requestStatus}</p>
          ) : null}
        </section>
      </div>

      <footer className="border-t border-[#ddd1c3] px-1 pt-6 text-sm text-[#928679]">
        © 2026 Website crafted by Karen Ferreira Magalhaes, Nataly Fonseca
        Mendes, Percy Focazio-Moran, Rafiq Abudulai.
      </footer>
    </>
  );

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 lg:px-8">
      <div className="relative space-y-7">
        {loading ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[2rem] bg-[#fbf7f0]/70 backdrop-blur-sm">
            <Spinner className="text-[#4b4743]" size="lg" />
          </div>
        ) : null}

        <CalendarHeader />

        {error ? (
          <div className="rounded-[1.4rem] border border-[#d9bfb2] bg-[#fff3ee] px-5 py-4 text-sm text-[#9b5d49]">
            {error}
          </div>
        ) : null}

        {view === "month" ? (
          renderMonthLayout()
        ) : (
          <section className="soft-panel overflow-hidden">
            {view === "week" ? <WeekView /> : null}
            {view === "day" ? <DayView /> : null}
          </section>
        )}

        <EventModal />
      </div>
    </div>
  );
};

export default CalendarPage;
