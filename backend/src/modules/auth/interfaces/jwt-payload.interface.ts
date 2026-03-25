export interface JwtPayload {
  sub: number;
  email: string;
  role: 'admin' | 'parent';
}
