export type AuthRole = "owner";

export type SessionUser = {
  id: string;
  email: string;
  studioId: string;
  role: AuthRole;
};

export type AuthSession = {
  user: SessionUser;
  expires: string;
};
