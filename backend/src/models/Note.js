import mongoose from "mongoose";

// 1st step: You need to create a schema
// 2nd step: You would create a model based off of that schema

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    totNotes:{
      type: Number,
      default: 0,
    },
  },
  { timestamps: true } // createdAt, updatedAt
);

// One index per list sort in notesController (including its _id tiebreaker), so
// a page is read in order from the index instead of sorting all of a user's notes
noteSchema.index({ userId: 1, updatedAt: -1, _id: -1 });
noteSchema.index({ userId: 1, createdAt: -1, _id: -1 }); // read in reverse for "oldest"
noteSchema.index(
  { userId: 1, title: 1, _id: 1 },
  { collation: { locale: "en", strength: 2, numericOrdering: true } } // must match the query's collation
);

const Note = mongoose.model("Note", noteSchema);

export default Note;
