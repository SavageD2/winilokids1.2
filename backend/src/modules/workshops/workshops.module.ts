import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminWorkshopsController } from './admin-workshops.controller';
import { PublicWorkshopsController } from './public-workshops.controller';
import { WorkshopsService } from './workshops.service';

@Module({
  imports: [AuthModule],
  controllers: [PublicWorkshopsController, AdminWorkshopsController],
  providers: [WorkshopsService],
  exports: [WorkshopsService],
})
export class WorkshopsModule {}
