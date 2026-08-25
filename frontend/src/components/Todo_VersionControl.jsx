import React, { useEffect, useState } from "react";
import { request } from "../AuthContext";

export default function TodoVersionControl({
  isSummaryVisible,
  summary,
  noteId,
  note,
  onNoteChange,
  onSummaryChange,
  handleSaveAndEditNote,
  todoVersionControlRef,
}) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [versions, setVersions] = useState([]);
  const [restoringVersion, setRestoringVersion] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError("");
    Promise.all([
      request(`/notes/${noteId}/tasks`),
    ])
      .then(([taskData]) => {
        setTasks(taskData.tasks);
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setIsLoading(false));
  }, [noteId]);

  useEffect(() => {
    Promise.all([
      request(`/notes/${noteId}/versions`),
    ])
      .then(([versionData]) => {
        setVersions(versionData.versions);
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setIsLoading(false));
  }, [handleSaveAndEditNote]);

  const addTask = async (event) => {
    event.preventDefault();
    const title = newTask.trim();
    if (!title) return;
    try {
      const data = await request(`/notes/${noteId}/tasks`, {
        method: "POST",
        body: JSON.stringify({ title, completed: false }),
      });
      setTasks((currentTasks) => [data.task, ...currentTasks]);
      setNewTask("");
      setError("");
    } catch (taskError) {
      setError(taskError.message);
    }
  };

  const restoreVersion = async (versionId) => {
    setRestoringVersion(versionId);
    try {
      const data = await request(
        `/notes/${noteId}/versions/${versionId}/restore`,
        { method: "POST" },
      );
      onNoteChange(data.note);
      setVersions((currentVersions) => [
        {
          _id: data.note._id,
          title: note.title,
          body: note.body,
          createdAt: new Date(),
        },
        ...currentVersions,
      ]);
      setError("");
    } catch (restoreError) {
      setError(restoreError.message);
    } finally {
      setRestoringVersion(null);
    }
  };

  const toggleTask = async (task) => {
    try {
      const data = await request(`/tasks/${task._id}`, {
        method: "PATCH",
        body: JSON.stringify({ completed: !task.completed }),
      });
      setTasks((currentTasks) =>
        currentTasks.map((item) => (item._id === task._id ? data.task : item)),
      );
    } catch (taskError) {
      setError(taskError.message);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await request(`/tasks/${taskId}`, { method: "DELETE" });
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task._id !== taskId),
      );
    } catch (taskError) {
      setError(taskError.message);
    }
  };

  const analyzeNote = async () => {
    setIsAnalyzing(true);
    try {
      const data = await request(`/notes/${noteId}/analyze`, {
        method: "POST",
      });
      onSummaryChange(data.summary);
      const existingTitles = new Set(
        tasks.map((task) => task.title.toLowerCase()),
      );
      const generatedTasks = [];
      for (const title of data.actionItems) {
        if (existingTitles.has(title.toLowerCase())) continue;
        const taskData = await request(`/notes/${noteId}/tasks`, {
          method: "POST",
          body: JSON.stringify({ title, completed: false }),
        });
        generatedTasks.push(taskData.task);
      }
      setTasks((currentTasks) => [...generatedTasks, ...currentTasks]);
      setError("");
    } catch (analysisError) {
      setError(analysisError.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pendingCount = tasks.filter((task) => !task.completed).length;

  return (
    <div ref={todoVersionControlRef} className="w-95 h-full min-h-0 bg-surface-container-lowest border-l border-outline-variant flex flex-col shrink-0 sticky top-0 z-10 overflow-hidden">
      <div className="p-inset-md border-b border-outline-variant flex items-center bg-surface/50 backdrop-blur-md sticky top-0 z-10">
        <h3 className="font-headline-sm text-headline-sm text-on-surface text-[18px] leading-tight">
          Todo Task &amp; version Control
        </h3>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isSummaryVisible && (
          <div className="p-inset-md border-b border-outline-variant">
            <div className="flex items-center justify-between mb-stack-sm">
              <h4 className="font-label-caps text-label-caps text-outline uppercase tracking-wider">
                AI Summary
              </h4>
              <button
                type="button"
                onClick={analyzeNote}
                disabled={isAnalyzing}
                className="text-primary text-xs font-semibold disabled:opacity-50"
                title="Analyze note"
              >
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </button>
            </div>
            <p className="font-body-sm text-[13px] text-on-surface-variant leading-relaxed">
              {summary}
            </p>
          </div>
        )}

        <div className="p-inset-md border-b border-outline-variant bg-primary-fixed/30">
          <div className="flex items-center justify-between mb-stack-md">
            <h4 className="font-label-caps text-label-caps text-primary uppercase tracking-wider font-bold">
              Action Items
            </h4>
            <span className="px-2 py-0.5 bg-primary text-on-primary rounded-full font-body-sm text-[11px] font-medium">
              {pendingCount} Pending
            </span>
          </div>
          
          {isLoading ? (
            <p className="text-sm text-on-surface-variant">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              No tasks for this note yet.
            </p>
          ) : (
            <div className="space-y-stack-sm max-h-50 overflow-y-auto">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-start gap-3 p-3 bg-surface-container-lowest rounded-lg shadow-sm group"
                >
                  <input
                    className="mt-1 w-4 h-4 rounded border-outline text-primary focus:ring-primary accent-primary"
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task)}
                    aria-label={`Mark ${task.title} complete`}
                  />
                  <span
                    className={`flex-1 font-body-sm text-[13px] text-on-surface ${task.completed ? "line-through text-on-surface-variant" : ""}`}
                  >
                    {task.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteTask(task._id)}
                    className="text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete task"
                    aria-label={`Delete ${task.title}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      delete
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={addTask} className="flex gap-2 mt-stack-md">
            <input
              value={newTask}
              onChange={(event) => setNewTask(event.target.value)}
              placeholder="Add a task"
              aria-label="New task"
              className="min-w-0 flex-1 px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90"
              title="Add task"
              aria-label="Add task"
            >
              <span className="material-symbols-outlined text-[18px]">
                add_task
              </span>
            </button>
          </form>
        </div>

        <div className="p-inset-md">
          <h4 className="font-label-caps text-label-caps text-outline uppercase mb-stack-md tracking-wider">
            Version History
          </h4>
          {error && (
            <p role="alert" className="mb-3 text-xs text-error">
              {error}
            </p>
          )}
          {versions.length === 0 ? (
            <p className="text-sm text-on-surface-variant">
              No previous versions yet.
            </p>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <div key={version._id} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
                    history
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-body-sm text-[13px] text-on-surface truncate">
                      {version.title}
                    </p>
                    <p className="font-body-sm text-[12px] text-on-surface-variant">
                      {new Date(version.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => restoreVersion(version._id)}
                    disabled={restoringVersion !== null}
                    className="text-primary text-xs font-medium disabled:opacity-50"
                    title="Restore this version"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
