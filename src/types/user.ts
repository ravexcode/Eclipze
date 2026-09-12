export type UserCredentials = {
  email: string;
  password: string;
  username?: string;
  password_confirm?: string;
};

export type SigninCredentials = Pick<UserCredentials, "email" | "password">;

export type SignupCredentials = Required<UserCredentials>;

export type AuthStep = "credentials" | "verify_email" | "password_reset";

export type AuthNextStep = Exclude<AuthStep, "credentials">;

export type AuthCodePurpose = "EMAIL_VERIFICATION" | "PASSWORD_RESET";

export const ACCOUNT_DELETION_DELAY_DAYS = 30;

export type SessionUser = {
  id: string;
  email: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  createdAt: string;
};

export type UserProfile = {
  name: string;
  avatar: string;
  id: string;
}

export type ProjectStatus = "ACTIVE" | "AT_RISK" | "COMPLETED";
export type IssueSeverity = "IMPORTANT" | "MEDIUM" | "LOW";
export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED";
export type MailDirection = "INBOUND" | "OUTBOUND";
export type MailStatus = "DRAFT" | "SENT" | "RECEIVED" | "ARCHIVED";
export type AgentStatus = "ACTIVE" | "INACTIVE";
export type AgentSessionStatus = "ACTIVE" | "COMPLETED" | "FAILED" | "CANCELLED";

export type WorkspaceProject = {
  id: string;
  name: string;
  description: string | null;
  externalUrl: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceIssue = {
  id: string;
  projectId: string | null;
  title: string;
  description: string | null;
  severity: IssueSeverity;
  status: IssueStatus;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceMail = {
  id: string;
  projectId: string | null;
  fromAddress: string;
  toAddresses: string[];
  subject: string;
  direction: MailDirection;
  status: MailStatus;
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceAgent = {
  id: string;
  name: string;
  defaultModel: string;
  status: AgentStatus;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceAgentSession = {
  id: string;
  agentId: string;
  projectId: string | null;
  description: string;
  model: string;
  status: AgentSessionStatus;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardMetrics = {
  issuesTotal: number;
  issuesBySeverity: Record<IssueSeverity, number>;
  issuesByDay: Array<{ date: string; count: number }>;
  projectsTotal: number;
  activeSessionsTotal: number;
};

export type WorkspaceSnapshot = {
  user: SessionUser;
  projects: WorkspaceProject[];
  issues: WorkspaceIssue[];
  mails: WorkspaceMail[];
  agents: WorkspaceAgent[];
  agentSessions: WorkspaceAgentSession[];
  metrics: DashboardMetrics;
};

export type AuthApiResponse = {
  message: string;
  nextStep?: AuthNextStep;
  email?: string;
  redirectTo?: string;
  warning?: boolean;
  actionHref?: string;
  actionLabel?: string;
};

export default UserCredentials;
