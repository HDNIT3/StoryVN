import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module.js';
import { MailModule } from '../mail/mail.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { UsersModule } from '../users/users.module.js';
import { AdminSupportController } from './controllers/admin-support.controller.js';
import { SupportController } from './controllers/support.controller.js';
import { SupportTicket, SupportTicketSchema } from './schemas/support-ticket.schema.js';
import { SupportService } from './services/support.service.js';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    MailModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: SupportTicket.name, schema: SupportTicketSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SupportController, AdminSupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}
