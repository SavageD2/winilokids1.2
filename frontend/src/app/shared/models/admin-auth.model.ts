export interface AdminProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AdminSession {
  accessToken: string;
  admin: AdminProfile;
}
