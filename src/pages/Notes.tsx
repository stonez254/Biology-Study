import { useEffect, useMemo, useState } from "react";

type Note = { id: string; title: string; body: string; createdAt: string; updatedAt: string };

function notesKey(accountId?: string) {
  return accountId ? `eugenes-biology:notes:${accountId}` : "eugenes-biology:notes:guest";
}
function readNotes(key: string): Note[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter((n): n is Note => Boolean(n && typeof n.id === "string" && typeof n.title === "string" && typeof n.body === "string")) : [];
  } catch { return []; }
}
function safePdfText(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "?");
}
function pdfEscape(value: string) {
  return safePdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
function wrapLine(value: string, max = 88) {
  const words = safePdfText(value).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (!word) continue;
    if (line && (line + " " + word).length > max) { lines.push(line); line = word; }
    else line = line ? line + " " + word : word;
  }
  lines.push(line);
  return lines;
}
function downloadPdf(note: Note) {
  const lines = [note.title, `Saved from Eugine's Biology | Updated ${new Date(note.updatedAt).toLocaleString()}`, "", ...note.body.split(/\r?\n/).flatMap(line => line ? wrapLine(line) : [""])];
  const pages: string[][] = [];
  for (let i = 0; i < lines.length; i += 48) pages.push(lines.slice(i, i + 48));
  if (!pages.length) pages.push([]);
  const objects: string[] = [];
  const pageIds = pages.map((_, i) => 4 + i * 2);
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  pages.forEach((page, index) => {
    const pageId = 4 + index * 2;
    const streamId = pageId + 1;
    let stream = "BT\n/F1 11 Tf\n50 790 Td\n14 TL\n";
    page.forEach((line, lineIndex) => {
      if (index === 0 && lineIndex === 0) stream += "/F1 18 Tf\n(" + pdfEscape(line) + ") Tj\n/F1 11 Tf\n0 -22 Td\n";
      else stream += "(" + pdfEscape(line) + ") Tj\nT*\n";
    });
    stream += "ET";
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`);
    objects.push(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`);
  });
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, i) => {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { pdf += String(offset).padStart(10, "0") + " 00000 n \n"; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = (note.title.trim() || "biology-notes").replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60) + ".pdf";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function Notes({ accountId }: { accountId?: string }) {
  const key = useMemo(() => notesKey(accountId), [accountId]);
  const [notes, setNotes] = useState<Note[]>(() => readNotes(key));
  const [selectedId, setSelectedId] = useState<string | null>(() => readNotes(key)[0]?.id ?? null);
  const [title, setTitle] = useState(() => readNotes(key)[0]?.title ?? "");
  const [body, setBody] = useState(() => readNotes(key)[0]?.body ?? "");
  const [status, setStatus] = useState("Your notes are saved on this device.");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const saved = readNotes(key);
    setNotes(saved);
    setSelectedId(saved[0]?.id ?? null);
    setTitle(saved[0]?.title ?? "");
    setBody(saved[0]?.body ?? "");
    setStatus("Your notes are saved on this device.");
  }, [key]);

  const selected = notes.find(note => note.id === selectedId) ?? null;
  const filtered = notes.filter(note => (note.title + " " + note.body).toLowerCase().includes(search.toLowerCase()));
  const startNew = () => { setSelectedId(null); setTitle(""); setBody(""); setStatus("New note. Save it when you're ready."); };
  const openNote = (note: Note) => { setSelectedId(note.id); setTitle(note.title); setBody(note.body); setStatus("Note opened."); };
  const save = () => {
    if (!title.trim() && !body.trim()) { setStatus("Write a title or some note content before saving."); return; }
    const now = new Date().toISOString();
    const note: Note = { id: selectedId ?? crypto.randomUUID(), title: title.trim() || "Untitled note", body, createdAt: selected?.createdAt ?? now, updatedAt: now };
    const next = selectedId ? notes.map(item => item.id === selectedId ? note : item) : [note, ...notes];
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setNotes(next);
      setSelectedId(note.id);
      setTitle(note.title);
      setStatus("Saved successfully on this device.");
    } catch {
      setStatus("Could not save. Your device storage may be full.");
    }
  };
  const remove = () => {
    if (!selected) return;
    const next = notes.filter(note => note.id !== selected.id);
    localStorage.setItem(key, JSON.stringify(next));
    setNotes(next);
    setSelectedId(next[0]?.id ?? null);
    setTitle(next[0]?.title ?? "");
    setBody(next[0]?.body ?? "");
    setStatus("Note deleted.");
  };

  return <div className="content notes-page">
    <div className="section-heading"><div><span className="eyebrow">PERSONAL STUDY SPACE</span><h2>Notes</h2><p className="muted">Write, save, organize, and download your Biology notes as PDF files.</p></div><button className="primary-button" onClick={startNew}>＋ New note</button></div>
    <div className="notes-layout">
      <aside className="panel notes-library">
        <label className="notes-search-label" htmlFor="notes-search">Search notes</label>
        <input id="notes-search" className="notes-input" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search your notes..." />
        <div className="notes-list-heading"><strong>Your notes</strong><span>{notes.length}</span></div>
        {filtered.length ? filtered.map(note => <button key={note.id} className={selectedId === note.id ? "note-list-item selected" : "note-list-item"} onClick={() => openNote(note)}><strong>{note.title}</strong><span>{note.body.trim().slice(0, 76) || "No note content yet"}</span><small>{new Date(note.updatedAt).toLocaleDateString()}</small></button>) : <p className="muted notes-empty">{search ? "No notes match your search." : "No saved notes yet. Create your first note."}</p>}
      </aside>
      <section className="panel note-editor">
        <div className="note-editor-top"><div><span className="eyebrow">{selected ? "EDITING SAVED NOTE" : "NEW NOTE"}</span><h3>{selected ? "Keep learning" : "Start writing"}</h3></div><span className="note-save-status">{status}</span></div>
        <label htmlFor="note-title">Note title</label>
        <input id="note-title" className="notes-input note-title-input" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Cell structure and functions" maxLength={140} />
        <label htmlFor="note-body">Your notes</label>
        <textarea id="note-body" className="notes-textarea" value={body} onChange={event => setBody(event.target.value)} placeholder="Write your notes here...\n\nYou can include definitions, examples, revision summaries, and questions." />
        <div className="note-editor-footer"><span>{body.trim() ? body.trim().split(/\s+/).length : 0} words</span><div className="note-actions"><button className="secondary-button" onClick={save}>Save note</button><button className="primary-button" disabled={!selected && !title.trim() && !body.trim()} onClick={() => { const note = selected ?? { id: "draft", title: title.trim() || "Untitled note", body, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; downloadPdf({ ...note, title: title.trim() || note.title, body }); }}>Download PDF</button>{selected && <button className="danger-button" onClick={remove}>Delete</button>}</div></div>
        <p className="muted notes-storage-note">Notes are stored locally in this browser and kept separate for each signed-in account on this device. Download important notes for backup.</p>
      </section>
    </div>
  </div>;
}
