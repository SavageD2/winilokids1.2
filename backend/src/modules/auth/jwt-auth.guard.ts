import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = { role?: string }>(err: Error | null, user: TUser) {
    if (err || !user || (user as { role?: string }).role !== 'admin') {
      throw err ?? new UnauthorizedException('Admin authentication required');
    }

    return user;
  }
}
