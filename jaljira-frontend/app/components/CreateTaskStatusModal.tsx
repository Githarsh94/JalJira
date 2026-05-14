import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createTaskStatus } from "../lib/api";

interface CreateTaskStatusModalProps {
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const STATUS_SUGGESTIONS = [
  { type: "Backlog", description: "Tasks waiting to be started" },
  { type: "To-Do", description: "Tasks ready to be worked on" },
  { type: "In-Progress", description: "Tasks currently being worked on" },
  { type: "In-Review", description: "Tasks waiting for review" },
  { type: "Completed", description: "Finished tasks" },
  { type: "Stretch-Goal", description: "Optional stretch goals" },
];

export default function CreateTaskStatusModal({
  teamId,
  isOpen,
  onClose,
  onSuccess,
}: CreateTaskStatusModalProps) {
  const [statusType, setStatusType] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusType.trim()) {
      setError("Status type is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await createTaskStatus(teamId, statusType, description);

      if (response.success) {
        onSuccess(`Task status "${statusType}" created successfully`);
        setStatusType("");
        setDescription("");
        onClose();
      } else {
        setError(response.error || "Failed to create task status");
      }
    } catch (err) {
      setError("An error occurred while creating the task status");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            Create Task Status
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Status Type <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={statusType}
              onChange={(e) => setStatusType(e.target.value)}
              placeholder="e.g., Backlog, In-Progress"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this status means..."
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Quick suggestions */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Quick suggestions:</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {STATUS_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.type}
                  type="button"
                  onClick={() => {
                    setStatusType(suggestion.type);
                    setDescription(suggestion.description);
                  }}
                  className="w-full text-left px-2 py-1 text-xs bg-background/50 border border-border rounded hover:bg-background hover:border-primary/50 transition-colors"
                >
                  <p className="font-medium text-foreground">{suggestion.type}</p>
                  <p className="text-muted-foreground text-xs">{suggestion.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Status"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
