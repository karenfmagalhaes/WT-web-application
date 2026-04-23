const DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

const RecurrenceSelector = ({ rule, update, reset }) => (
  <div className="soft-subpanel flex flex-col gap-3 p-4">
    <div className="flex items-center justify-between">
      <label className="soft-label mb-0">Recurrence</label>
      {rule.freq !== "none" && (
        <button
          className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a5c49] transition hover:text-[#7e4635]"
          onClick={reset}
          type="button"
        >
          Clear
        </button>
      )}
    </div>

    <select
      className="soft-field py-3"
      onChange={(event) => update("freq", event.target.value)}
      value={rule.freq}
    >
      <option value="none">Does not repeat</option>
      <option value="daily">Daily</option>
      <option value="weekly">Weekly</option>
      <option value="monthly">Monthly</option>
      <option value="yearly">Yearly</option>
    </select>

    {rule.freq !== "none" && (
      <>
        <div className="flex items-center gap-2 text-sm text-[#6f6459]">
          <span>Every</span>
          <input
            className="soft-field w-20 px-3 py-2"
            min={1}
            onChange={(event) => update("interval", Number(event.target.value) || 1)}
            type="number"
            value={rule.interval}
          />
          <span>{rule.freq}(s)</span>
        </div>

        {rule.freq === "weekly" && (
          <div className="flex gap-1">
            {DAYS.map((day) => (
              <button
                className={`h-9 w-9 rounded-full border text-xs font-semibold transition ${
                  rule.days.includes(day)
                    ? "border-[#4b4743] bg-[#4b4743] text-white shadow-[0_8px_14px_rgba(75,71,67,0.16)]"
                    : "border-[#d4c7b8] bg-[#fffaf4] text-[#6f6459] hover:bg-[#f2eadf]"
                }`}
                key={day}
                onClick={() =>
                  update(
                    "days",
                    rule.days.includes(day)
                      ? rule.days.filter((value) => value !== day)
                      : [...rule.days, day]
                  )
                }
                type="button"
              >
                {day}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-[#6f6459]">
          <span>Until</span>
          <input
            className="soft-field max-w-[220px] px-3 py-2"
            onChange={(event) => update("until", event.target.value)}
            type="date"
            value={rule.until}
          />
        </div>
      </>
    )}
  </div>
);

export default RecurrenceSelector;
