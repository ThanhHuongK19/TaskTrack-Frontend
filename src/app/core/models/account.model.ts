export interface Account {
  accountId: number;
  fullName: string;
  email: string;
  role: number;
  createdDate: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthenticationResponse {
  token: string;
  expiresAt: string;
  account: Account;
}

export interface UpdateAccountRequest {
  fullName: string;
  role: number;
}
