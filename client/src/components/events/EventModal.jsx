import { useCalendar } from "../../hooks/useCalendar";
import Modal from "../ui/Modal";
import EventForm from "./EventForm";

const EventModal = () => {
  const { isModalOpen, closeModal, selectedEvent } = useCalendar();

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeModal}
      title={selectedEvent?._id ? "Holiday Details" : "Holiday"}
    >
      <EventForm onClose={closeModal} />
    </Modal>
  );
};

export default EventModal;
