import { authConfig } from "./auth-config";

const TOKEN_KEY = "jaljira_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

type ApiFetchOptions = RequestInit & {
  suppressAuthRedirect?: boolean;
};

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { suppressAuthRedirect = false, ...requestOptions } = options;
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(requestOptions.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${authConfig.apiUrl}${path}`, {
    ...requestOptions,
    headers,
  });

  if (res.status === 401) {
    if (!suppressAuthRedirect) {
      removeToken();
      window.location.href = "/auth";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Request failed");
  }

  return res.json();
}

export async function exchangeCodeForToken(
  provider: "google" | "github",
  code: string
): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(
    `${authConfig.apiUrl}/api/auth/oauth2/${provider}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Authentication failed" }));
    throw new Error(error.error || "Authentication failed");
  }

  return res.json();
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isOnboarded: boolean;
  organization_id?: string | null;
}

export function logout(): void {
  removeToken();
  window.location.href = "/auth";
}

export async function getPlans(): Promise<Plan[]> {
  return apiFetch<Plan[]>("/api/onboarding/plans");
}

export async function submitOnboarding(
  userId: string,
  organizationName: string,
  planId: string
): Promise<{ success: boolean; message: string; organization_id: string }> {
  return apiFetch("/api/onboarding/submit", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      organization_name: organizationName,
      plan_id: planId,
    }),
  });
}

export interface Plan {
  id: string;
  criteria: Record<string, unknown>;
  cost: string;
  validity: number;
}

export interface SprintTemplate {
  id: string;
  name: string;
  description: string;
  durationDays: number;
  createdAt: string;
  updatedAt: string;
}

export async function getSprintTemplates(): Promise<SprintTemplate[]> {
  return apiFetch<SprintTemplate[]>("/api/sprint-templates");
}

export async function createSprint(
  organizationId: string,
  sprintTemplateId: string,
  startDate: string
): Promise<{ success: boolean; message?: string; error?: string; sprint_id?: string; start_date?: string; end_date?: string }> {
  return apiFetch("/api/sprints", {
    method: "POST",
    body: JSON.stringify({
      org_id: organizationId,
      sprint_template_id: sprintTemplateId,
      start_date: startDate,
    }),
  });
}

// Team Management APIs
export interface Team {
  id: string;
  teamName: string;
  description: string;
  manager?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  members?: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    onboarded: boolean;
  }>;
  organization?: {
    id: string;
    organisationName?: string;
  } | null;
}

export async function getTeamsByOrganization(): Promise<Team[]> {
  return apiFetch<Team[]>("/api/teams/org");
}

export async function createTeam(
  teamName: string,
  description: string
): Promise<{ success: boolean; message: string; team_id?: string; team_name?: string; error?: string }> {
  return apiFetch("/api/teams", {
    method: "POST",
    body: JSON.stringify({
      team_name: teamName,
      description,
    }),
  });
}

export async function assignManagerToTeam(
  teamId: string,
  managerEmail: string
): Promise<{ success: boolean; message: string; manager_email?: string; is_new_manager?: boolean; warning?: string; error?: string }> {
  return apiFetch(`/api/teams/${teamId}/assign-manager`, {
    method: "POST",
    body: JSON.stringify({
      manager_email: managerEmail,
    }),
  });
}

export async function deleteTeam(
  teamId: string
): Promise<{ success: boolean; message: string; team_id?: string; team_name?: string; error?: string }> {
  return apiFetch(`/api/teams/${teamId}`, {
    method: "DELETE",
  });
}

export async function changeManagerToTeam(
  teamId: string,
  managerEmail: string
): Promise<{
  success: boolean;
  message: string;
  new_manager_email?: string;
  old_manager_email?: string;
  is_new_manager?: boolean;
  warning?: string;
  error?: string;
}> {
  return apiFetch(`/api/teams/${teamId}/change-manager`, {
    method: "POST",
    body: JSON.stringify({
      manager_email: managerEmail,
    }),
  });
}

// Manager-only APIs for Task Status and Epics

export interface TaskStatus {
  id: string;
  statusType: string;
  description?: string;
  createdAt?: string;
}

export interface Epic {
  id: string;
  title: string;
  description?: string;
  typeId: string;
  sprintId: string;
  assignedTo: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  teamId: string;
  teamName: string;
  createdAt: string;
}

export async function createTaskStatus(
  teamId: string,
  statusType: string,
  description: string
): Promise<{
  success: boolean;
  message?: string;
  taskStatusId?: string;
  error?: string;
}> {
  return apiFetch(`/api/manager/teams/${teamId}/task-status`, {
    method: "POST",
    body: JSON.stringify({
      status_type: statusType,
      description: description,
    }),
  });
}

export async function createEpic(
  teamId: string,
  title: string,
  description: string,
  sprintId?: string
): Promise<{
  success: boolean;
  message?: string;
  epicId?: string;
  error?: string;
}> {
  const body: any = {
    title: title,
    description: description,
  };
  
  // Only include sprint_id if provided
  if (sprintId) {
    body.sprint_id = sprintId;
  }
  
  return apiFetch(`/api/manager/teams/${teamId}/epics`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Get all epics for the organization
export async function getOrganizationEpics(): Promise<Epic[]> {
  return apiFetch<Epic[]>("/api/user/epics", {
    method: "GET",
  });
}

export async function getEpicById(epicId: string): Promise<Epic> {
  return apiFetch<Epic>(`/api/user/epics/${epicId}`, {
    method: "GET",
  });
}

export async function updateEpic(
  epicId: string,
  title: string,
  description?: string
): Promise<{ success: boolean; message?: string; epicId?: string; error?: string }> {
  return apiFetch(`/api/user/epics/${epicId}/update`, {
    method: "POST",
    suppressAuthRedirect: true,
    body: JSON.stringify({
      title,
      description: description ?? "",
    }),
  });
}
