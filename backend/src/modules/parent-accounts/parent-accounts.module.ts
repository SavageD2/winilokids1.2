import { Module } from '@nestjs/common';
import { ParentAccountsService } from './parent-accounts.service';

@Module({
  providers: [ParentAccountsService],
  exports: [ParentAccountsService],
})
export class ParentAccountsModule {}
