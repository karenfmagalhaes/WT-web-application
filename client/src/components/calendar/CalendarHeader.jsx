import { useCalendar } from "../../hooks/useCalendar";
import Button from "../ui/Button";

const CalendarHeader = () => {
  const { currentDate, setCurrentDate, view, setView } = useCalendar();

  const navigate = (direction) => {
    const nextDate = new Date(currentDate);

    if (view === "month") {
      nextDate.setMonth(nextDate.getMonth() + direction);
    } else if (view === "week") {
      nextDate.setDate(nextDate.getDate() + direction * 7);
    } else {
      nextDate.setDate(nextDate.getDate() + direction);
    }

    setCurrentDate(nextDate);
  };

  const monthLabel = currentDate.toLocaleDateString("en-IE", { month: "long" });
  const yearLabel = currentDate.toLocaleDateString("en-IE", { year: "numeric" });

  return (
    <header className="soft-panel p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="soft-kicker">{view} view</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <h1 className="soft-display text-[clamp(2.8rem,6vw,4.8rem)] italic leading-none tracking-tight text-[#4d463f]">
              {monthLabel}
            </h1>
            <p className="pb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#8a7e70]">
              {yearLabel}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setCurrentDate(new Date())}
              size="small"
              type="button"
              variant="outline"
            >
              Today
            </Button>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d7cabd] bg-[#fffaf4] text-xl text-[#6b6055] transition hover:bg-[#f3eadf]"
              onClick={() => navigate(-1)}
              type="button"
            >
              ‹
            </button>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d7cabd] bg-[#fffaf4] text-xl text-[#6b6055] transition hover:bg-[#f3eadf]"
              onClick={() => navigate(1)}
              type="button"
            >
              ›
            </button>
          </div>

          <div className="flex rounded-full bg-[#efe6da] p-1">
            {["month", "week", "day"].map((value) => (
              <button
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                  view === value
                    ? "bg-[#4b4743] text-white shadow-[0_8px_16px_rgba(75,71,67,0.18)]"
                    : "text-[#6f6459] hover:bg-[#f8f2e9]"
                }`}
                key={value}
                onClick={() => setView(value)}
                type="button"
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default CalendarHeader;
