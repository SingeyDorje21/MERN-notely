import { useEffect, useState } from "react";
import { LoaderIcon, Trash2Icon, XIcon } from "lucide-react";
import instance from "../../lib/axios";
import toast from "react-hot-toast";
import DeleteConfirmationModal from "../components/DeleteConformationModal";

const NoteDetailModal = ({ isOpen, onClose, noteId, onNoteUpdated, onNoteDeleted }) => {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (isOpen && noteId) {
      fetchNote();
    }
  }, [isOpen, noteId]);

  const fetchNote = async () => {
    setLoading(true);
    try {
      const res = await instance.get(`/notes/${noteId}`);
      setNote(res.data);
    } catch (error) {
      console.log("Error in fetching note", error);
      toast.error("Failed to fetch the note");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await instance.delete(`/notes/${noteId}`);
      toast.success("Note deleted");
      onNoteDeleted(noteId);
      setShowDeleteModal(false);
      onClose();
    } catch (error) {
      console.log("Error deleting the note:", error);
      toast.error("Failed to delete note");
      if (error.response?.status === 429) {
        toast.error("You are being rate limited. Please try again later.", {
          duration: 4000,
          icon: "🚫",
        });
      }
    }
  };

  const handleSave = async () => {
    if (!note.title.trim() || !note.content.trim()) {
      toast.error("Please add a title or content");
      return;
    }

    setSaving(true);

    try {
      const res = await instance.put(`/notes/${noteId}`, note);
      toast.success("Note updated successfully");
      onNoteUpdated(res.data);
      onClose();
    } catch (error) {
      console.log("Error saving the note:", error);
      toast.error("Failed to update note");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNote(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <div 
          className="bg-base-100 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-t-4 border-solid border-[#00FF9D]"
          onClick={(e) => e.stopPropagation()}
        >
          {loading ? (
            <div className="flex items-center justify-center p-20">
              <LoaderIcon className="animate-spin size-10" />
            </div>
          ) : (
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-base-content">
                  Edit Note
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn btn-error btn-outline btn-sm"
                  >
                    <Trash2Icon className="h-4 w-4" />
                    Delete
                  </button>
                  <button
                    onClick={handleClose}
                    className="btn btn-ghost btn-sm btn-circle"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Title</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Note title"
                    className="input input-bordered"
                    value={note?.title || ""}
                    onChange={(e) => setNote({ ...note, title: e.target.value })}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Content</span>
                  </label>
                  <textarea
                    placeholder="Write your note here..."
                    className="textarea textarea-bordered h-40"
                    value={note?.content || ""}
                    onChange={(e) => setNote({ ...note, content: e.target.value })}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    onClick={handleClose}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={saving}
                    onClick={handleSave}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        noteTitle={note?.title}
      />
    </>
  );
};

export default NoteDetailModal;