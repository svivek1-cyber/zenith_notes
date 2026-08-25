import React from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import TodoVersionControl from "../components/Todo_VersionControl";
import Content from "../components/Content";
import { request } from "../AuthContext";

export default function Notes() {
  const [isSummaryVisible, setIsSummaryVisible] = React.useState(false);
  const summaryHandler = () => {
    setIsSummaryVisible((isVisible) => !isVisible);
  };
  const [summary, setSummary] = React.useState(null);
  const [notes, setNotes] = React.useState([]);
  const [binNotes, setBinNotes] = React.useState([]);
  const [binFolders, setBinFolders] = React.useState([]);
  const [folders, setFolders] = React.useState([]);
  const [selectedFolderId, setSelectedFolderId] = React.useState(null);
  const [isBin, setIsBin] = React.useState(false);
  const [selectedNoteId, setSelectedNoteId] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [isTodoPanelVisible, setIsTodoPanelVisible] = React.useState(true);

  React.useEffect(() => {
    Promise.all([request("/notes"), request("/folders"), request("/bin")])
      .then(async ([data, folderData, binData]) => {
        setFolders(folderData.folders);
        setBinNotes(binData.notes);
        setBinFolders(binData.folders || []);
        if (data.notes.length) {
          setNotes(data.notes);
          setSelectedNoteId(data.notes[0]._id);
          return;
        }
        const created = await request("/notes", {
          method: "POST",
          body: JSON.stringify({
            title: "Untitled Note",
            body: "",
            tags: [],
            isPinned: false,
            status: "Draft",
          }),
        });
        setNotes([created.note]);
        setSelectedNoteId(created.note._id);
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setIsLoading(false));
  }, []);

  const note = notes.find((item) => item._id === selectedNoteId) || null;

  const visibleNotes = selectedFolderId === "unfiled"
    ? notes.filter((item) => !item.folderId)
    : selectedFolderId
      ? notes.filter((item) => item.folderId === selectedFolderId)
      : notes;

  const createNote = async () => {
    if (isBin) return;
    try {
      const data = await request("/notes", {
        method: "POST",
        body: JSON.stringify({
          title: "Untitled Note",
          body: "",
          ...(selectedFolderId && selectedFolderId !== "unfiled" ? { folderId: selectedFolderId } : {}),
          tags: [],
          isPinned: false,
          status: "Draft",
        }),
      });
      setNotes((currentNotes) => [data.note, ...currentNotes]);
      setSelectedNoteId(data.note._id);
    } catch (createError) {
      setError(createError.message);
    }
  };

  const createFolder = async () => {
    const name = window.prompt("Project name");
    if (!name?.trim()) return;
    try {
      const data = await request("/folders", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      });
      setFolders((currentFolders) => [...currentFolders, data.folder]);
      setSelectedFolderId(data.folder._id);
      setSelectedNoteId(null);
    } catch (createError) {
      setError(createError.message);
    }
  };

  const deleteNote = async (noteToDelete) => {
    if (!window.confirm(`Delete "${noteToDelete.title || "Untitled Note"}"?`)) return;
    try {
      await request(`/notes/${noteToDelete._id}`, { method: "DELETE" });
      const remainingNotes = notes.filter((item) => item._id !== noteToDelete._id);
      setNotes(remainingNotes);
      setBinNotes((currentBin) => [{ ...noteToDelete, deletedAt: new Date() }, ...currentBin]);
      if (selectedNoteId === noteToDelete._id) {
        const nextNotes = selectedFolderId === "unfiled"
          ? remainingNotes.filter((item) => !item.folderId)
          : selectedFolderId
            ? remainingNotes.filter((item) => item.folderId === selectedFolderId)
            : remainingNotes;
        setSelectedNoteId(nextNotes[0]?._id || null);
        setSummary(null);
      }
      setError("");
      setIsBin(false);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const restoreNote = async (noteToRestore) => {
    try {
      const data = await request(`/bin/${noteToRestore._id}/restore`, { method: "POST" });
      setBinNotes((currentBin) => currentBin.filter((item) => item._id !== noteToRestore._id));
      setNotes((currentNotes) => [data.note, ...currentNotes]);
      setIsBin(false);
      setSelectedNoteId(data.note._id);
      setError("");
    } catch (restoreError) {
      setError(restoreError.message);
    }
  };

  const restoreFolder = async (folderToRestore) => {
    try {
      const data = await request(`/bin/folders/${folderToRestore._id}/restore`, { method: "POST" });
      setBinFolders((currentBin) => currentBin.filter((folder) => folder._id !== folderToRestore._id));
      setBinNotes((currentBin) => currentBin.filter((item) => String(item.folderId) !== String(folderToRestore._id)));
      setFolders((currentFolders) => [...currentFolders, data.folder]);
      const restoredNotes = binNotes.filter((item) => String(item.folderId) === String(folderToRestore._id));
      setNotes((currentNotes) => [...restoredNotes.map(({ deletedAt, ...note }) => note), ...currentNotes]);
      setIsBin(false);
      setSelectedFolderId(data.folder._id);
      setSelectedNoteId(restoredNotes[0]?._id || null);
      setError("");
    } catch (restoreError) {
      setError(restoreError.message);
    }
  };

  const permanentlyDeleteFolder = async (folderToDelete) => {
    if (!window.confirm(`Delete project "${folderToDelete.name}" and all its notes permanently?`)) return;
    try {
      await request(`/bin/folders/${folderToDelete._id}`, { method: "DELETE" });
      setBinFolders((currentBin) => currentBin.filter((folder) => folder._id !== folderToDelete._id));
      setBinNotes((currentBin) => currentBin.filter((item) => String(item.folderId) !== String(folderToDelete._id)));
      setError("");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const permanentlyDeleteNote = async (noteToDelete) => {
    if (!window.confirm(`Delete "${noteToDelete.title || "Untitled Note"}" permanently?`)) return;
    try {
      await request(`/bin/${noteToDelete._id}`, { method: "DELETE" });
      setBinNotes((currentBin) => currentBin.filter((item) => item._id !== noteToDelete._id));
      setError("");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const emptyBin = async () => {
    if (!window.confirm("Permanently delete all notes in Bin?")) return;
    try {
      await request("/bin", { method: "DELETE" });
      setBinNotes([]);
      setBinFolders([]);
      setError("");
    } catch (emptyError) {
      setError(emptyError.message);
    }
  };

  const deleteFolder = async (folderToDelete) => {
    if (!window.confirm(`Delete project "${folderToDelete.name}"? Its notes will be moved to Bin.`)) return;
    try {
      await request(`/folders/${folderToDelete._id}`, { method: "DELETE" });
      const [data, folderData, binData] = await Promise.all([
        request("/notes"),
        request("/folders"),
        request("/bin"),
      ]);
      setNotes(data.notes);
      setFolders(folderData.folders);
      setBinNotes(binData.notes);
      setBinFolders(binData.folders || []);
      const remainingNotes = data.notes;
      if (selectedFolderId === folderToDelete._id) {
        setSelectedFolderId(null);
        setSelectedNoteId(remainingNotes[0]?._id || null);
        setSummary(null);
      } else if (!remainingNotes.some((item) => item._id === selectedNoteId)) {
        setSelectedNoteId(remainingNotes[0]?._id || null);
        setSummary(null);
      }
      setError("");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const selectFolder = (folderId) => {
    setIsBin(false);
    setSelectedFolderId(folderId);
    const nextNotes = folderId === "unfiled"
      ? notes.filter((item) => !item.folderId)
      : folderId
        ? notes.filter((item) => item.folderId === folderId)
        : notes;
    setSelectedNoteId(nextNotes[0]?._id || null);
    setSummary(null);
  };

  const selectBin = () => {
    setIsBin(true);
    setSelectedFolderId(null);
    setSelectedNoteId(null);
    setSummary(null);
  };

  const updateNote = (updatedNote) =>
    setNotes((currentNotes) =>
      currentNotes.map((item) =>
        item._id === updatedNote._id ? updatedNote : item,
      ),
    );

  const togglePin = async () => {
    if (!note) return;
    try {
      const data = await request(`/notes/${note._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      updateNote(data.note);
    } catch (pinError) {
      setError(pinError.message);
    }
  };

  const handleSaveAndEditNote = () => {
    setIsEditing((editing) => !editing);
  };

  const todoVersionControlViewHandler = () => {
    setIsTodoPanelVisible((isVisible) => !isVisible);
  };

  return (
    <>
      <div className="bg-surface font-body-md text-on-surface">
        <Sidebar
          notes={visibleNotes}
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={selectFolder}
          onNewFolder={createFolder}
          onDeleteFolder={deleteFolder}
          onDeleteNote={deleteNote}
          binNotes={binNotes}
          binFolders={binFolders}
          isBin={isBin}
          onSelectBin={selectBin}
          onRestoreNote={restoreNote}
          onRestoreFolder={restoreFolder}
          onPermanentlyDeleteNote={permanentlyDeleteNote}
          onPermanentlyDeleteFolder={permanentlyDeleteFolder}
          onEmptyBin={emptyBin}
          selectedNoteId={selectedNoteId}
          onSelectNote={setSelectedNoteId}
          onNewNote={createNote}
        />
        <div className="pl-72">
          <Header summaryHandler={summaryHandler} />
          <main className="pt-16 bg-surface h-screen overflow-hidden">
            <div className="flex flex-col w-full h-full min-h-0 relative">
              {/* <!-- Content Area --> */}
              <div className="flex flex-1 h-full min-h-0 overflow-hidden">
                {/* <!-- Editor Canvas --> */}
                {isLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    Loading notes...
                  </div>
                ) : error ? (
                  <div className="flex-1 flex items-center justify-center text-error">
                    {error}
                  </div>
                ) : !note ? (
                  <div className="flex-1 flex items-center justify-center">
                    Preparing note...
                  </div>
                ) : (
                  <>
                    <Content
                      note={note}
                      onNoteChange={updateNote}
                      onTogglePin={togglePin}
                      handleSaveAndEditNote={handleSaveAndEditNote}
                      isEditing={isEditing}
                      isTodoPanelVisible={isTodoPanelVisible}
                    />
                    {/* Todo Version Control Toggle Button */}
                    <button
                      type="button"
                      className="shrink-0 self-center h-20 py-2 px-1 border-y border-l border-outline-variant rounded-l-md text-on-surface-variant hover:text-primary transition-colors"
                      title={isTodoPanelVisible ? "Hide task panel" : "Show task panel"}
                      aria-label={isTodoPanelVisible ? "Hide task panel" : "Show task panel"}
                      onClick={todoVersionControlViewHandler}
                    >
                      {isTodoPanelVisible ? ">" : "<"}
                    </button>
                    {/* <!-- Right Side Panel (AI Summary & Version History) --> */}
                    {isTodoPanelVisible && <div className="h-full min-h-0 shrink-0">
                      <TodoVersionControl
                        isSummaryVisible={isSummaryVisible}
                        summary={summary}
                        noteId={note._id}
                        note={note}
                        onNoteChange={updateNote}
                        onSummaryChange={setSummary}
                        handleSaveAndEditNote={handleSaveAndEditNote}
                      />
                    </div>}
                  </>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
