import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WorkshopsModule } from '../workshops/workshops.module';
import { AdminRegistrationsController } from './admin-registrations.controller';
import { PublicRegistrationsController } from './public-registrations.controller';
import { RegistrationsService } from './registrations.service';

@Module({
  imports: [AuthModule, WorkshopsModule],
  controllers: [PublicRegistrationsController, AdminRegistrationsController],
  providers: [RegistrationsService],
})
export class RegistrationsModule {}
