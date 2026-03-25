import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ParentJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = { role?: string }>(err: Error | null, user: TUser) {
    if (err || !user || (user as { role?: string }).role !== 'parent') {
      throw err ?? new UnauthorizedException('Parent authentication required');
    }

    return user;
  }
}
