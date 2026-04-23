import { useMemo } from "react";
import { useCalendar } from "../../hooks/useCalendar";
import { useEvents } from "../../hooks/useEvents";
import { useDragAndDrop } from "../../hooks/useDragAndDrop";
import { getMonthGrid, isSameDay, isSameMonth } from "../../utils/dateUtils";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MonthView = () => {
  const { currentDate, setCurrentDate, setView, openModal } = useCalendar();
  const { events } = useEvents();
  const { onDragOver, onDrop } = useDragAndDrop();
  const today = new Date();

  const gridDates = useMemo(() => getMonthGrid(currentDate), [currentDate]);

  const getEventsForDay = (date) =>
    events.filter((event) => isSameDay(new Date(event.start), date));

  return (
    <div className="flex flex-col overflow-hidden rounded-[inherit]">
      <div className="grid grid-cols-7 border-b border-[#c8bdae] bg-[#f3eadf]/80">
        {WEEKDAY_LABELS.map((label) => (
          <div
            className="px-2 py-2 text-center text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#7e7468]"
            key={label}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-[#f9f5ee]">
        {gridDates.map((date, index) => {
          const inMonth = isSameMonth(date, currentDate);
          const dayIsToday = isSameDay(date, today);
          const dayEvents = getEventsForDay(date);
          const isLastCol = (index + 1) % 7 === 0;

          return (
            <div
              className={`flex min-h-[5.5rem] flex-col border-b border-[#dcd2c4] p-1.5 transition-colors sm:min-h-[6.25rem] ${
                isLastCol ? "" : "border-r"
              } ${
                inMonth ? "bg-[#f9f5ee]" : "bg-[#f1ece3]/90"
              } ${dayIsToday ? "ring-1 ring-inset ring-[#4b4743]/35" : ""} ${
                inMonth ? "cursor-pointer hover:bg-[#f4efe6]" : "cursor-pointer hover:bg-[#ebe4d9]"
              }`}
              key={date.toISOString()}
              onClick={() => {
                setCurrentDate(date);
                setView("day");
              }}
              onDragOver={onDragOver}
              onDrop={(event) => onDrop(event, date)}
            >
              <div className="flex justify-center">
                <span
                  className={`flex h-7 w-7 items-center justify-center text-sm font-semibold ${
                    dayIsToday
                      ? "rounded-full bg-[#4b4743] text-white shadow-[0_6px_12px_rgba(75,71,67,0.2)]"
                      : inMonth
                        ? "text-[#4d463f]"
                        : "text-[#9a8e81]"
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>

              <div className="mt-1 flex min-h-0 flex-1 flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <button
                    className="w-full truncate rounded-md border border-[#ddd3c8] bg-white/90 px-1 py-0.5 text-left text-[10px] font-medium leading-tight text-[#4e473f] shadow-sm transition hover:border-[#c4b6a8] hover:bg-white"
                    key={event._id}
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      openModal(event);
                    }}
                    type="button"
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 ? (
                  <p className="px-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#a4988a]">
                    +{dayEvents.length - 3} more
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;
