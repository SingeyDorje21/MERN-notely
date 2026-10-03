import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Check, CircleAlert, Loader2, Trash2 } from "lucide-react";
import instance from "@/lib/axios";
import { cn, countWords, formatDate, formatRelativeTime, htmlToText, isContentEmpty } from "@/lib/utils";
import { scheduleDelete } from "@/lib/pendingDeletes";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import RichTextEditor from "@/components/RichTextEditor";

const AUTOSAVE_DELAY_MS = 1200;
const MAX_TITLE_LENGTH = 200; // matches the API's validation

// One editor instance per note. A new note is created by its first autosave and
// the URL becomes /note/:id; passing the same editorKey along keeps the editor
// mounted through that swap, so the cursor and undo history survive.
const NoteDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const editorKey = location.state?.editorKey ?? (id === "new" ? `new:${location.key}` : id);
  return <NoteEditor key={editorKey} editorKey={editorKey} />;
};

const NoteEditor = ({ editorKey }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const [note, setNote] = useState(null); // last server copy (for timestamps)
  const [title, setTitle] = useState(id === "new" ? location.state?.title || "" : "");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(id !== "new");
  const [status, setStatus] = useState("saved");
  const [saveCount, setSaveCount] = useState(0);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saveError, setSaveError] = useState(""); // validation message from the API, e.g. note too long

  const noteIdRef = useRef(null); // id of the note in the editor; null for an unsaved draft
  const savedRef = useRef({ title: "", content: "" }); // what the server has
  const latestRef = useRef({ title: "", content: "" });
  const inFlightRef = useRef(null);
  const mountedRef = useRef(true);

  latestRef.current = { title, content };
  const isNew = noteIdRef.current === null;
  const isDirty = title !== savedRef.current.title || content !== savedRef.current.content;
  const canSave = Boolean(title.trim()) && !isContentEmpty(content);

  const markClean = () => {
    savedRef.current = { ...latestRef.current };
  };

  useEffect(() => {
    // Nothing to load for a draft, or when the URL just caught up with a note we created
    if (id === "new" || id === noteIdRef.current) return;

    let cancelled = false;
    setLoading(true);
    instance
      .get(`/notes/${id}`)
      .then((res) => {
        if (cancelled) return;
        noteIdRef.current = res.data._id;
        savedRef.current = { title: res.data.title, content: res.data.content };
        setNote(res.data);
        setTitle(res.data.title);
        setContent(res.data.content);
        setStatus("saved");
        setLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Error fetching note:", error);
        toast.error(error.response?.status === 404 ? "That note doesn't exist" : "Couldn't open the note");
        navigateRef.current("/", { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const save = useCallback(async () => {
    const payload = { ...latestRef.current };
    if (!payload.title.trim() || isContentEmpty(payload.content)) return false;
    if (inFlightRef.current) return inFlightRef.current;

    setStatus("saving");
    const request = (async () => {
      try {
        const res = noteIdRef.current
          ? await instance.put(`/notes/${noteIdRef.current}`, payload)
          : await instance.post("/notes", payload);
        savedRef.current = payload;
        setNote(res.data);
        if (!noteIdRef.current) {
          noteIdRef.current = res.data._id;
          if (mountedRef.current) {
            navigateRef.current(`/note/${res.data._id}`, { replace: true, state: { editorKey } });
          }
        }
        setStatus("saved");
        setSaveCount((n) => n + 1); // re-run autosave in case typing continued mid-request
        return true;
      } catch (error) {
        console.error("Error saving note:", error);
        setSaveError(error.response?.status === 400 ? error.response.data?.message || "" : "");
        setStatus(error.response?.status === 429 ? "rateLimited" : "error");
        return false;
      } finally {
        inFlightRef.current = null;
      }
    })();
    inFlightRef.current = request;
    return request;
  }, [editorKey]);

  // Debounced autosave
  useEffect(() => {
    if (loading || !isDirty) return;
    if (!canSave) {
      setStatus("incomplete");
      return;
    }
    setStatus((current) => (current === "saving" ? current : "pending"));
    const timer = setTimeout(save, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [title, content, loading, saveCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ctrl/Cmd + S saves immediately
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [save]);

  // Warn before closing the tab with unsaved work
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e) => e.preventDefault();
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Leaving through the sidebar, header, or search skips handleBack, so save
  // whatever is still pending on the way out
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const { title: t, content: c } = latestRef.current;
      if (t !== savedRef.current.title || c !== savedRef.current.content) save();
    };
  }, [save]);

  const handleBack = async () => {
    if (!isDirty) return navigate("/");
    if (canSave) {
      if (await save()) navigate("/");
      else toast.error("Couldn't save your changes", { description: "Try again in a moment." });
      return;
    }
    setConfirmDiscard(true);
  };

  const discardAndLeave = () => {
    markClean();
    navigate("/");
  };

  // No confirmation: the "Note deleted" toast offers Undo for a few seconds
  const handleDelete = () => {
    if (!noteIdRef.current) return isDirty ? setConfirmDiscard(true) : navigate("/");
    scheduleDelete({ ...note, ...latestRef.current });
    markClean();
    navigate("/");
  };

  const STATUS = {
    saved: { icon: note ? Check : null, label: note ? `Saved · edited ${formatRelativeTime(note.updatedAt)}` : "Draft" },
    pending: { label: "Unsaved changes" },
    saving: { icon: Loader2, label: "Saving…" },
    incomplete: { label: "Add a title and some text to save" },
    error: { icon: CircleAlert, label: saveError ? `Couldn't save: ${saveError}` : "Couldn't save" },
    rateLimited: { icon: CircleAlert, label: "Too many requests" },
  };
  const { icon: StatusIcon, label: statusLabel } = STATUS[status];
  const showRetry = status === "error" || status === "rateLimited";
  const words = countWords(htmlToText(content));

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="size-8 animate-spin text-primary" aria-label="Loading note" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-8 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack} className="-ml-3 text-muted-foreground">
          <ArrowLeft />
          All notes
        </Button>

        <div className="flex min-w-0 items-center gap-1">
          <span
            role="status"
            className={cn("flex min-w-0 items-center gap-1.5 text-xs", showRetry ? "text-destructive" : "text-muted-foreground")}
          >
            {StatusIcon && (
              <StatusIcon
                className={cn("size-3.5 shrink-0", status === "saving" && "animate-spin", status === "saved" && "text-primary")}
              />
            )}
            <span className="truncate">{statusLabel}</span>
          </span>
          {showRetry && (
            <Button variant="link" size="sm" onClick={save} className="h-auto px-1 text-xs">
              Retry
            </Button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                aria-label={isNew ? "Discard draft" : "Delete note"}
                className="ml-2 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isNew ? "Discard draft" : "Delete note"}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Untitled"
        aria-label="Note title"
        maxLength={MAX_TITLE_LENGTH}
        autoFocus={isNew && !title}
        className="mb-2 w-full border-none bg-transparent p-0 font-heading text-3xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/40 sm:text-4xl"
      />
      <p className="mb-6 text-xs text-muted-foreground">
        {words === 1 ? "1 word" : `${words.toLocaleString()} words`}
        {note && ` · Created ${formatDate(note.createdAt)}`}
      </p>

      <RichTextEditor
        content={content}
        onChange={setContent}
        placeholder="Start writing…"
        autofocus={isNew && Boolean(title)}
      />

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isNew ? "Discard this draft?" : "Leave without saving?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isNew
                ? "It hasn't been saved yet. A note needs a title and some text before it can be saved."
                : "A note needs a title and some text to save. Your latest changes will be lost."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={discardAndLeave} className={buttonVariants({ variant: "destructive" })}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NoteDetailPage;
