import express from "express";
import mongoose from "mongoose";
import {
  createNote,
  deleteNote,
  getAllNotes,
  getNoteById,
  updateNote,
} from "../controllers/notesController.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// Protect all note routes — requires valid JWT cookie
router.use(verifyToken);

// A malformed id can't match a note; answer 404 instead of a cast error (500)
router.param("id", (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ message: "Note not found" });
  next();
});

router.get("/", getAllNotes);
router.get("/:id", getNoteById);
router.post("/", createNote);
router.put("/:id", updateNote);
router.delete("/:id", deleteNote);

export default router;
