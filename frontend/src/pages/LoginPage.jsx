import { Navigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { CircleAlert, CloudUpload, Download, Loader2, PenLine, Search, Terminal } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: PenLine, title: "Rich text", text: "Headings, lists, code blocks and quotes." },
  { icon: CloudUpload, title: "Saves as you type", text: "No save button to forget." },
  { icon: Search, title: "Find anything", text: "Search titles and note text instantly." },
  { icon: Download, title: "Your notes, portable", text: "Export everything as Markdown or JSON." },
];

// The OAuth callback redirects here with ?error=<code> when sign-in fails
const ERROR_MESSAGES = {
  no_user: "We couldn't sign you in with that Google account.",
  auth_failed: "Sign-in didn't complete. Please try again.",
};
const DEFAULT_ERROR = "Sign-in didn't work. Please try again.";

const IS_LOCALHOST = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </svg>
);

const LoginPage = () => {
  const { user, login, devLogin, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  const handleDevLogin = () =>
    devLogin().catch((err) =>
      toast.error(
        err.response?.status === 404 ? "Dev sign-in is off" : "Dev sign-in failed",
        {
          description:
            err.response?.status === 404
              ? "Set DEV_LOGIN=true in backend/.env and restart the server."
              : "Is the backend running?",
        }
      )
    );

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Value proposition (large screens) */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r bg-card p-16 lg:flex">
        <div className="pointer-events-none absolute -left-32 -top-32 size-[500px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="relative flex items-center gap-3">
          <img src="/notely_forest_icon.svg" alt="" className="size-9" />
          <span className="font-heading text-2xl font-bold tracking-tight text-primary">Notely</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="mb-4 text-4xl font-bold">A quiet place for your notes.</h1>
          <p className="mb-10 text-lg text-muted-foreground">Write, format and find your notes without the clutter.</p>
          <ul className="grid grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="space-y-1.5">
                <feature.icon className="mb-2 size-5 text-primary" aria-hidden="true" />
                <p className="text-sm font-medium">{feature.title}</p>
                <p className="text-sm text-muted-foreground">{feature.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-muted-foreground/60">© {new Date().getFullYear()} Notely</p>
      </section>

      {/* Sign in */}
      <section className="flex items-center justify-center px-4 py-12">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col items-center gap-3 text-center lg:hidden">
            <img src="/notely_forest_icon.svg" alt="" className="size-12" />
            <p className="font-heading text-3xl font-bold tracking-tight text-primary">Notely</p>
            <p className="text-muted-foreground">A quiet place for your notes.</p>
          </div>

          <div className="space-y-1 text-center lg:text-left">
            <h2 className="text-2xl font-bold">Sign in</h2>
            <p className="text-sm text-muted-foreground">Use your Google account to continue.</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <CircleAlert className="size-4" />
              {/* hasOwn: the code comes from the URL, so "constructor" etc. must not resolve */}
              <AlertDescription>{Object.hasOwn(ERROR_MESSAGES, error) ? ERROR_MESSAGES[error] : DEFAULT_ERROR}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3">
            <Button variant="outline" size="lg" onClick={login} className="h-12 px-6 [&_svg]:size-5">
              <GoogleIcon />
              Continue with Google
            </Button>

            {IS_LOCALHOST && (
              <Button variant="ghost" onClick={handleDevLogin} className="h-11 border border-dashed border-primary/40 text-primary hover:bg-primary/10 hover:text-primary">
                <Terminal />
                Dev sign-in (localhost only)
              </Button>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground lg:text-left">
            Notely only reads your name, email address and profile photo from Google.
          </p>
        </div>
      </section>
    </div>
  );
};

export default LoginPage;
