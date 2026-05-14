"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getOrganizationEpics,
  updateEpic,
  apiFetch,
  type AuthUser,
  type Epic,
} from "../../lib/api";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Zap,
  Calendar,
  X,
  Tag,
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId?: string;
}

export default function EpicsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [filteredEpics, setFilteredEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [epicForm, setEpicForm] = useState({
    title: "",
    description: "",
    teamName: "",
    assignedToName: "",
    assignedToEmail: "",
    createdAt: "",
  });

  useEffect(() => {
    fetchUserAndEpics();
  }, []);

  useEffect(() => {
    if (selectedTeamFilter === "all") {
      setFilteredEpics(epics);
    } else {
      setFilteredEpics(epics.filter((epic) => epic.teamId === selectedTeamFilter));
    }
  }, [selectedTeamFilter, epics]);

  const fetchUserAndEpics = async () => {
    try {
      const userData = await apiFetch<AuthUser>("/api/user/info");
      setUser(userData as any);

      const epicsData = await getOrganizationEpics();
      setEpics(epicsData);
      setFilteredEpics(epicsData);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load epics");
    } finally {
      setLoading(false);
    }
  };

  const openEpicDetails = (epicId: string) => {
    setError(null);
    setSuccess(null);
    const epic = epics.find((item) => item.id === epicId);
    if (!epic) {
      setError("Epic details not found");
      return;
    }

    setSelectedEpicId(epicId);
    setEpicForm({
      title: epic.title || "",
      description: epic.description || "",
      teamName: epic.teamName || "",
      assignedToName: `${epic.assignedTo?.firstName || ""} ${epic.assignedTo?.lastName || ""}`.trim(),
      assignedToEmail: epic.assignedTo?.email || "",
      createdAt: epic.createdAt || "",
    });
    setShowDetailsModal(true);
  };

  const closeEpicDetails = () => {
    if (savingDetails) return;
    setShowDetailsModal(false);
    setSelectedEpicId(null);
  };

  const saveEpicDetails = async () => {
    if (!selectedEpicId) return;
    if (!epicForm.title.trim()) {
      setError("Epic title is required");
      return;
    }

    setSavingDetails(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await updateEpic(
        selectedEpicId,
        epicForm.title.trim(),
        epicForm.description.trim()
      );

      if (!response.success) {
        throw new Error(response.error || "Failed to update epic");
      }

      setEpics((prev) =>
        prev.map((epic) =>
          epic.id === selectedEpicId
            ? { ...epic, title: epicForm.title.trim(), description: epicForm.description.trim() }
            : epic
        )
      );
      setFilteredEpics((prev) =>
        prev.map((epic) =>
          epic.id === selectedEpicId
            ? { ...epic, title: epicForm.title.trim(), description: epicForm.description.trim() }
            : epic
        )
      );

      setSuccess("Epic updated successfully");
      closeEpicDetails();
    } catch (err: any) {
      console.error("Error updating epic:", err);
      if (err?.message === "Unauthorized") {
        setError("Session expired or unauthorized. Please sign in again and retry.");
      } else {
        setError(err.message || "Failed to update epic");
      }
    } finally {
      setSavingDetails(false);
    }
  };

  // Get unique teams from epics
  const uniqueTeams = Array.from(
    new Map(
      epics.map((epic) => [
        epic.teamId,
        { id: epic.teamId, name: epic.teamName },
      ])
    ).values()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Zap className="w-6 h-6 text-primary" />
                Epics
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                View and manage all epics across your organization
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive ml-3">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-500 ml-3">{success}</p>
          </div>
        )}

        {/* Filter Section */}
        {uniqueTeams.length > 0 && (
          <div className="mb-6 bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-foreground">
                Filter by Team:
              </label>
              <select
                value={selectedTeamFilter}
                onChange={(e) => setSelectedTeamFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Teams</option>
                {uniqueTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground ml-auto">
                {filteredEpics.length} epic{filteredEpics.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        )}

        {/* Epics Grid */}
        {filteredEpics.length === 0 ? (
          <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No epics found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedTeamFilter !== "all"
                ? "No epics in this team yet"
                : "Create an epic from a team to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEpics.map((epic) => (
              <div
                key={epic.id}
                className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors hover:shadow-md"
              >
                {/* Epic Title */}
                <div className="mb-3">
                  <h3 className="text-base font-semibold text-foreground truncate">
                    {epic.title}
                  </h3>
                </div>

                {/* Epic Description */}
                {epic.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {epic.description}
                  </p>
                )}

                {/* Team Badge */}
                <div className="mb-3">
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                    <Tag className="w-3 h-3" />
                    {epic.teamName}
                  </div>
                </div>

                {/* Assigned To */}
                <div className="mb-3 p-2 bg-background/50 rounded">
                  <p className="text-xs text-muted-foreground mb-1">
                    Assigned to
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                      {(epic.assignedTo?.firstName?.[0] ||
                        epic.assignedTo?.email?.[0] ||
                        "?").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {epic.assignedTo?.firstName || ""} {epic.assignedTo?.lastName || ""}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {epic.assignedTo?.email || ""}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Created Date */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Created {formatDate(epic.createdAt || new Date().toISOString())}</span>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <button
                    className="flex-1 px-3 py-2 text-xs font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                    onClick={() => openEpicDetails(epic.id)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Epic Details</h2>
                <p className="text-xs text-muted-foreground">Edit and save epic information</p>
              </div>
              <button
                onClick={closeEpicDetails}
                disabled={savingDetails}
                className="p-2 rounded hover:bg-muted transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Title</label>
                  <input
                    type="text"
                    value={epicForm.title}
                    onChange={(e) => setEpicForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter epic title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                  <textarea
                    value={epicForm.description}
                    onChange={(e) => setEpicForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={5}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Describe this epic"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-background/60 rounded border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Team</p>
                    <p className="text-foreground font-medium">{epicForm.teamName || "-"}</p>
                  </div>
                  <div className="p-3 bg-background/60 rounded border border-border">
                    <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
                    <p className="text-foreground font-medium">{epicForm.assignedToName || "-"}</p>
                    {epicForm.assignedToEmail && (
                      <p className="text-xs text-muted-foreground mt-1">{epicForm.assignedToEmail}</p>
                    )}
                  </div>
                  <div className="p-3 bg-background/60 rounded border border-border md:col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Created</p>
                    <p className="text-foreground font-medium">
                      {epicForm.createdAt ? formatDate(epicForm.createdAt) : "-"}
                    </p>
                  </div>
                </div>
              </>
            </div>

            <div className="px-6 py-4 border-t border-border bg-background/40 flex items-center justify-end gap-2">
              <button
                onClick={closeEpicDetails}
                disabled={savingDetails}
                className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={saveEpicDetails}
                disabled={savingDetails}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {savingDetails && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
