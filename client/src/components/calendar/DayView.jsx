import { useCalendar } from "../../hooks/useCalendar";
import { useEvents } from "../../hooks/useEvents";
import { useDragAndDrop } from "../../hooks/useDragAndDrop";
import { isSameDay } from "../../utils/dateUtils";

const HOURS = Array.from({ length: 24 }, (_, index) => index);

const DayView = () => {
  const { currentDate, openModal } = useCalendar();
  const { events, isFavorite, toggleFavorite } = useEvents();
  const { onDragStart, onDragOver, onDrop } = useDragAndDrop();

  const dayEvents = events.filter((event) => isSameDay(new Date(event.start), currentDate));

  const getEventsForHour = (hour) =>
    dayEvents.filter((event) => new Date(event.start).getHours() === hour);

  const today = new Date();
  const isToday = isSameDay(currentDate, today);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-[#ddd1c3] bg-[#fbf6ee]/90 px-6 py-4">
        <span
          className={`soft-display text-4xl italic ${
            isToday ? "text-[#4b4743]" : "text-[#4d463f]"
          }`}
        >
          {currentDate.getDate()}
        </span>
        <div>
          <p className="text-sm font-semibold text-[#5c544b]">
            {currentDate.toLocaleDateString("en-IE", { weekday: "long" })}
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-[#948679]">
            {currentDate.toLocaleDateString("en-IE", { month: "long", year: "numeric" })}
          </p>
        </div>
        {isToday ? (
          <span className="ml-2 rounded-full border border-[#d4c7b8] bg-[#fffaf4] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6b6055]">
            Today
          </span>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto">
        {HOURS.map((hour) => (
          <div
            className="group flex min-h-[56px] border-b border-[#e7ddd1] transition-colors hover:bg-[#f2eadf]/55"
            key={hour}
            onDragOver={onDragOver}
            onDrop={(event) => {
              const nextDate = new Date(currentDate);
              nextDate.setHours(hour);
              onDrop(event, nextDate);
            }}
          >
            <div className="w-16 flex-shrink-0 bg-[#fbf6ee]/65 pr-3 pt-1 text-right text-xs text-[#988b7e]">
              {hour === 0 ? "12am" : hour < 12 ? `${hour}am` : hour === 12 ? "12pm" : `${hour - 12}pm`}
            </div>
            <div className="relative flex-1 border-l border-[#e0d4c7] py-1 pl-3">
              {getEventsForHour(hour).map((event) => (
                <div
                  className={`mb-1 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 ${
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
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{event.title}</p>
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
                      <svg aria-hidden="true" className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81H7.03a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  </div>
                  {event.description ? (
                    <p className="truncate text-xs opacity-80">{event.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DayView;
