/**
 * Jira API Client Module
 *
 * Provides functions for interacting with the Jira REST API.
 * Uses Basic Authentication with Personal Access Token (PAT).
 *
 * Required environment variables:
 * - JIRA_BASE_URL: Your Jira instance URL (e.g., https://your-company.atlassian.net)
 * - JIRA_EMAIL: Email address associated with Jira account
 * - JIRA_API_TOKEN: Personal Access Token from Atlassian (generate at id.atlassian.com)
 */

/**
 * Jira API configuration loaded from environment variables
 */
interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

/**
 * Error thrown when Jira credentials are missing or invalid
 */
export class JiraConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JiraConfigError";
  }
}

/**
 * Error thrown when a Jira API request fails
 */
export class JiraApiError extends Error {
  public readonly statusCode: number;
  public readonly response: unknown;

  constructor(message: string, statusCode: number, response?: unknown) {
    super(message);
    this.name = "JiraApiError";
    this.statusCode = statusCode;
    this.response = response;
  }
}

/**
 * Jira issue representation
 */
export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: string | { type: string; version: number; content: unknown[] };
    status: { name: string; id: string };
    issuetype: { name: string; id: string };
    priority?: { name: string; id: string };
    assignee?: { displayName: string; emailAddress: string; accountId: string } | null;
    reporter?: { displayName: string; emailAddress: string; accountId: string };
    created: string;
    updated: string;
    project: { id: string; key: string; name: string };
    labels?: string[];
    components?: Array<{ id: string; name: string }>;
    [key: string]: unknown;
  };
}

/**
 * Jira project representation
 */
export interface JiraProject {
  id: string;
  key: string;
  name: string;
  self: string;
  description?: string;
  lead?: { displayName: string; accountId: string };
  projectTypeKey?: string;
  projectCategory?: { id: string; name: string };
}

/**
 * Search results from Jira JQL query
 */
export interface JiraSearchResults {
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

/**
 * Payload for creating a new Jira issue
 */
export interface CreateIssuePayload {
  project: { key: string } | { id: string };
  summary: string;
  description?: string;
  issuetype: { name: string } | { id: string };
  priority?: { name: string } | { id: string };
  assignee?: { accountId: string } | { name: string };
  labels?: string[];
  components?: Array<{ name: string } | { id: string }>;
  [key: string]: unknown;
}

/**
 * Payload for updating an existing Jira issue
 */
export interface UpdateIssuePayload {
  summary?: string;
  description?: string;
  priority?: { name: string } | { id: string };
  assignee?: { accountId: string } | { name: string } | null;
  labels?: string[];
  [key: string]: unknown;
}

/**
 * Get Jira configuration from environment variables
 * @throws JiraConfigError if required environment variables are missing
 */
function getJiraConfig(): JiraConfig {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  const missing: string[] = [];
  if (!baseUrl) missing.push("JIRA_BASE_URL");
  if (!email) missing.push("JIRA_EMAIL");
  if (!apiToken) missing.push("JIRA_API_TOKEN");

  if (missing.length > 0) {
    throw new JiraConfigError(
      `Missing required Jira environment variables: ${missing.join(", ")}. ` +
      `Please set these in your .env file or environment.`
    );
  }

  return { baseUrl: baseUrl!, email: email!, apiToken: apiToken! };
}

/**
 * Create Basic Auth header value from credentials
 */
function createAuthHeader(config: JiraConfig): string {
  const credentials = btoa(`${config.email}:${config.apiToken}`);
  return `Basic ${credentials}`;
}

/**
 * Make an authenticated request to the Jira API
 * @throws JiraApiError if the request fails
 */
async function jiraRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
  } = {}
): Promise<T> {
  const config = getJiraConfig();
  const url = `${config.baseUrl}/rest/api/3${endpoint}`;

  const headers: Record<string, string> = {
    "Authorization": createAuthHeader(config),
    "Accept": "application/json",
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = await response.text();
    }

    throw new JiraApiError(
      `Jira API request failed: ${response.status} ${response.statusText}`,
      response.status,
      errorBody
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

/**
 * Get a single Jira issue by key or ID
 *
 * @param issueKey - The issue key (e.g., "PROJ-123") or issue ID
 * @returns The Jira issue details
 * @throws JiraConfigError if credentials are missing
 * @throws JiraApiError if the request fails
 *
 * @example
 * const issue = await getIssue("PROJ-123");
 * console.log(issue.fields.summary);
 */
export async function getIssue(issueKey: string): Promise<JiraIssue> {
  return jiraRequest<JiraIssue>(`/issue/${encodeURIComponent(issueKey)}`);
}

/**
 * Search for Jira issues using JQL (Jira Query Language)
 *
 * @param jql - The JQL query string
 * @param options - Optional search parameters
 * @returns Search results with matching issues
 * @throws JiraConfigError if credentials are missing
 * @throws JiraApiError if the request fails
 *
 * @example
 * // Find all open bugs in project PROJ
 * const results = await searchIssues("project = PROJ AND type = Bug AND status != Done");
 * console.log(`Found ${results.total} issues`);
 */
export async function searchIssues(
  jql: string,
  options: {
    startAt?: number;
    maxResults?: number;
    fields?: string[];
  } = {}
): Promise<JiraSearchResults> {
  const params = new URLSearchParams();
  params.append("jql", jql);

  if (options.startAt !== undefined) {
    params.append("startAt", String(options.startAt));
  }
  if (options.maxResults !== undefined) {
    params.append("maxResults", String(options.maxResults));
  }
  if (options.fields && options.fields.length > 0) {
    params.append("fields", options.fields.join(","));
  }

  return jiraRequest<JiraSearchResults>(`/search?${params.toString()}`);
}

/**
 * Create a new Jira issue
 *
 * @param payload - The issue creation payload
 * @returns The created issue with key and ID
 * @throws JiraConfigError if credentials are missing
 * @throws JiraApiError if the request fails
 *
 * @example
 * const issue = await createIssue({
 *   project: { key: "PROJ" },
 *   summary: "Fix login bug",
 *   description: "Users cannot login with SSO",
 *   issuetype: { name: "Bug" },
 * });
 * console.log(`Created issue: ${issue.key}`);
 */
export async function createIssue(
  payload: CreateIssuePayload
): Promise<{ id: string; key: string; self: string }> {
  return jiraRequest<{ id: string; key: string; self: string }>("/issue", {
    method: "POST",
    body: { fields: payload },
  });
}

/**
 * Update an existing Jira issue
 *
 * @param issueKey - The issue key (e.g., "PROJ-123")
 * @param payload - The fields to update
 * @throws JiraConfigError if credentials are missing
 * @throws JiraApiError if the request fails
 *
 * @example
 * await updateIssue("PROJ-123", {
 *   summary: "Updated summary",
 *   priority: { name: "High" },
 * });
 */
export async function updateIssue(
  issueKey: string,
  payload: UpdateIssuePayload
): Promise<void> {
  await jiraRequest<void>(`/issue/${encodeURIComponent(issueKey)}`, {
    method: "PUT",
    body: { fields: payload },
  });
}

/**
 * Get a Jira project by key or ID
 *
 * @param projectKey - The project key (e.g., "PROJ") or project ID
 * @returns The project details
 * @throws JiraConfigError if credentials are missing
 * @throws JiraApiError if the request fails
 *
 * @example
 * const project = await getProject("PROJ");
 * console.log(`Project: ${project.name}`);
 */
export async function getProject(projectKey: string): Promise<JiraProject> {
  return jiraRequest<JiraProject>(`/project/${encodeURIComponent(projectKey)}`);
}

/**
 * Check if Jira credentials are configured
 * @returns true if all required environment variables are set
 */
export function isJiraConfigured(): boolean {
  return !!(
    process.env.JIRA_BASE_URL &&
    process.env.JIRA_EMAIL &&
    process.env.JIRA_API_TOKEN
  );
}
