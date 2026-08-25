import React, { useState } from "react";

export default function Sidebar({
  notes,
  folders,
  selectedFolderId,
  onSelectFolder,
  onNewFolder,
  onDeleteFolder,
  onDeleteNote,
  selectedNoteId,
  onSelectNote,
  onNewNote,
  binNotes,
  isBin,
  onSelectBin,
  onRestoreNote,
  onPermanentlyDeleteNote,
  onEmptyBin,
}) {
  const [search, setSearch] = useState("");
  const folderNotes = selectedFolderId === "unfiled"
    ? notes.filter((note) => !note.folderId)
    : selectedFolderId
      ? notes.filter((note) => note.folderId === selectedFolderId)
      : notes;
    const filteredNotes = folderNotes.filter((note) =>
    note.title.toLowerCase().includes(search.toLowerCase()),
  );
  const pinnedNotes = filteredNotes.filter((note) => note.isPinned);

  const noteLink = (note) => (
    <div key={note._id} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${selectedNoteId === note._id ? "bg-secondary-container text-on-secondary-container font-semibold" : "text-on-surface-variant hover:bg-surface-container-high"}`}>
        <button type="button" onClick={() => onSelectNote(note._id)} className="min-w-0 flex-1 flex items-center gap-3 text-left">
          <span className="material-symbols-outlined text-[20px]">{isBin ? "delete" : note.isPinned ? "push_pin" : "description"}</span>
        <span className="font-body-sm text-body-sm truncate">{note.title || "Untitled Note"}</span>
      </button>
        {isBin ? (
          <>
            <button type="button" onClick={() => onRestoreNote(note)} className="shrink-0 text-on-surface-variant hover:text-primary" title="Restore note" aria-label={`Restore ${note.title || "Untitled Note"}`}>
              <span className="material-symbols-outlined text-[18px]">restore</span>
            </button>
            <button type="button" onClick={() => onPermanentlyDeleteNote(note)} className="shrink-0 text-on-surface-variant hover:text-error" title="Delete permanently" aria-label={`Delete ${note.title || "Untitled Note"} permanently`}>
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
            </button>
          </>
        ) : (
          <button type="button" onClick={() => onDeleteNote(note)} className="shrink-0 text-on-surface-variant hover:text-error" title="Move to Bin" aria-label={`Move ${note.title || "Untitled Note"} to Bin`}>
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        )}
    </div>
  );

  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col border-r border-outline-variant">
      <div className="p-inset-md flex items-center gap-3 mb-stack-md">
        <div className="h-8 w-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold">
          Z
        </div>
        <span className="font-headline-sm text-headline-sm text-primary tracking-tight">
          Zenith
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-inset-md space-y-stack-lg">
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-high text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px]">search</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notes"
            aria-label="Search notes"
            className="min-w-0 w-full bg-transparent outline-none text-sm"
          />
        </label>
        <button type="button" onClick={onSelectBin} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${isBin ? "bg-secondary-container text-on-secondary-container font-semibold" : "text-on-surface-variant hover:bg-surface-container-high"}`}>
          <span className="material-symbols-outlined text-[20px]">delete</span>
          <span className="font-body-sm text-body-sm">Bin {binNotes.length ? `(${binNotes.length})` : ""}</span>
        </button>
        <div className={isBin ? "hidden" : ""}>
          <div className="flex items-center justify-between px-3 mb-stack-sm">
            <p className="font-label-caps text-label-caps text-outline uppercase">
              Projects
            </p>
            <button type="button" onClick={onNewFolder} className="text-primary hover:text-primary/70" title="New project" aria-label="New project">
              <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
            </button>
          </div>
          <nav className="space-y-stack-xs">
            <button type="button" onClick={() => onSelectFolder(null)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${!selectedFolderId ? "bg-secondary-container text-on-secondary-container font-semibold" : "text-on-surface-variant hover:bg-surface-container-high"}`}>
              <span className="material-symbols-outlined text-[20px]">apps</span>
              <span className="font-body-sm text-body-sm">All Notes</span>
            </button>
            {folders.map((folder) => (
              <div key={folder._id} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg ${selectedFolderId === folder._id ? "bg-secondary-container text-on-secondary-container font-semibold" : "text-on-surface-variant hover:bg-surface-container-high"}`}>
                <button type="button" onClick={() => onSelectFolder(folder._id)} className="min-w-0 flex-1 flex items-center gap-3 text-left">
                  <span className="material-symbols-outlined text-[20px]">folder</span>
                  <span className="font-body-sm text-body-sm truncate">{folder.name}</span>
                </button>
                <button type="button" onClick={() => onDeleteFolder(folder)} className="shrink-0 text-on-surface-variant hover:text-error" title="Delete project" aria-label={`Delete ${folder.name}`}>
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
            <button type="button" onClick={() => onSelectFolder("unfiled")} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left ${selectedFolderId === "unfiled" ? "bg-secondary-container text-on-secondary-container font-semibold" : "text-on-surface-variant hover:bg-surface-container-high"}`}>
              <span className="material-symbols-outlined text-[20px]">folder_open</span>
              <span className="font-body-sm text-body-sm">Unfiled</span>
            </button>
          </nav>
        </div>
        <div className={isBin ? "" : "hidden"}>
          <div className="flex items-center justify-between px-3 mb-stack-sm">
            <p className="font-label-caps text-label-caps text-outline uppercase">Deleted Notes</p>
            {binNotes.length > 0 && <button type="button" onClick={onEmptyBin} className="text-xs text-error hover:underline">Empty</button>}
          </div>
          <nav className="space-y-stack-xs">
            {binNotes.length ? binNotes.filter((note) => note.title.toLowerCase().includes(search.toLowerCase())).map(noteLink) : <p className="px-3 text-sm text-on-surface-variant">Bin is empty</p>}
          </nav>
        </div>
        <div className={isBin ? "hidden" : ""}>
          <p className="px-3 mb-stack-sm font-label-caps text-label-caps text-outline uppercase">
            Pinned
          </p>
          <nav className="space-y-stack-xs">
            {pinnedNotes.length ? (
              pinnedNotes.map(noteLink)
            ) : (
              <p className="px-3 text-sm text-on-surface-variant">
                No pinned notes
              </p>
            )}
          </nav>
        </div>
        <div className={isBin ? "hidden" : ""}>
          <p className="px-3 mb-stack-sm font-label-caps text-label-caps text-outline uppercase">
            {selectedFolderId ? "Project Notes" : "All Notes"}
          </p>
          <nav className="space-y-stack-xs">
            {filteredNotes.length ? (
              filteredNotes.map(noteLink)
            ) : (
              <p className="px-3 text-sm text-on-surface-variant">
                No matching notes
              </p>
            )}
          </nav>
        </div>
      </div>
      <div className="p-inset-md border-t border-outline-variant">
        <button
          type="button"
          onClick={onNewNote}
          className="w-full flex items-center justify-center gap-2 bg-primary py-3 rounded-xl text-on-primary font-body-md font-semibold hover:bg-primary-container transition-all shadow-sm"
        >
          <span className="material-symbols-outlined">add</span>New Note
        </button>
      </div>
    </aside>
  );
}
