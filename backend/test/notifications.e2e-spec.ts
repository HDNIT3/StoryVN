import { type ExecutionContext, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthGuard } from '../src/common/guards/auth.guard.js';
import { NotificationsController } from '../src/modules/notifications/notifications.controller.js';
import { NotificationsService } from '../src/modules/notifications/notifications.service.js';

describe('Notification deletion routes', () => {
  const userId = '507f1f77bcf86cd799439011';
  const notifications = {
    deleteAllRead: vi.fn().mockResolvedValue({ deletedCount: 2 }),
    deleteOne: vi.fn().mockResolvedValue(undefined),
  };
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [{ provide: NotificationsService, useValue: notifications }],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          context.switchToHttp().getRequest().user = { _id: userId };
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('routes clear-read to bulk deletion rather than using it as a notification ID', async () => {
    await request(app.getHttpServer())
      .delete('/notifications/clear-read')
      .expect(200)
      .expect({
        success: true,
        message: 'Đã xóa 2 thông báo đã đọc',
        data: { deletedCount: 2 },
      });

    expect(notifications.deleteAllRead).toHaveBeenCalledWith(userId);
    expect(notifications.deleteOne).not.toHaveBeenCalled();
  });
});
