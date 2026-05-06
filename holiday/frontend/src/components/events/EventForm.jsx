import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useCalendar } from "../../hooks/useCalendar";
import { useRecurrence } from "../../hooks/useRecurrence";
import { toDateTimeLocalValue } from "../../utils/dateUtils";
import Button from "../ui/Button";
import RecurrenceSelector from "./RecurrenceSelector";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const EMPTY_FORM = {
  title: "",
  start: "",
  end: "",
  color: COLORS[0],
  description: "",
  country: "",
  type: "",
  location: "",
  tags: "",
};

const EventForm = ({ onClose }) => {
  const { user } = useAuth();
  const {
    selectedEvent,
    addEvent,
    editEvent,
    removeEvent,
    toggleFavorite,
    isFavorite,
  } = useCalendar();
  const { rule, update, reset, toRRuleString } = useRecurrence(selectedEvent?.recurrence);
  const [form, setForm] = useState(EMPTY_FORM);
  const isEditing = Boolean(selectedEvent?._id);
  const isAdmin = user?.role === "admin";
  const favorite = isEditing ? isFavorite(selectedEvent?._id) : false;

  useEffect(() => {
    if (selectedEvent) {
      setForm({
        title: selectedEvent.title || "",
        start: toDateTimeLocalValue(selectedEvent.start),
        end: toDateTimeLocalValue(selectedEvent.end),
        color: selectedEvent.color || COLORS[0],
        description: selectedEvent.description || "",
        country: selectedEvent.country || "",
        type: selectedEvent.type || "",
        location: selectedEvent.location || "",
        tags: Array.isArray(selectedEvent.tags)
          ? selectedEvent.tags.join(", ")
          : selectedEvent.tags || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [selectedEvent]);

  const handleChange = (event) =>
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      start: new Date(form.start).toISOString(),
      end: new Date(form.end).toISOString(),
      recurrence: toRRuleString(),
    };

    if (isEditing) await editEvent(selectedEvent._id, payload);
    else await addEvent(payload);

    onClose();
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    if (window.confirm("Delete this holiday?")) {
      await removeEvent(selectedEvent._id);
      onClose();
    }
  };

  // Read-only view for regular users and guests
  if (!isAdmin) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xl font-semibold text-[#4d463f]">{selectedEvent?.title}</p>
          {selectedEvent?.country || selectedEvent?.type ? (
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#978b7d]">
              {[selectedEvent.country, selectedEvent.type].filter(Boolean).join(" · ")}
            </p>
          ) : null}
        </div>

        {selectedEvent?.description ? (
          <p className="text-sm leading-relaxed text-[#5a524a]">{selectedEvent.description}</p>
        ) : null}

        {user && isEditing ? (
          <div className="soft-subpanel flex items-center justify-between gap-4 px-4 py-4">
            <div>
              <p className="soft-label mb-1">Favourite</p>
              <p className="text-sm text-[#5a524a]">Save this holiday to your profile page.</p>
            </div>
            <Button
              onClick={() => toggleFavorite(selectedEvent)}
              type="button"
              variant={favorite ? "primary" : "outline"}
            >
              {favorite ? "Saved" : "Save"}
            </Button>
          </div>
        ) : null}

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} type="button" variant="outline">
            Close
          </Button>
        </div>
      </div>
    );
  }

  // Admin-only edit form
  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <input
        className="soft-field"
        name="title"
        onChange={handleChange}
        placeholder="Holiday title"
        required
        value={form.title}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="soft-label">Start</label>
          <input
            className="soft-field"
            name="start"
            onChange={handleChange}
            required
            type="datetime-local"
            value={form.start}
          />
        </div>
        <div>
          <label className="soft-label">End</label>
          <input
            className="soft-field"
            name="end"
            onChange={handleChange}
            required
            type="datetime-local"
            value={form.end}
          />
        </div>
      </div>

      <textarea
        className="soft-field min-h-[110px] resize-none"
        name="description"
        onChange={handleChange}
        placeholder="Description"
        rows={2}
        value={form.description}
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          className="soft-field"
          name="country"
          onChange={handleChange}
          placeholder="Country"
          value={form.country}
        />
        <input
          className="soft-field"
          name="type"
          onChange={handleChange}
          placeholder="Type"
          value={form.type}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          className="soft-field"
          name="location"
          onChange={handleChange}
          placeholder="Location"
          value={form.location}
        />
        <input
          className="soft-field"
          name="tags"
          onChange={handleChange}
          placeholder="Tags, comma separated"
          value={form.tags}
        />
      </div>

      <RecurrenceSelector reset={reset} rule={rule} update={update} />

      {isEditing ? (
        <div className="soft-subpanel flex items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="soft-label mb-1">Favourite</p>
            <p className="text-sm text-[#5a524a]">Save this holiday to your profile page.</p>
          </div>
          <Button
            onClick={() => toggleFavorite(selectedEvent)}
            type="button"
            variant={favorite ? "primary" : "outline"}
          >
            {favorite ? "Saved" : "Save"}
          </Button>
        </div>
      ) : null}

      <div className="flex justify-between pt-2">
        {isEditing ? (
          <Button onClick={handleDelete} type="button" variant="danger">
            Delete
          </Button>
        ) : (
          <span />
        )}

        <div className="ml-auto flex gap-2">
          <Button onClick={onClose} type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit">{isEditing ? "Update" : "Create"}</Button>
        </div>
      </div>
    </form>
  );
};

export default EventForm;
