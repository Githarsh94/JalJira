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

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${authConfig.apiUrl}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    removeToken();
    window.location.href = "/auth";
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
  };
  organization?: {
    id: string;
    organisationName: string;
  };
}

export async function getTeamsByOrganization(organizationId: string): Promise<Team[]> {
  return apiFetch<Team[]>(`/api/teams/org/${organizationId}`);
}

export async function createTeam(
  organizationId: string,
  teamName: string,
  description: string
): Promise<{ success: boolean; message: string; team_id?: string; team_name?: string; error?: string }> {
  return apiFetch("/api/teams", {
    method: "POST",
    body: JSON.stringify({
      org_id: organizationId,
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
