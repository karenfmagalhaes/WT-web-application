import { useCallback } from "react";
import { useEvents } from "./useEvents";

const draggingEvent = { current: null };

export const useDragAndDrop = () => {
  const { moveEvent } = useEvents();

  const onDragStart = useCallback((event) => {
    draggingEvent.current = event;
  }, []);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const onDrop = useCallback(
    async (event, newDate) => {
      event.preventDefault();

      if (!draggingEvent.current) {
        return;
      }

      const { _id, start, end } = draggingEvent.current;
      const originalStart = new Date(start);
      const originalEnd = new Date(end);
      const duration = originalEnd.getTime() - originalStart.getTime();
      const nextStart = new Date(newDate);

      nextStart.setHours(
        originalStart.getHours(),
        originalStart.getMinutes(),
        originalStart.getSeconds(),
        originalStart.getMilliseconds()
      );

      const nextEnd = new Date(nextStart.getTime() + duration);

      try {
        await moveEvent(_id, nextStart.toISOString(), nextEnd.toISOString());
      } finally {
        draggingEvent.current = null;
      }
    },
    [moveEvent]
  );

  return { onDragStart, onDragOver, onDrop };
};
