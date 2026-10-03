import { toast } from "sonner";
import instance from "./axios";

// There is no trash endpoint, so "Undo" works by holding DELETE requests back.
// Deletes made in quick succession share one undo window and one toast
// ("12 notes deleted · Undo"), and each new delete restarts the window.
const UNDO_WINDOW_MS = 5000;
const TOAST_ID = "pending-deletes";

const pending = new Map(); // noteId -> note
const restoreListeners = new Set();
let timer = null;

export const isPendingDelete = (id) => pending.has(id);

// Called with an array of notes when deletes are undone, or when requests fail
export function onNotesRestored(listener) {
  restoreListeners.add(listener);
  return () => restoreListeners.delete(listener);
}

const restore = (notes) => restoreListeners.forEach((listener) => listener(notes));

function takeBatch() {
  clearTimeout(timer);
  timer = null;
  toast.dismiss(TOAST_ID);
  const batch = [...pending.values()];
  pending.clear();
  return batch;
}

function undoAll() {
  const batch = takeBatch();
  if (batch.length) restore(batch);
}

async function commitAll() {
  const batch = takeBatch();
  const results = await Promise.allSettled(batch.map((note) => instance.delete(`/notes/${note._id}`)));
  const failed = batch.filter((_note, i) => results[i].status === "rejected");
  if (!failed.length) return;

  console.error("Error deleting notes:", results.filter((r) => r.status === "rejected").map((r) => r.reason));
  const rateLimited = results.some((r) => r.reason?.response?.status === 429);
  toast.error(
    failed.length === 1 ? "Couldn't delete the note" : `Couldn't delete ${failed.length} notes`,
    { description: rateLimited ? "Too many requests. Try again in a minute." : "They've been put back." }
  );
  restore(failed);
}

export function scheduleDelete(note) {
  pending.set(note._id, note);
  clearTimeout(timer);
  timer = setTimeout(commitAll, UNDO_WINDOW_MS);

  // Same id updates the existing toast instead of stacking a new one. The toast
  // stays until the batch commits or is undone, so it never outlives its Undo.
  toast(pending.size === 1 ? "Note deleted" : `${pending.size} notes deleted`, {
    id: TOAST_ID,
    duration: Infinity,
    action: { label: "Undo", onClick: undoAll },
  });
}

// If the tab closes during the undo window, send the deletes anyway.
// keepalive lets the requests outlive the page.
window.addEventListener("pagehide", () => {
  pending.forEach((_note, id) => {
    fetch(`${instance.defaults.baseURL}/notes/${id}`, {
      method: "DELETE",
      credentials: "include",
      keepalive: true,
    });
  });
  pending.clear();
});
