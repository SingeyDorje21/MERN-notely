import { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { LogOut, Plus, Search, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import UserAvatar from "./UserAvatar";

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchRef = useRef(null);

  // The search box drives the ?q= filter on the notes list, so it stays in sync with the URL
  const onHome = location.pathname === "/";
  const query = onHome ? searchParams.get("q") || "" : "";

  const handleSearch = (value) => {
    navigate(
      { pathname: "/", search: value ? `?q=${encodeURIComponent(value)}` : "" },
      { replace: onHome }
    );
  };

  // Ctrl/Cmd + K focuses search from anywhere
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="Notely home">
          <img src="/notely_forest_icon.svg" alt="" className="size-7" />
          <span className="hidden font-heading text-lg font-bold tracking-tight text-primary sm:inline">Notely</span>
        </Link>

        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                handleSearch("");
                e.currentTarget.blur();
              }
            }}
            placeholder="Search notes"
            aria-label="Search notes"
            className="bg-muted/50 pl-9 sm:pr-14 [&::-webkit-search-cancel-button]:hidden"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 select-none rounded border bg-background px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground sm:inline-block">
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm" className="h-9">
            <Link to="/note/new" aria-label="New note">
              <Plus />
              <span className="hidden sm:inline">New note</span>
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Account menu"
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <UserAvatar user={user} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-medium">{user?.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={logout}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
