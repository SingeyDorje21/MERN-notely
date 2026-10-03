import { Link } from "react-router";
import { NotebookPen, Plus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

// Empty state for "no notes yet", or for a search with no matches when `query` is set
const NotesNotFound = ({ query, onClearSearch }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center">
    <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
      {query ? <SearchX className="size-6" /> : <NotebookPen className="size-6" />}
    </div>
    <h2 className="text-lg font-semibold">{query ? `No notes match “${query}”` : "No notes yet"}</h2>
    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
      {query ? "Check the spelling, or try a shorter word." : "Notes you write will show up here."}
    </p>
    {query ? (
      <Button variant="outline" className="mt-6" onClick={onClearSearch}>
        Clear search
      </Button>
    ) : (
      <Button asChild className="mt-6">
        <Link to="/note/new">
          <Plus />
          Write your first note
        </Link>
      </Button>
    )}
  </div>
);

export default NotesNotFound;
