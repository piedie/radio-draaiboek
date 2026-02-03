import React from "react";
import { createRundown, listRundowns, RundownRow } from "./rundownsApi";

export function RundownList(props: { onOpen: (id: string) => void }) {
  const [items, setItems] = React.useState<RundownRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      setItems(await listRundowns());
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    refresh();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const cleanTitle = title.trim();
      if (!cleanTitle) return;

      await createRundown({ title: cleanTitle, rundown_date: date || null });
      setTitle("");
      setDate("");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? String(e));
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Draaiboeken</h1>

      <form onSubmit={onCreate} style={{ display: "flex", gap: 12, alignItems: "end", marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 12, opacity: 0.8 }}>Titel</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Bijv. Nieuws 12:00"
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </div>
        <div style={{ width: 180 }}>
          <label style={{ display: "block", fontSize: 12, opacity: 0.8 }}>Datum</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </div>
        <button style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff" }}>
          Nieuw draaiboek
        </button>
      </form>

      {error && (
        <div style={{ padding: 12, borderRadius: 10, background: "#ffe9e9", border: "1px solid #ffb3b3", marginBottom: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div>Bezig met laden…</div>
      ) : items.length === 0 ? (
        <div style={{ opacity: 0.8 }}>Nog geen draaiboeken. Maak er boven één aan.</div>
      ) : (
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, overflow: "hidden" }}>
          {items.map((r) => (
            <button
              key={r.id}
              onClick={() => props.onOpen(r.id)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: 14,
                border: "none",
                borderBottom: "1px solid #eee",
                background: "white",
                cursor: "pointer",
              }}
            >
              <div style={{ fontWeight: 650 }}>{r.title}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {r.rundown_date ? `Datum: ${r.rundown_date}` : "Geen datum"} • {new Date(r.created_at).toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
