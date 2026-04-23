import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { useCalendar } from "../hooks/useCalendar";
import { useEvents } from "../hooks/useEvents";
import {
  formatDayHeading,
  formatMonthYear,
  formatTimeRange,
} from "../utils/dateUtils";

const statusStyles = {
  approved: "border border-[#cfe0d2] bg-[#eef7f0] text-[#55755d]",
  pending: "border border-[#ead8a8] bg-[#fbf2dc] text-[#8b6d2d]",
  rejected: "border border-[#e5c6bf] bg-[#fff0ec] text-[#9a5c49]",
};

const ProfilePage = () => {
  const { user, isDevAuthBypass } = useAuth();
  const { setCurrentDate, setView, openModal } = useCalendar();
  const { favorites, suggestions, toggleFavorite } = useEvents();
  const navigate = useNavigate();

  const favoriteCountries = useMemo(
    () =>
      [...new Set(favorites.map((holiday) => holiday.country).filter(Boolean))],
    [favorites]
  );

  const favoriteTypes = useMemo(
    () => [...new Set(favorites.map((holiday) => holiday.type).filter(Boolean))],
    [favorites]
  );

  const handleOpenHoliday = (holiday) => {
    setCurrentDate(new Date(holiday.start));
    setView("day");
    openModal(holiday);
    navigate("/");
  };

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 lg:px-8">
      <div className="space-y-7">
        <section className="soft-panel overflow-hidden">
          <div className="grid gap-6 px-6 py-8 lg:grid-cols-[minmax(0,1.15fr)_320px] lg:px-8">
            <div>
              <p className="soft-kicker">Your Profile</p>
              <h1 className="soft-display mt-4 text-[clamp(2.6rem,5vw,4.6rem)] italic leading-[0.95] tracking-tight text-[#4d463f]">
                Your personal holiday room
              </h1>
              <p className="soft-note mt-4 max-w-2xl text-sm leading-relaxed">
                Keep your saved holidays, revisit your favourite traditions, and
                track the suggestions you have submitted without leaving the same
                calm visual flow as the calendar itself.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="soft-chip">
                  {favorites.length} favourite{favorites.length === 1 ? "" : "s"}
                </span>
                <span className="soft-chip">
                  {suggestions.length} suggestion
                  {suggestions.length === 1 ? "" : "s"}
                </span>
                <span className="soft-chip">
                  {favoriteCountries.length || 0} countries followed
                </span>
              </div>
            </div>

            <div className="soft-subpanel p-6">
              <p className="soft-kicker">Account Snapshot</p>

              <div className="mt-5 space-y-3 text-sm text-[#5c534a]">
                <div className="soft-card px-4 py-3">
                  <p className="soft-label mb-1">Name</p>
                  <p className="font-medium">{user?.name || "Unknown user"}</p>
                </div>
                <div className="soft-card px-4 py-3">
                  <p className="soft-label mb-1">Email</p>
                  <p className="font-medium">{user?.email || "No email available"}</p>
                </div>
                <div className="soft-card px-4 py-3">
                  <p className="soft-label mb-1">Mode</p>
                  <p className="font-medium">
                    {isDevAuthBypass ? "Demo mode" : "Authenticated account"}
                  </p>
                </div>
              </div>

              {favoriteTypes.length > 0 ? (
                <div className="mt-5">
                  <p className="soft-label">Favourite Types</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {favoriteTypes.map((type) => (
                      <span
                        className="rounded-full border border-[#e0d4c7] bg-[#f1e7da] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#6f655b]"
                        key={type}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="soft-muted-card mt-6 p-4">
                <p className="soft-kicker">Quick Route</p>
                <p className="mt-2 text-sm leading-relaxed text-[#6d6257]">
                  Head back to the live calendar whenever you want to open a day
                  and continue browsing.
                </p>
                <Button
                  className="mt-4"
                  onClick={() => navigate("/")}
                  size="small"
                  variant="secondary"
                >
                  Open Calendar
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="soft-panel p-6 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="soft-kicker">Favourites</p>
                <h2 className="mt-2 text-2xl font-medium tracking-tight text-[#4d463f]">
                  Saved holidays
                </h2>
              </div>
              <p className="soft-note max-w-md text-sm leading-relaxed">
                These are the holidays you marked for quick return visits from the
                calendar.
              </p>
            </div>

            {favorites.length > 0 ? (
              <div className="mt-6 grid gap-4">
                {favorites.map((holiday) => (
                  <article className="soft-card px-5 py-5" key={holiday._id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="soft-kicker">{formatMonthYear(holiday.start)}</p>
                        <h3 className="mt-2 text-lg font-medium text-[#4d463f]">
                          {holiday.title}
                        </h3>
                        <p className="soft-note mt-2 text-sm leading-relaxed">
                          {holiday.description || "No description added yet."}
                        </p>
                      </div>
                      <span className="rounded-full border border-[#e1d6c9] bg-[#fffaf4] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#75695d]">
                        {holiday.country || holiday.type || "Holiday"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#7d7164]">
                      {holiday.type ? (
                        <span className="rounded-full border border-[#e2d8cd] px-3 py-1">
                          {holiday.type}
                        </span>
                      ) : null}
                      {holiday.location ? (
                        <span className="rounded-full border border-[#e2d8cd] px-3 py-1">
                          {holiday.location}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-[#e2d8cd] px-3 py-1">
                        {formatTimeRange(holiday.start, holiday.end)}
                      </span>
                    </div>

                    {holiday.tags?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {holiday.tags.map((tag) => (
                          <span
                            className="rounded-full bg-[#f8f1e7] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7d7164]"
                            key={`${holiday._id}-${tag}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button onClick={() => handleOpenHoliday(holiday)} size="small">
                        View On Calendar
                      </Button>
                      <Button
                        onClick={() => toggleFavorite(holiday)}
                        size="small"
                        variant="outline"
                      >
                        Remove Favourite
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="soft-muted-card mt-6 px-5 py-8 text-center">
                <p className="text-sm font-medium text-[#5f564d]">
                  No favourite holidays yet.
                </p>
                <p className="mt-2 text-sm text-[#84786b]">
                  Use the star buttons in the calendar to save the holidays you want
                  to revisit.
                </p>
              </div>
            )}
          </section>

          <div className="space-y-6">
            <section className="soft-panel p-6">
              <p className="soft-kicker">Favourite Regions</p>
              <h2 className="mt-2 text-2xl font-medium tracking-tight text-[#4d463f]">
                Countries you follow
              </h2>

              {favoriteCountries.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {favoriteCountries.map((country) => (
                    <span className="soft-chip" key={country}>
                      {country}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="soft-note mt-4 text-sm">
                  Save a few holidays first and your favourite countries will
                  appear here.
                </p>
              )}
            </section>

            <section className="soft-panel p-6">
              <p className="soft-kicker">Suggestions</p>
              <h2 className="mt-2 text-2xl font-medium tracking-tight text-[#4d463f]">
                Your submitted ideas
              </h2>

              {suggestions.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {suggestions.map((suggestion) => (
                    <article className="soft-card px-4 py-4" key={suggestion._id}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#4d463f]">
                            {suggestion.holidayName}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#978b7d]">
                            {formatDayHeading(suggestion.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                            statusStyles[suggestion.status] ?? statusStyles.pending
                          }`}
                        >
                          {suggestion.status}
                        </span>
                      </div>

                      {suggestion.description ? (
                        <p className="mt-3 text-sm leading-relaxed text-[#75695d]">
                          {suggestion.description}
                        </p>
                      ) : null}

                      {suggestion.referenceLink ? (
                        <a
                          className="mt-3 inline-block text-sm font-semibold text-[#6f5844] transition hover:text-[#4d463f]"
                          href={suggestion.referenceLink}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open reference link
                        </a>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="soft-note mt-4 text-sm">
                  You have not suggested any new holidays yet.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
