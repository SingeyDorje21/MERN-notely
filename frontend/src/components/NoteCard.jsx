import { Link } from "react-router";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, formatRelativeTime } from "@/lib/utils";

// `preview` is plain text derived from the note HTML by the parent
function NoteCard({ note, preview, view = "grid", onDelete }) {
  const isList = view === "list";

  return (
    <article
      className={cn(
        "group relative rounded-xl border bg-card transition-colors hover:border-primary/40 hover:bg-accent/40 focus-within:border-primary/40",
        isList ? "flex items-center gap-4 px-4 py-3" : "flex min-h-44 flex-col p-5"
      )}
    >
      <div className="min-w-0 flex-1">
        <h3 className={cn("truncate font-sans font-semibold text-card-foreground", isList ? "text-sm" : "pr-8 text-base")}>
          {/* Stretched link: the whole card is clickable without nesting the delete button in an anchor */}
          <Link
            to={`/note/${note._id}`}
            className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {note.title}
          </Link>
        </h3>
        <p className={cn("text-sm text-muted-foreground", isList ? "truncate" : "mt-2 line-clamp-3 leading-relaxed")}>
          {preview || <span className="italic">No content</span>}
        </p>
      </div>

      <time
        dateTime={note.updatedAt}
        className={cn("shrink-0 text-xs text-muted-foreground", isList ? "hidden sm:block" : "mt-4")}
      >
        {isList ? formatRelativeTime(note.updatedAt) : `Edited ${formatRelativeTime(note.updatedAt)}`}
      </time>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(note)}
            aria-label={`Delete "${note.title}"`}
            className={cn(
              "z-10 size-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100",
              isList ? "relative" : "absolute right-3 top-3"
            )}
          >
            <Trash2 />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>
    </article>
  );
}

export function NoteCardSkeleton({ view = "grid" }) {
  if (view === "list") return <Skeleton className="h-[62px] rounded-xl" />;
  return (
    <div className="flex min-h-44 flex-col gap-3 rounded-xl border bg-card p-5" aria-hidden="true">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="mt-auto h-3 w-24" />
    </div>
  );
}

export default NoteCard;
