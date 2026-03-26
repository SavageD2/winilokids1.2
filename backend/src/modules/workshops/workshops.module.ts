import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminWorkshopsController } from './admin-workshops.controller';
import { GoogleCalendarSyncService } from './google-calendar-sync.service';
import { PublicWorkshopsController } from './public-workshops.controller';
import { WorkshopsService } from './workshops.service';

@Module({
  imports: [AuthModule],
  controllers: [PublicWorkshopsController, AdminWorkshopsController],
  providers: [WorkshopsService, GoogleCalendarSyncService],
  exports: [WorkshopsService],
})
export class WorkshopsModule {}
