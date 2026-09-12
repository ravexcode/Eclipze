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

export type SessionUser = {
  id: string;
  email: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
};

export type UserProfile = {
  name: string;
  avatar: string;
  id: string;
}

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
