import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { LayoutGrid, List, Loader2 } from "lucide-react";
import instance from "@/lib/axios";
import { htmlToText } from "@/lib/utils";
import { loadPrefs, savePrefs } from "@/lib/prefs";
import { isPendingDelete, onNotesRestored, scheduleDelete } from "@/lib/pendingDeletes";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import RateLimitedUI from "@/components/RateLimitedUI";
import NoteCard, { NoteCardSkeleton } from "@/components/NoteCard";
import NotesNotFound from "@/components/NotesNotFound";

// Keys match the `sort` values GET /notes accepts
const SORT_LABELS = {
  updated: "Recently edited",
  newest: "Newest first",
  oldest: "Oldest first",
  title: "Title A–Z",
};

const SEARCH_DEBOUNCE_MS = 250;
const PAGE_SIZE = 30;

const pluralize = (count, one, many) => `${count.toLocaleString()} ${count === 1 ? one : many}`;

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [notes, setNotes] = useState([]);
  const [total, setTotal] = useState(0); // all matches on the server, not just loaded pages
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true); // first load only; later fetches keep the list on screen
  const [refreshing, setRefreshing] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [reloadCount, setReloadCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [prefs, setPrefs] = useState(loadPrefs);
  const requestIdRef = useRef(0); // bumped on every new search/sort so stale pages are ignored
  const sentinelRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const handleFetchError = (error) => {
    if (error.response?.status === 429) {
      setIsRateLimited(true);
    } else {
      toast.error("Couldn't load your notes", { description: "Please try again in a moment." });
    }
  };

  const fetchPage = (pageToLoad) =>
    instance.get("/notes", {
      params: { q: debouncedQuery || undefined, sort: prefs.sort, page: pageToLoad, limit: PAGE_SIZE },
    });
  const readTotal = (res) => Number(res.headers["x-total-count"]) || res.data.length;

  // First page whenever the search or sort changes; search and sort run on the server
  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setRefreshing(true);
    fetchPage(1)
      .then((res) => {
        if (requestId !== requestIdRef.current) return;
        setNotes(res.data.filter((note) => !isPendingDelete(note._id)));
        setTotal(readTotal(res));
        setPage(1);
        setIsRateLimited(false);
      })
      .catch((error) => requestId === requestIdRef.current && handleFetchError(error))
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
        setRefreshing(false);
      });
  }, [debouncedQuery, prefs.sort, reloadCount]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasMore = notes.length < total;

  const loadMore = useCallback(() => {
    if (loadingMore || refreshing || !hasMore) return;
    const requestId = requestIdRef.current;
    setLoadingMore(true);
    fetchPage(page + 1)
      .then((res) => {
        if (requestId !== requestIdRef.current) return;
        setNotes((prev) => {
          // Skip duplicates: notes created or edited since page 1 shift the offsets
          const seen = new Set(prev.map((note) => note._id));
          return [...prev, ...res.data.filter((note) => !seen.has(note._id) && !isPendingDelete(note._id))];
        });
        setTotal(readTotal(res));
        setPage(page + 1);
      })
      .catch((error) => requestId === requestIdRef.current && handleFetchError(error))
      .finally(() => setLoadingMore(false));
  }, [loadingMore, refreshing, hasMore, page, debouncedQuery, prefs.sort]); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll: load the next page as the end of the list comes into view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), {
      rootMargin: "600px",
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  // Refetch when deletes are undone (or fail) so the notes land in their sorted positions
  useEffect(() => onNotesRestored(() => setReloadCount((n) => n + 1)), []);

  const updatePrefs = (changes) => {
    const next = { ...prefs, ...changes };
    setPrefs(next);
    savePrefs(next);
  };

  const handleDelete = (note) => {
    setNotes((prev) => prev.filter((n) => n._id !== note._id));
    setTotal((n) => n - 1);
    scheduleDelete(note);
  };

  const previews = useMemo(
    () => Object.fromEntries(notes.map((note) => [note._id, htmlToText(note.content)])),
    [notes]
  );

  const listClass =
    prefs.view === "list" ? "flex flex-col gap-2" : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div>
      {isRateLimited && <RateLimitedUI />}

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{debouncedQuery ? "Search results" : "All notes"}</h1>
          <p className="mt-1 h-5 text-sm text-muted-foreground">
            {!loading &&
              (debouncedQuery ? `${pluralize(total, "match", "matches")} for “${debouncedQuery}”` : pluralize(total, "note", "notes"))}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={prefs.sort} onValueChange={(sort) => updatePrefs({ sort })}>
            <SelectTrigger className="w-[160px]" aria-label="Sort notes">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ToggleGroup
            type="single"
            variant="outline"
            value={prefs.view}
            onValueChange={(view) => view && updatePrefs({ view })}
            aria-label="Layout"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view" className="size-9 px-0">
              <LayoutGrid />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view" className="size-9 px-0">
              <List />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {loading ? (
        <div className={listClass}>
          {Array.from({ length: 6 }, (_, i) => (
            <NoteCardSkeleton key={i} view={prefs.view} />
          ))}
        </div>
      ) : isRateLimited ? null : notes.length === 0 ? (
        <NotesNotFound query={debouncedQuery} onClearSearch={() => setSearchParams({})} />
      ) : (
        <div className={`${listClass} transition-opacity ${refreshing ? "opacity-60" : ""}`} aria-busy={refreshing}>
          {notes.map((note) => (
            <NoteCard key={note._id} note={note} preview={previews[note._id]} view={prefs.view} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {!loading && hasMore && (
        <div ref={sentinelRef} className="flex justify-center pt-8">
          <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
            {loadingMore && <Loader2 className="animate-spin" />}
            {loadingMore ? "Loading…" : `Load more · ${(total - notes.length).toLocaleString()} left`}
          </Button>
        </div>
      )}
    </div>
  );
};

export default HomePage;
