import { PenSquareIcon, Trash2Icon } from "lucide-react";
import React, { useState } from "react";
import { formatDate } from "../../lib/utils";
import instance from "../../lib/axios";
import toast from "react-hot-toast";
import DeleteConfirmationModal from "../components/DeleteConformationModal";

function NoteCard({ note, setNotes, onNoteClick }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = async (id) => {
    try {
      await instance.delete(`/notes/${id}`);
      setNotes((prevNotes) => prevNotes.filter((n) => n._id !== id));
      toast.success("Note deleted successfully!");
      setShowDeleteModal(false);
    } catch (error) {
      toast.error("Error deleting note. Please try again later.");
      console.error("Error deleting note:", error);
      if (error.response?.status === 429) {
        toast.error("You are being rate limited. Please try again later.", {
          duration: 4000,
          icon: "🚫",
        });
      }
    }
  };

  const handleDeleteClick = (e) => {
    e.preventDefault();
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    handleDelete(note._id);
  };

  const handleCloseModal = () => {
    setShowDeleteModal(false);
  };

  const handleCardClick = () => {
    onNoteClick(note._id);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="card bg-base-100 hover:shadow-lg transition-all duration-200 border-t-4 border-solid border-[#00FF9D] cursor-pointer"
      >
        <div className="card-body">
          <h3 className="card-title text-base-content">{note.title}</h3>
          <p className="text-base-content/70 line-clamp-3">{note.content}</p>
          <div className="card-actions justify-between items-center mt-4">
            <span className="text-sm text-base-content/60">
              {formatDate(new Date(note.createdAt))}
            </span>
            <div className="flex items-center gap-1">
              <PenSquareIcon className="size-4" />
              <button
                className="btn btn-ghost btn-xs text-error"
                onClick={handleDeleteClick}
              >
                <Trash2Icon className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        noteTitle={note.title}
      />
    </>
  );
}

export default NoteCard;