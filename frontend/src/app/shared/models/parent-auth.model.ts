export interface ParentProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

export interface ParentSession {
  accessToken: string;
  parent: ParentProfile;
}

export interface LoginParentPayload {
  email: string;
  password: string;
}

export interface RegisterParentPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  password: string;
}

export interface UpdateParentProfilePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
}
