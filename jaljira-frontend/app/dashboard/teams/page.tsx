"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AssignMembersModal from "../../components/AssignMembersModal";
import CreateTaskStatusModal from "../../components/CreateTaskStatusModal";
import CreateEpicModal from "../../components/CreateEpicModal";
import {
  getTeamsByOrganization,
  createTeam,
  assignManagerToTeam,
  changeManagerToTeam,
  deleteTeam,
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
  Trash2,
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId?: string;
}

interface OrgUserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  teamId: string;
  teamName: string;
  onboarded: boolean;
}

export default function TeamsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [selectedMembersTeam, setSelectedMembersTeam] = useState<Team | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showTaskStatusModal, setShowTaskStatusModal] = useState(false);
  const [showEpicModal, setShowEpicModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [adminNameFilter, setAdminNameFilter] = useState("");
  const [adminEmailFilter, setAdminEmailFilter] = useState("");
  const [adminRoleFilter, setAdminRoleFilter] = useState("all");
  const [adminTeamFilter, setAdminTeamFilter] = useState("all");

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

      const teamsData = await getTeamsByOrganization();
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
      const result = await createTeam(formData.teamName, formData.description);
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

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await deleteTeam(teamId);
      if (result.success) {
        setSuccess(`Team "${result.team_name}" deleted successfully!`);
        await fetchUserAndTeams();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to delete team");
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete team");
    } finally {
      setIsCreating(false);
    }
  };

  const isAdmin = user?.role === "ADMIN";
  const visibleTeams = isAdmin
    ? teams
    : teams.filter((team) => {
        const managerMatches = team.manager?.id === user?.id;
        const memberMatches = team.members?.some((member) => member.id === user?.id);
        return managerMatches || memberMatches;
      });

  const adminUsers: OrgUserRow[] = Array.from(
    new Map(
      teams.flatMap((team) => {
        const rows: OrgUserRow[] = [];

        if (team.manager) {
          rows.push({
            id: team.manager.id,
            firstName: team.manager.firstName || "",
            lastName: team.manager.lastName || "",
            email: team.manager.email,
            role: team.manager.role || "MANAGER",
            teamId: team.id,
            teamName: team.teamName,
            onboarded: team.manager.onboarded ?? true,
          });
        }

        (team.members || [])
          .filter((member) => member.role === "MEMBER")
          .forEach((member) => {
            rows.push({
              id: member.id,
              firstName: member.firstName || "",
              lastName: member.lastName || "",
              email: member.email,
              role: member.role,
              teamId: team.id,
              teamName: team.teamName,
              onboarded: member.onboarded,
            });
          });

        return rows.map((row) => [row.id, row] as const);
      })
    ).values()
  );

  const filteredAdminUsers = adminUsers.filter((row) => {
    const fullName = `${row.firstName} ${row.lastName}`.trim().toLowerCase();
    const nameMatches =
      adminNameFilter.trim() === "" ||
      fullName.includes(adminNameFilter.trim().toLowerCase());
    const emailMatches =
      adminEmailFilter.trim() === "" ||
      row.email.toLowerCase().includes(adminEmailFilter.trim().toLowerCase());
    const roleMatches = adminRoleFilter === "all" || row.role === adminRoleFilter;
    const teamMatches = adminTeamFilter === "all" || row.teamId === adminTeamFilter;
    return nameMatches && emailMatches && roleMatches && teamMatches;
  });

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
                View teams, members, and manage team assignments
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Team Form - Left Side (Admin Only) */}
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

          {/* Teams Roster - Right Side (Visible to All) */}
          <div className={isAdmin ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  {isAdmin ? "Organization Users" : "Active Teams Roster"}
                </h2>
              </div>

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
            </div>

            {isAdmin ? (
              <>
                <div className="mb-6 bg-card border border-border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Filter by Name
                      </label>
                      <input
                        type="text"
                        value={adminNameFilter}
                        onChange={(e) => setAdminNameFilter(e.target.value)}
                        placeholder="Search by name or email"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Filter by Email
                      </label>
                      <input
                        type="text"
                        value={adminEmailFilter}
                        onChange={(e) => setAdminEmailFilter(e.target.value)}
                        placeholder="Search by email"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Filter by Role
                      </label>
                      <select
                        value={adminRoleFilter}
                        onChange={(e) => setAdminRoleFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="all">All Roles</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="MEMBER">MEMBER</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Filter by Team Name
                      </label>
                      <select
                        value={adminTeamFilter}
                        onChange={(e) => setAdminTeamFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="all">All Teams</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.teamName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    {filteredAdminUsers.length} user{filteredAdminUsers.length !== 1 ? "s" : ""}
                  </div>
                </div>

                {filteredAdminUsers.length === 0 ? (
                  <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No users match the current filters</p>
                  </div>
                ) : (
                  <div className="bg-card border border-border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-background/60 border-b border-border">
                          <tr>
                            <th className="text-left font-medium text-muted-foreground px-4 py-3">Name</th>
                            <th className="text-left font-medium text-muted-foreground px-4 py-3">Email</th>
                            <th className="text-left font-medium text-muted-foreground px-4 py-3">Role</th>
                            <th className="text-left font-medium text-muted-foreground px-4 py-3">Team</th>
                            <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAdminUsers.map((row) => (
                            <tr key={`${row.id}-${row.teamId}`} className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-medium text-foreground">
                                  {row.firstName} {row.lastName}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{row.email}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary">
                                  {row.role}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-foreground">{row.teamName}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  row.onboarded ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                                }`}>
                                  {row.onboarded ? "Onboarded" : "Pending"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : visibleTeams.length === 0 ? (
              <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No teams available</p>
                {isAdmin && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Create your first team using the form on the left
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleTeams.map((team) => (
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
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {/* Admin Only: Assign/Change Manager */}
                      {isAdmin && (
                        <button
                          onClick={() => {
                            setSelectedTeam(team);
                            setShowAssignModal(true);
                            setError(null);
                          }}
                          disabled={isCreating}
                          className="flex-1 min-w-fit px-3 py-2 text-sm font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          {team.manager ? "Change Manager" : "Assign Manager"}
                        </button>
                      )}

                      {/* Admin or Manager of Team: Add Members */}
                      {(isAdmin || (user?.role === "MANAGER" && team.manager?.id === user?.id)) && (
                        <button
                          onClick={() => {
                            setSelectedMembersTeam(team);
                            setShowMembersModal(true);
                            setError(null);
                          }}
                          disabled={isCreating}
                          className="flex-1 min-w-fit px-3 py-2 text-sm font-medium bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Users className="w-4 h-4" />
                          Add Members
                        </button>
                      )}

                      {/* Admin Only: Delete Team */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteTeam(team.id, team.teamName)}
                          disabled={isCreating}
                          className="px-3 py-2 text-sm font-medium bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Manager Only: Create Task Status */}
                      {(isAdmin || (user?.role === "MANAGER" && team.manager?.id === user?.id)) && (
                        <button
                          onClick={() => {
                            setSelectedTeam(team);
                            setShowTaskStatusModal(true);
                            setError(null);
                          }}
                          disabled={isCreating}
                          className="flex-1 min-w-fit px-3 py-2 text-sm font-medium bg-purple-500/10 text-purple-500 rounded-lg hover:bg-purple-500/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Task Status
                        </button>
                      )}

                      {/* Manager Only: Create Epic */}
                      {(isAdmin || (user?.role === "MANAGER" && team.manager?.id === user?.id)) && (
                        <button
                          onClick={() => {
                            setSelectedTeam(team);
                            setShowEpicModal(true);
                            setError(null);
                          }}
                          disabled={isCreating}
                          className="flex-1 min-w-fit px-3 py-2 text-sm font-medium bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Epic
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Team Members Section */}
            {!isAdmin && (
            <div className="mt-12 pt-8 border-t border-border">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-foreground">
                  Team Members
                </h2>
              </div>

              {/* Get all unique members from all teams */}
              {(() => {
                const allMembers = visibleTeams.flatMap((team) =>
                  (team.members || []).filter((member) => member.role === "MEMBER")
                );
                const uniqueMembers = Array.from(
                  new Map(allMembers.map((member) => [member.id, member])).values()
                );

                if (uniqueMembers.length === 0) {
                  return (
                    <div className="bg-card border-2 border-dashed border-border rounded-lg p-12 text-center">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No team members assigned yet</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uniqueMembers.map((member) => {
                      // Find which team(s) this member belongs to
                      const memberTeams = visibleTeams.filter((team) =>
                        team.members?.some((m) => m.id === member.id && m.role === "MEMBER")
                      );

                      return (
                        <div
                          key={member.id}
                          className="bg-card border border-border rounded-lg p-4 hover:border-blue-500/50 transition-colors"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-sm font-semibold text-blue-500 flex-shrink-0">
                              {(member.firstName?.[0] ||
                                member.email[0]).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">
                                {member.firstName} {member.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {member.email}
                              </p>
                            </div>
                          </div>

                          <div className="mb-3 flex gap-2">
                            <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-500 rounded">
                              {member.role}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              member.onboarded 
                                ? 'bg-green-500/10 text-green-500' 
                                : 'bg-yellow-500/10 text-yellow-500'
                            }`}>
                              {member.onboarded ? 'Onboarded' : 'Pending'}
                            </span>
                          </div>

                          <div className="pt-3 border-t border-border">
                            <p className="text-xs text-muted-foreground mb-1">
                              Assigned to {memberTeams.length} team{memberTeams.length !== 1 ? 's' : ''}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {memberTeams.map((team) => (
                                <span
                                  key={team.id}
                                  className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded"
                                >
                                  {team.teamName}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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

      {/* Assign Members Modal */}
      {selectedMembersTeam && (
        <AssignMembersModal
          teamId={selectedMembersTeam.id}
          isOpen={showMembersModal}
          onClose={() => {
            setShowMembersModal(false);
            setSelectedMembersTeam(null);
          }}
          onSuccess={() => {
            fetchUserAndTeams();
          }}
        />
      )}

      {/* Create Task Status Modal */}
      {selectedTeam && (
        <CreateTaskStatusModal
          teamId={selectedTeam.id}
          isOpen={showTaskStatusModal}
          onClose={() => {
            setShowTaskStatusModal(false);
            setSelectedTeam(null);
          }}
          onSuccess={(message) => {
            setSuccess(message);
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      )}

      {/* Create Epic Modal */}
      {selectedTeam && (
        <CreateEpicModal
          teamId={selectedTeam.id}
          isOpen={showEpicModal}
          onClose={() => {
            setShowEpicModal(false);
            setSelectedTeam(null);
          }}
          onSuccess={(message) => {
            setSuccess(message);
            setTimeout(() => setSuccess(null), 3000);
          }}
        />
      )}
    </div>
  );
}
