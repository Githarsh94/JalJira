"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getTeamsByOrganization,
  createTeam,
  assignManagerToTeam,
  changeManagerToTeam,
  Team,
  apiFetch,
  type AuthUser,
} from "../../lib/api";
import {
  Plus,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Users,
  Target,
  RefreshCw,
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId?: string;
}

export default function TeamsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    teamName: "",
    description: "",
  });

  const [managerEmail, setManagerEmail] = useState("");

  useEffect(() => {
    fetchUserAndTeams();
  }, []);

  const fetchUserAndTeams = async () => {
    try {
      const userData = await apiFetch<AuthUser>("/api/user/info");
      setUser(userData as any);

      const orgId = localStorage.getItem("org_id");
      if (!orgId) {
        setError("Organization not found. Please complete onboarding first.");
        setLoading(false);
        return;
      }

      const teamsData = await getTeamsByOrganization(orgId);
      setTeams(teamsData);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || "Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.teamName.trim()) {
      setError("Team name is required");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const orgId = localStorage.getItem("org_id");
      if (!orgId) throw new Error("Organization not found");

      const result = await createTeam(orgId, formData.teamName, formData.description);
      if (result.success) {
        setSuccess(`Team "${result.team_name}" created successfully!`);
        setFormData({ teamName: "", description: "" });
        await fetchUserAndTeams();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to create team");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create team");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    if (!managerEmail.trim()) {
      setError("Manager email is required");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Check if team already has a manager
      const hasManager = selectedTeam.manager && selectedTeam.manager.email;
      const apiCall = hasManager ? changeManagerToTeam : assignManagerToTeam;

      const result = await apiCall(selectedTeam.id, managerEmail);
      if (result.success) {
        const action = hasManager
          ? "Manager changed to"
          : (result as any).is_new_manager
          ? "Invitation sent to"
          : "Manager assigned to";
        const email = hasManager
          ? (result as any).new_manager_email
          : (result as any).manager_email;
        
        // Display warning if email delivery failed
        if ((result as any).warning) {
          setSuccess(`${action} ${email}! ⚠️ ${(result as any).warning}`);
        } else {
          setSuccess(`${action} ${email}!`);
        }
        
        setManagerEmail("");
        setShowAssignModal(false);
        await fetchUserAndTeams();
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(result.error || "Failed to assign manager");
      }
    } catch (err: any) {
      setError(err.message || "Failed to assign manager");
    } finally {
      setIsCreating(false);
    }
  };

  const isAdmin = user?.role === "ADMIN";

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
                <Users className="w-6 h-6 text-primary" />
                Team Management
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage teams and assign managers to your organization
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Team Form - Left Side */}
          {isAdmin && (
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg p-6 sticky top-20">
                <div className="flex items-center gap-2 mb-6">
                  <Plus className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    Create New Team
                  </h2>
                </div>

                <span className="inline-block mb-4 px-2 py-1 text-xs font-semibold text-primary bg-primary/10 rounded">
                  ADMIN ONLY
                </span>

                <form
                  onSubmit={handleCreateTeam}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Team Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Platform Engineering"
                      value={formData.teamName}
                      onChange={(e) =>
                        setFormData({ ...formData, teamName: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Description
                    </label>
                    <textarea
                      placeholder="Briefly describe the team's scope..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Team
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Teams Roster - Right Side */}
          <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Active Teams Roster
                </h2>
              </div>

              {/* Alerts */}
              {error && (
                <div className="mb-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive ml-3">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-500 ml-3">{success}</p>
                </div>
              )}
            </div>

            {teams.length === 0 ? (
              <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No teams created yet</p>
                {isAdmin && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your first team using the form on the left
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-foreground">
                          {team.teamName}
                        </h3>
                        {team.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {team.description}
                          </p>
                        )}
                      </div>
                      {team.manager && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-500 rounded">
                          ACTIVE
                        </span>
                      )}
                      {!team.manager && isAdmin && (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-500 rounded">
                          NO MANAGER
                        </span>
                      )}
                    </div>

                    {/* Manager Info */}
                    <div className="mb-4 p-3 bg-background/50 rounded-lg">
                      {team.manager && team.manager.email ? (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Manager
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {(team.manager.firstName?.[0] ||
                                team.manager.email[0]).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {team.manager.firstName} {team.manager.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {team.manager.email}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          <p className="text-xs mb-1">No manager assigned</p>
                          <p>Click the button below to assign one</p>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowAssignModal(true);
                          setError(null);
                        }}
                        disabled={isCreating}
                        className="w-full px-3 py-2 text-sm font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        {team.manager ? "Change Manager" : "Assign Manager"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Assign/Change Manager Modal */}
      {showAssignModal && selectedTeam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {selectedTeam.manager && selectedTeam.manager.email
                ? "Change Manager for"
                : "Assign Manager to"}{" "}
              "{selectedTeam.teamName}"
            </h3>

            {selectedTeam.manager && selectedTeam.manager.email && (
              <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-500 mb-1">Current Manager</p>
                <p className="text-sm text-foreground">
                  {selectedTeam.manager.firstName}{" "}
                  {selectedTeam.manager.lastName} (
                  {selectedTeam.manager.email})
                </p>
              </div>
            )}

            <form
              onSubmit={handleAssignManager}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Manager Email
                </label>
                <input
                  type="email"
                  placeholder="manager@company.com"
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setManagerEmail("");
                    setError(null);
                  }}
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 disabled:opacity-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      {selectedTeam.manager && selectedTeam.manager.email
                        ? "Change Manager"
                        : "Assign Manager"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
