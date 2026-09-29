import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { AuthorRequestsController } from './controllers/author-requests.controller.js';
import { UsersController } from './controllers/users.controller.js';
import { AuthorProfile, AuthorProfileSchema } from './schemas/author-profile.schema.js';
import { AuthorRequest, AuthorRequestSchema } from './schemas/author-request.schema.js';
import { ManagerProfile, ManagerProfileSchema } from './schemas/manager-profile.schema.js';
import { User, UserSchema } from './schemas/user.schema.js';
import { AuthorRequestsService } from './services/author-requests.service.js';
import { UsersService } from './services/users.service.js';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AuthorProfile.name, schema: AuthorProfileSchema },
      { name: ManagerProfile.name, schema: ManagerProfileSchema },
      { name: AuthorRequest.name, schema: AuthorRequestSchema },
    ]),
  ],
  controllers: [UsersController, AuthorRequestsController],
  providers: [UsersService, AuthorRequestsService, AuthGuard, RolesGuard],
  exports: [UsersService, AuthorRequestsService, MongooseModule, AuthGuard, RolesGuard],
})
export class UsersModule {}
