import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminContactsController } from './admin-contacts.controller';
import { ContactsService } from './contacts.service';
import { PublicContactsController } from './public-contacts.controller';

@Module({
  imports: [AuthModule],
  controllers: [PublicContactsController, AdminContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
