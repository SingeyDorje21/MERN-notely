import React from "react";
import { Trash2Icon, XIcon } from "lucide-react";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, noteTitle }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-base-100 rounded-lg shadow-xl max-w-md w-full mx-4 border-t-4 border-solid border-[#00FF9D]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-error/10 rounded-full">
                <Trash2Icon className="size-5 text-error" />
              </div>
              <h3 className="text-lg font-semibold text-base-content">
                Delete Note
              </h3>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <XIcon className="size-4" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-base-content/70 mb-2">
              Are you sure you want to delete this note?
            </p>
            {noteTitle && (
              <div className="bg-base-200 p-3 rounded-lg">
                <p className="text-sm font-medium text-base-content">
                  {noteTitle}
                </p>
              </div>
            )}
            <p className="text-sm text-base-content/60 mt-2">
              This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="btn btn-error"
            >
              <Trash2Icon className="size-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;