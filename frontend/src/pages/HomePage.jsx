import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import RateLimitedUI from "../components/RateLimitedUI";
import axios from "axios";
import { toast } from "react-hot-toast";
import NoteCard from "../components/NoteCard";
import instance from "../../lib/axios";
import NotesNotFound from "../components/NotesNotFound";
import NoteDetailModal from "../pages/NoteDetailPage";

const HomePage = () => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [showNoteModal, setShowNoteModal] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await instance.get("/notes");

        console.log(res.data);
        setNotes(res.data);
        setIsRateLimited(false);
      } catch (error) {
        console.log("Error fetching notes:");
        if (error.response?.status === 429) {
          setIsRateLimited(true);
        } else {
          toast.error("Error fetching notes. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  const handleNoteClick = (noteId) => {
    setSelectedNoteId(noteId);
    setShowNoteModal(true);
  };

  const handleCloseModal = () => {
    setShowNoteModal(false);
    setSelectedNoteId(null);
  };

  const handleNoteUpdated = (updatedNote) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note._id === updatedNote._id ? updatedNote : note
      )
    );
  };

  const handleNoteDeleted = (deletedNoteId) => {
    setNotes((prevNotes) => prevNotes.filter((note) => note._id !== deletedNoteId));
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {isRateLimited && <RateLimitedUI />}

      <div className="max-w-7xl mx-auto p-4 mt-6">
        {loading && (
          <div className="text-center text-primary p-10">Loading Notes....</div>
        )}

        {notes.length === 0 && !isRateLimited && <NotesNotFound />}

        {notes.length > 0 && !isRateLimited && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <NoteCard 
                key={note._id} 
                note={note} 
                setNotes={setNotes}
                onNoteClick={handleNoteClick}
              />
            ))}
          </div>
        )}
      </div>

      <NoteDetailModal
        isOpen={showNoteModal}
        onClose={handleCloseModal}
        noteId={selectedNoteId}
        onNoteUpdated={handleNoteUpdated}
        onNoteDeleted={handleNoteDeleted}
      />
    </div>
  );
};

export default HomePage;