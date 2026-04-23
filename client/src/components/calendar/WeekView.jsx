import { Fragment, useMemo } from "react";
import { useCalendar } from "../../hooks/useCalendar";
import { useEvents } from "../../hooks/useEvents";
import { useDragAndDrop } from "../../hooks/useDragAndDrop";
import { isSameDay } from "../../utils/dateUtils";

const HOURS = Array.from({ length: 24 }, (_, index) => index);

const WeekView = () => {
  const { currentDate, openModal } = useCalendar();
  const { events, isFavorite, toggleFavorite } = useEvents();
  const { onDragStart, onDragOver, onDrop } = useDragAndDrop();

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());

    return Array.from({ length: 7 }, (_, index) => {
      const nextDate = new Date(start);
      nextDate.setDate(start.getDate() + index);
      return nextDate;
    });
  }, [currentDate]);

  const today = new Date();

  const getEventsForDayHour = (date, hour) =>
    events.filter((event) => {
      const start = new Date(event.start);
      return isSameDay(start, date) && start.getHours() === hour;
    });

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div
        className="grid border-b border-[#ddd1c3] bg-[#fbf6ee]/90"
        style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}
      >
        <div className="py-2" />
        {weekDays.map((day, index) => (
          <div className="py-2 text-center" key={index}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a7e70]">
              {day.toLocaleDateString("en-IE", { weekday: "short" })}
            </p>
            <span
              className={`mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                isSameDay(day, today)
                  ? "bg-[#4b4743] text-white shadow-[0_10px_18px_rgba(75,71,67,0.16)]"
                  : "bg-[#f3eadf] text-[#5d554c]"
              }`}
            >
              {day.getDate()}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
          {HOURS.map((hour) => (
            <Fragment key={hour}>
              <div className="h-14 border-r border-[#e7ddd1] bg-[#fbf6ee]/65 pr-2 pt-0.5 text-right text-xs text-[#988b7e]">
                {hour === 0 ? "" : `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`}
              </div>

              {weekDays.map((day, dayIndex) => (
                <div
                  className="group relative h-14 border-b border-r border-[#e7ddd1] bg-[#fffaf4]/45 transition-colors hover:bg-[#f2eadf]/70"
                  key={`${hour}-${dayIndex}`}
                  onDragOver={onDragOver}
                  onDrop={(event) => {
                    const dropDate = new Date(day);
                    dropDate.setHours(hour);
                    onDrop(event, dropDate);
                  }}
                >
                  {getEventsForDayHour(day, hour).map((event) => (
                    <div
                      className={`absolute inset-x-0.5 top-0.5 bottom-0.5 z-10 cursor-pointer truncate rounded px-1.5 py-0.5 text-xs font-medium text-white ${
                        isFavorite(event._id) ? "ring-2 ring-[#f5d27a]" : ""
                      }`}
                      draggable
                      key={event._id}
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        openModal(event);
                      }}
                      onDragStart={() => onDragStart(event)}
                      style={{ backgroundColor: event.color || "#3b82f6" }}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="truncate">{event.title}</span>
                        <button
                          aria-label={
                            isFavorite(event._id)
                              ? "Remove from favourites"
                              : "Save to favourites"
                          }
                          className="rounded-full p-0.5 text-white/90 transition hover:bg-white/10"
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            toggleFavorite(event);
                          }}
                          type="button"
                        >
                          <svg aria-hidden="true" className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
