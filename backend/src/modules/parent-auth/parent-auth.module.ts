import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ParentAccountsModule } from '../parent-accounts/parent-accounts.module';
import { ParentAuthController } from './parent-auth.controller';
import { ParentAuthService } from './parent-auth.service';

@Module({
  imports: [AuthModule, ParentAccountsModule],
  controllers: [ParentAuthController],
  providers: [ParentAuthService],
})
export class ParentAuthModule {}
