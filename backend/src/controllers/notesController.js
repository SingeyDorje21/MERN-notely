import Note from "../models/Note.js";

// _id breaks ties so pages never overlap. Each sort matches an index in
// models/Note.js exactly (or its reverse), so MongoDB reads pages in order.
const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  updated: { updatedAt: -1, _id: -1 },
  title: { title: 1, _id: 1 },
};

// Only the title sort compares strings. Its index uses the same collation;
// adding a collation to the date sorts would stop them using their indexes.
const TITLE_COLLATION = { locale: "en", strength: 2, numericOrdering: true }; // case-insensitive, "#2" before "#10"

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MAX_PAGE_SIZE = 100;
const QUERY_TIMEOUT_MS = 5000; // a pathological query is killed instead of tying up the database
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 90_000; // stays under the 100kb JSON body limit

// Returns { value } with the note fields, or { error } for a 400 response
function readNoteInput(body) {
  const { title, content } = body ?? {};
  if (typeof title !== "string" || typeof content !== "string") {
    return { error: "Title and content must be text" };
  }
  if (!title.trim()) return { error: "Title is required" };
  if (!content.trim()) return { error: "Content is required" };
  if (title.length > MAX_TITLE_LENGTH) return { error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer` };
  if (content.length > MAX_CONTENT_LENGTH) return { error: "Note is too long" };
  return { value: { title, content } };
}

const toPositiveInt = (value) => {
  const n = Number.parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// GET /notes?q=<search>&sort=<newest|oldest|updated|title>&page=<n>&limit=<n>
// Without `limit` every match is returned (used by export). The total match
// count is always sent in the X-Total-Count header.
export async function getAllNotes(req, res) {
  try {
    const { q, sort } = req.query;
    const limit = toPositiveInt(req.query.limit);
    const page = toPositiveInt(req.query.page) || 1;
    const filter = { userId: req.user._id };

    if (typeof q === "string" && q.trim()) {
      const term = escapeRegex(q.trim().slice(0, 100));
      filter.$or = [
        { title: new RegExp(term, "i") },
        // Content is HTML: skip matches inside a tag (e.g. "strong" in <strong>).
        // The lookahead is bounded; an unbounded [^<]* rescans to the end of
        // the note at every candidate, making search quadratic (ReDoS).
        { content: new RegExp(`${term}(?![^<>]{0,300}>)`, "i") },
      ];
    }

    const query = Note.find(filter)
      .sort(Object.hasOwn(SORTS, sort) ? SORTS[sort] : SORTS.newest) // hasOwn: "constructor" etc. aren't sorts
      .maxTimeMS(QUERY_TIMEOUT_MS)
      .lean();
    if (sort === "title") query.collation(TITLE_COLLATION);
    if (limit) {
      const pageSize = Math.min(limit, MAX_PAGE_SIZE);
      query.skip((page - 1) * pageSize).limit(pageSize);
    }

    const [notes, total] = await Promise.all([query, Note.countDocuments(filter).maxTimeMS(QUERY_TIMEOUT_MS)]);
    res.set("X-Total-Count", String(total));
    res.status(200).json(notes);
  } catch (error) {
    console.error("Error in getAllNotes controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getNoteById(req, res) {
  try {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });
    if (!note) return res.status(404).json({ message: "Note not found!" });
    res.json(note);
  } catch (error) {
    console.error("Error in getNoteById controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createNote(req, res) {
  try {
    const { value, error } = readNoteInput(req.body);
    if (error) return res.status(400).json({ message: error });
    const note = new Note({ ...value, userId: req.user._id });

    const savedNote = await note.save();
    res.status(201).json(savedNote);
  } catch (error) {
    console.error("Error in createNote controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateNote(req, res) {
  try {
    const { value, error } = readNoteInput(req.body);
    if (error) return res.status(400).json({ message: error });
    const updatedNote = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      value,
      {
        new: true,
      }
    );

    if (!updatedNote) return res.status(404).json({ message: "Note not found" });

    res.status(200).json(updatedNote);
  } catch (error) {
    console.error("Error in updateNote controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteNote(req, res) {
  try {
    const deletedNote = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deletedNote) return res.status(404).json({ message: "Note not found" });
    res.status(200).json({ message: "Note deleted successfully!" });
  } catch (error) {
    console.error("Error in deleteNote controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
