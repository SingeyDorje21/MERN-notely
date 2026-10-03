import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Braces, FileText, LogOut } from "lucide-react";
import instance from "@/lib/axios";
import { downloadFile, formatRelativeTime, htmlToMarkdown } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import UserAvatar from "@/components/UserAvatar";

const Stat = ({ label, value }) => (
  <div className="rounded-lg border bg-background p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 font-heading text-2xl font-semibold">{value}</p>
  </div>
);

const dateStamp = () => new Date().toISOString().slice(0, 10);

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null); // { total, lastEdited }
  const [exporting, setExporting] = useState(false);

  // One note plus the total-count header is all the stats need
  useEffect(() => {
    instance
      .get("/notes", { params: { sort: "updated", limit: 1 } })
      .then((res) => setStats({ total: Number(res.headers["x-total-count"]) || 0, lastEdited: res.data[0]?.updatedAt }))
      .catch((error) => {
        console.error("Error fetching notes:", error);
        setStats({ total: 0 });
        toast.error("Couldn't load your notes");
      });
  }, []);

  // Export is the one place that needs every note, so fetch them only when asked
  const withAllNotes = (exportFn) => async () => {
    setExporting(true);
    try {
      const res = await instance.get("/notes");
      exportFn(res.data);
    } catch (error) {
      console.error("Error exporting notes:", error);
      toast.error("Couldn't export your notes", { description: "Please try again." });
    } finally {
      setExporting(false);
    }
  };

  const exportMarkdown = withAllNotes((notes) => {
    const body = notes
      .map((note) => `# ${note.title}\n\n${htmlToMarkdown(note.content)}`)
      .join("\n\n---\n\n");
    downloadFile(`notely-export-${dateStamp()}.md`, body, "text/markdown");
  });

  const exportJson = withAllNotes((notes) => {
    const data = notes.map(({ _id, title, content, createdAt, updatedAt }) => ({ _id, title, content, createdAt, updatedAt }));
    downloadFile(`notely-export-${dateStamp()}.json`, JSON.stringify(data, null, 2), "application/json");
  });

  const canExport = Boolean(stats?.total) && !exporting;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <UserAvatar user={user} className="size-16" />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{user?.displayName}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </CardContent>
        <Separator />
        <CardContent className="py-4 text-xs text-muted-foreground">
          You sign in with Google, so your name and photo come from your Google account. Change them there.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your notes</CardTitle>
          <CardDescription>Download a copy of every note.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Notes" value={stats ? stats.total.toLocaleString() : "—"} />
            <Stat label="Last edited" value={stats?.lastEdited ? formatRelativeTime(stats.lastEdited) : "—"} />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={exportMarkdown} disabled={!canExport}>
              <FileText />
              Export Markdown
            </Button>
            <Button variant="outline" onClick={exportJson} disabled={!canExport}>
              <Braces />
              Export JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col justify-between gap-4 pt-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-medium">Sign out</p>
            <p className="text-sm text-muted-foreground">Sign out of Notely on this device.</p>
          </div>
          <Button
            variant="outline"
            onClick={logout}
            className="shrink-0 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
