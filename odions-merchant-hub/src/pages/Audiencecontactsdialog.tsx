import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, Loader2, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = "http://localhost:3000/api";
const CHUNK = 1000;
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB of text is plenty for a contact list

interface Contact { id: string; name: string | null; phone_number: string }
interface Entry { name: string; phone: string }
interface AddResult {
  added: number;
  duplicates: number;
  invalid: Entry[];
  size: number;
}

interface Props {
  audience: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const looksLikeHeader = (line: string) =>
  /name|nom|phone|tel|mobile|t[ée]l[ée]phone/i.test(line) && !/\d{8,}/.test(line.replace(/[\s.\-()+]/g, ""));

/** One contact per line: "Name, 06XXXXXXXX" or just "06XXXXXXXX". Commas, semicolons and tabs work. */
function parseLines(text: string): Entry[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length && looksLikeHeader(lines[0])) lines.shift(); // CSV header row
  return lines.map((line) => {
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, "")).filter(Boolean);
    if (parts.length <= 1) return { name: "", phone: parts[0] ?? "" };
    return { name: parts.slice(0, -1).join(" "), phone: parts[parts.length - 1] };
  });
}

export default function AudienceContactsDialog({ audience, open, onOpenChange }: Props) {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const getToken = (): string | null => {
    if (session?.access_token) return session.access_token;
    try {
      const stored = localStorage.getItem("supabaseSession");
      return stored ? (JSON.parse(stored) as { access_token?: string }).access_token ?? null : null;
    } catch {
      return null;
    }
  };

  const call = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    const token = getToken();
    if (!token) throw new Error("Please log in again");
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...options.headers },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.error?.message ?? (typeof body?.error === "string" ? body.error : "Request failed"));
    return body as T;
  };

  const key = ["audience-contacts", audience?.id];
  const contactsQuery = useQuery({
    queryKey: key,
    queryFn: async () => (await call<{ contacts: Contact[] }>(`/audiences/${audience!.id}/contacts`)).contacts,
    enabled: open && !!audience?.id && !!user?.id,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: key });
    queryClient.invalidateQueries({ queryKey: ["audiences"] });
    queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
  };

  const addMutation = useMutation({
    mutationFn: async (entries: Entry[]): Promise<AddResult> => {
      const total: AddResult = { added: 0, duplicates: 0, invalid: [], size: 0 };
      for (let i = 0; i < entries.length; i += CHUNK) {
        const r = await call<AddResult>(`/audiences/${audience!.id}/contacts`, {
          method: "POST",
          body: JSON.stringify({ contacts: entries.slice(i, i + CHUNK) }),
        });
        total.added += r.added;
        total.duplicates += r.duplicates;
        total.invalid.push(...r.invalid);
        total.size = r.size;
      }
      return total;
    },
    onSuccess: (r) => {
      const notes = [
        r.duplicates ? `${r.duplicates} duplicate${r.duplicates > 1 ? "s" : ""} skipped` : "",
        r.invalid.length ? `${r.invalid.length} invalid number${r.invalid.length > 1 ? "s" : ""} skipped` : "",
      ].filter(Boolean).join(", ");
      toast({ title: `${r.added} contact${r.added === 1 ? "" : "s"} added`, description: notes || `Audience now has ${r.size}.` });
      // Keep only the lines that need fixing
      setText(r.invalid.map((i) => (i.name ? `${i.name}, ${i.phone}` : i.phone)).join("\n"));
      refreshAll();
    },
    onError: (e: Error) => {
      toast({ title: "Unable to add contacts", description: e.message, variant: "destructive" });
      refreshAll(); // some chunks may have been saved
    },
  });

  const removeMutation = useMutation({
    mutationFn: (contactId: string) =>
      call(`/audiences/${audience!.id}/contacts/${contactId}`, { method: "DELETE" }),
    onSuccess: refreshAll,
    onError: (e: Error) => toast({ title: "Unable to remove contact", description: e.message, variant: "destructive" }),
  });

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      toast({ title: "File too large", description: "Please import a file under 2 MB.", variant: "destructive" });
    } else if (/\.xlsx?$/i.test(file.name)) {
      toast({
        title: "Excel files aren't supported",
        description: "In Excel, choose Save As, CSV, then import that file.",
        variant: "destructive",
      });
    } else {
      setText(await file.text());
    }
    if (fileRef.current) fileRef.current.value = ""; // allow re-selecting the same file
  };

  const parsed = parseLines(text);
  const contacts = contactsQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Contacts in {audience?.name}</DialogTitle>
          <DialogDescription>
            These are the people a campaign sends to. Numbers are normalized automatically (06..., 07..., +212...).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="contacts-text" className="text-sm font-medium text-foreground">Add contacts</label>
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt,text/csv,text/plain"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={addMutation.isPending}>
                <FileUp className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            </>
          </div>
          <Textarea
            id="contacts-text"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"One per line, or import a CSV:\nAhmed, 0612345678\nSara, +212700000000"}
            className="resize-none font-mono text-sm"
            disabled={addMutation.isPending}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {parsed.length.toLocaleString()} line{parsed.length === 1 ? "" : "s"} ready. Review them, then add.
            </p>
            <Button
              onClick={() => addMutation.mutate(parsed)}
              disabled={!parsed.length || addMutation.isPending}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {addMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Add contacts
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Only add customers who agreed to receive WhatsApp messages from your store.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Current contacts ({contacts.length})</p>
          {contactsQuery.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : contactsQuery.isError ? (
            <p className="text-sm text-destructive">Unable to load contacts. {(contactsQuery.error as Error).message}</p>
          ) : contacts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              No contacts yet. Add some above before sending a campaign to this audience.
            </p>
          ) : (
            <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {contacts.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{c.name || "No name"}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">{c.phone_number}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${c.name || c.phone_number}`}
                    onClick={() => removeMutation.mutate(c.id)}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}