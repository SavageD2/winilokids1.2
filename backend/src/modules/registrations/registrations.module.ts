import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ParentAccountsModule } from '../parent-accounts/parent-accounts.module';
import { WorkshopsModule } from '../workshops/workshops.module';
import { AdminRegistrationsController } from './admin-registrations.controller';
import { ParentRegistrationsController } from './parent-registrations.controller';
import { RegistrationsService } from './registrations.service';

@Module({
  imports: [AuthModule, ParentAccountsModule, WorkshopsModule],
  controllers: [ParentRegistrationsController, AdminRegistrationsController],
  providers: [RegistrationsService],
})
export class RegistrationsModule {}
