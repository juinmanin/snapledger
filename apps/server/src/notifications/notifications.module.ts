import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { BudgetAlertService } from './services/budget-alert.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, BudgetAlertService],
  exports: [NotificationsService, BudgetAlertService],
})
export class NotificationsModule {}
