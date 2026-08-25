import React, { useEffect, useState } from "react";
import MarkdownEditor from "./MarkdownEditor";
import { request } from "../AuthContext";

export default function Content({ note, onNoteChange, onTogglePin, handleSaveAndEditNote, isEditing, isTodoPanelVisible }) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body || "");
  const [saveState, setSaveState] = useState("Saved");
  const [isSaving, setIsSaving] = useState(false);
  const editedDate = new Date(note.updatedAt).toLocaleDateString();

  useEffect(() => {
    setTitle(note.title);
    setBody(note.body || "");
  }, [note._id, note.title, note.body]);

  const saveNote = async () => {
    if (isSaving) return;
    setSaveState("Saving...");
    setIsSaving(true);
    try {
      const data = await request(`/notes/${note._id}`, {
        method: "PATCH",
        body: JSON.stringify({ title, body }),
      });
      onNoteChange(data.note);
      setSaveState("Saved");
    } catch (_error) {
      setSaveState("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (isEditing && (title !== note.title || body !== (note.body || ""))) {
      setSaveState("Unsaved changes");
    }
  }, [title, body, isEditing, note.title, note.body]);

  return (
    <div className="relative flex-1 min-w-0 min-h-0 overflow-y-auto px-12 py-16">
      <div className="max-w-200 mx-auto">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          aria-label="Note title"
          className="w-full bg-transparent border-0 p-0 font-display-lg text-display-lg text-on-surface mb-stack-md outline-none font-black text-4xl"
          placeholder="Untitled Note"
        />
        <div className="flex items-center gap-2 my-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">
            calendar_today
          </span>
          <span className="font-body-sm text-body-sm">
            Last edited: {editedDate} | {saveState}
          </span>
          <span className="px-2 py-0.5 bg-surface-container rounded font-label-caps text-[10px] uppercase ml-2">
            {note.status}
          </span>
          <button
            type="button"
            onClick={onTogglePin}
            className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-surface-container-high transition-colors"
            title={note.isPinned ? "Unpin note" : "Pin note"}
            aria-label={note.isPinned ? "Unpin note" : "Pin note"}
          >
            <span className="material-symbols-outlined text-[18px]">
              {note.isPinned ? "keep_off" : "push_pin"}
            </span>
            {/* <span className="text-xs">{note.isPinned ? "Pinned" : "Pin"}</span> */}
          </button>
        </div>

        <hr className="py-2 text-outline-variant" />

        {isEditing ? (
          <MarkdownEditor content={body} onChange={setBody} />
        ) : (
          <div
            className="rich-text-output prose max-w-none font-body-md text-on-surface space-y-stack-md outline-none"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        )}
      </div>
      <div>
        <button
          type="button"
          disabled={isSaving}
          onClick={async () => {
            if (isEditing) await saveNote();
            handleSaveAndEditNote();
          }}
          aria-label={isEditing ? "Save document" : "Edit document"}
          title={isEditing ? "Save" : "Edit"}
          style={{ right: isTodoPanelVisible ? "396px" : "20px" }}
          className="fixed bottom-5 z-20 px-2 py-2 bg-primary border-black text-on-primary font-body-sm text-body-sm font-semibold rounded-full hover:bg-primary/90 transition-[right] duration-200 disabled:opacity-60 disabled:cursor-wait"
        >
            {isEditing ? (
              <svg
                xmlns="http://w3.org"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
            ) : (
              <svg
                xmlns="http://w3.org"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75z"></path>
              </svg>
            )}
        </button>
      </div>
    </div>
  );
}
