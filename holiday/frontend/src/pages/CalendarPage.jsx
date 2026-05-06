import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CalendarHeader from "../components/calendar/CalendarHeader";
import DayView from "../components/calendar/DayView";
import MonthView from "../components/calendar/MonthView";
import WeekView from "../components/calendar/WeekView";
import EventModal from "../components/events/EventModal";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import { getHolidays } from "../api/holidayApi";
import { useAuth } from "../hooks/useAuth";
import { useCalendar } from "../hooks/useCalendar";
import { useEvents } from "../hooks/useEvents";
import { holidayToEvent } from "../utils/holidayUtils";
import {
  formatDayHeading,
  formatMonthYear,
  getDayRange,
  getMonthRange,
  getWeekRange,
  isSameDay,
} from "../utils/dateUtils";

const CATEGORY_OPTIONS = [
  "Public", "Religious", "Cultural", "National",
  "Seasonal", "International", "Other",
];

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
  const { user } = useAuth();
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
  const [dateStatus, setDateStatus] = useState("");
  const [holidayStatus, setHolidayStatus] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [requestForm, setRequestForm] = useState({
    name: "",
    country: "",
    month: "",
    day: "",
    year: "",
    category: "Other",
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

  // no-op: suggestion form fields are not user-dependent in real auth mode


  const todaySpotlightEvent = useMemo(() => {
    const today = new Date();
    return events.find((event) => isSameDay(new Date(event.start), today));
  }, [events]);

  const handleDateSearch = (event) => {
    event.preventDefault();

    const month = Number(dateSearch.month);
    const day = Number(dateSearch.day);

    if (!month || !day) {
      setDateStatus("Choose a month and day.");
      return;
    }

    const maxDay = new Date(currentDate.getFullYear(), month, 0).getDate();

    if (day < 1 || day > maxDay) {
      setDateStatus(`That month has ${maxDay} days.`);
      return;
    }

    const nextDate = new Date(currentDate.getFullYear(), month - 1, day);
    setCurrentDate(nextDate);
    setView("day");
    setDateStatus(`Jumped to ${formatDayHeading(nextDate)}.`);
  };

  const handleHolidaySearch = async (event) => {
    event.preventDefault();

    const query = holidayQuery.trim();


    setHolidayStatus("Searching…");
    setSearchResults([]);

    try {
      const { data } = await getHolidays({
        search: query,
        ...(filters.country !== "all" && { country: filters.country }),
        ...(filters.type !== "all" && { category: filters.type }),
      });
      const viewYear = currentDate.getFullYear();
      const matches = (data.holidays ?? []).map((h) => {
        const d = new Date(h.date);
        d.setFullYear(viewYear);
        return holidayToEvent({ ...h, date: d.toISOString() });
      });

      if (matches.length === 0) {
        setHolidayStatus("No match found.");
        return;
      }

      setSearchResults(matches);
      setHolidayStatus(`${matches.length} result${matches.length === 1 ? "" : "s"} found.`);
    } catch {
      setHolidayStatus("Search failed. Please try again.");
    }
  };

  const handleSelectResult = (holiday) => {
    setCurrentDate(new Date(holiday.start));
    setView("day");
    openModal(holiday);
    setSearchResults([]);
    setHolidayStatus("");
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      setRequestStatus("You must be logged in to submit a suggestion.");
      return;
    }

    if (!requestForm.name.trim()) {
      setRequestStatus("Add a holiday name first.");
      return;
    }
    if (!requestForm.country.trim()) {
      setRequestStatus("Country is required.");
      return;
    }
    if (!requestForm.month || !requestForm.day) {
      setRequestStatus("Month and day are required.");
      return;
    }

    const year = requestForm.year ? Number(requestForm.year) : new Date().getFullYear();
    const date = new Date(year, Number(requestForm.month) - 1, Number(requestForm.day));

    try {
      const suggestion = await submitSuggestion({ ...requestForm, date: date.toISOString() });
      setRequestStatus(`Suggestion saved as ${suggestion.status}.`);
      setRequestForm({ name: "", country: "", month: "", day: "", year: "", category: "Other", description: "", referenceLink: "" });
    } catch {
      setRequestStatus("Could not save suggestion. Please try again.");
    }
  };

  const renderMonthLayout = () => (
    <>
      <section className="soft-panel px-6 py-6 sm:px-7" id="calendar-home">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <p className="soft-kicker">Current Day</p>
            <h1 className="soft-display mt-3 text-[clamp(2.2rem,4.8vw,4rem)] italic leading-[0.98] tracking-tight text-[#4d463f]">
              {todaySpotlightEvent?.title || formatDayHeading(new Date())}
            </h1>
            {todaySpotlightEvent?.description ? (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#75695d]">
                {todaySpotlightEvent.description}
              </p>
            ) : null}
          </div>

          <div className="pt-2 lg:pt-0">
            <p className="soft-kicker">Go to Date</p>
            <form className="mt-3 flex items-center gap-2" onSubmit={handleDateSearch}>
              <select
                className="soft-field flex-1 py-2 text-sm"
                onChange={(event) =>
                  setDateSearch((prev) => ({ ...prev, month: event.target.value }))
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
                className="soft-field w-16 py-2 text-sm"
                max={31}
                min={1}
                onChange={(event) =>
                  setDateSearch((prev) => ({ ...prev, day: event.target.value }))
                }
                placeholder="Day"
                type="number"
                value={dateSearch.day}
              />
              <Button size="small" type="submit">
                Go
              </Button>
            </form>
            {dateStatus ? (
              <p className="mt-2 text-sm text-[#7d7164]">{dateStatus}</p>
            ) : null}
          </div>
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
              onSubmit={handleHolidaySearch}
            >
              <input
                className="soft-field"
                onChange={(event) => {
                  setHolidayQuery(event.target.value);
                  setSearchResults([]);
                  setHolidayStatus("");
                }}
                placeholder="Search by holiday name"
                type="text"
                value={holidayQuery}
              />
              <Button size="small" type="submit">
                Search
              </Button>
            </form>
          </div>

          {holidayStatus ? (
            <p className="mt-4 text-sm text-[#7d7164]">{holidayStatus}</p>
          ) : null}

          {searchResults.length > 0 ? (
            <div className="mt-4 space-y-2">
              {searchResults.map((result) => (
                <button
                  className="soft-card w-full px-4 py-3 text-left transition hover:bg-[#f2ece3]"
                  key={result._id}
                  onClick={() => handleSelectResult(result)}
                  type="button"
                >
                  <p className="text-sm font-semibold text-[#4d463f]">{result.title}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-[0.16em] text-[#978b7d]">
                    {[result.country, result.type].filter(Boolean).join(" · ")}
                  </p>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="soft-panel p-6">
          <p className="soft-kicker">Suggest</p>
          <h2 className="mt-2 text-2xl font-medium tracking-tight text-[#4d463f]">
            Suggest a holiday
          </h2>

          <form className="mt-5 space-y-3" onSubmit={handleRequestSubmit}>
            <input
              className="soft-field"
              onChange={(event) =>
                setRequestForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Holiday name"
              type="text"
              value={requestForm.name}
            />
            <input
              className="soft-field"
              onChange={(event) =>
                setRequestForm((prev) => ({ ...prev, country: event.target.value }))
              }
              placeholder="Country"
              type="text"
              value={requestForm.country}
            />
            <select
              className="soft-field"
              onChange={(event) =>
                setRequestForm((prev) => ({ ...prev, category: event.target.value }))
              }
              value={requestForm.category}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <select
                className="soft-field flex-1"
                onChange={(event) =>
                  setRequestForm((prev) => ({ ...prev, month: event.target.value }))
                }
                value={requestForm.month}
              >
                <option value="">Month</option>
                {MONTH_OPTIONS.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
              <input
                className="soft-field w-20"
                max={31}
                min={1}
                onChange={(event) =>
                  setRequestForm((prev) => ({ ...prev, day: event.target.value }))
                }
                placeholder="Day"
                type="number"
                value={requestForm.day}
              />
            </div>
            <input
              className="soft-field"
              max={2100}
              min={1900}
              onChange={(event) =>
                setRequestForm((prev) => ({ ...prev, year: event.target.value }))
              }
              placeholder="Year (optional)"
              type="number"
              value={requestForm.year}
            />
            <input
              className="soft-field"
              onChange={(event) =>
                setRequestForm((prev) => ({ ...prev, referenceLink: event.target.value }))
              }
              placeholder="Reference link (optional)"
              type="url"
              value={requestForm.referenceLink}
            />
            <textarea
              className="soft-field min-h-[120px] resize-none"
              onChange={(event) =>
                setRequestForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Short note (optional)"
              value={requestForm.description}
            />
            <Button type="submit">Send</Button>
          </form>

          {requestStatus ? (
            <div className="mt-4 flex items-center gap-3">
              <p className="text-sm text-[#7d7164]">{requestStatus}</p>
              {!user ? (
                <Link
                  className="text-sm font-medium text-[#4d463f] underline underline-offset-2 hover:text-[#7d7164]"
                  to="/login"
                >
                  Log in
                </Link>
              ) : null}
            </div>
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
