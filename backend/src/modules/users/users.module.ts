import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { RefreshToken, RefreshTokenSchema } from '../auth/schemas/refresh-token.schema.js';
import { Genre, GenreSchema } from '../genres/schemas/genre.schema.js';
import { Story, StorySchema } from '../stories/schemas/story.schema.js';
import { AdminUsersController } from './controllers/admin-users.controller.js';
import { AuthorRequestsController } from './controllers/author-requests.controller.js';
import { AuthorsController } from './controllers/authors.controller.js';
import { UsersController } from './controllers/users.controller.js';
import { AuthorProfile, AuthorProfileSchema } from './schemas/author-profile.schema.js';
import { AuthorRequest, AuthorRequestSchema } from './schemas/author-request.schema.js';
import { ManagerProfile, ManagerProfileSchema } from './schemas/manager-profile.schema.js';
import { User, UserSchema } from './schemas/user.schema.js';
import { AdminUsersService } from './services/admin-users.service.js';
import { AuthorRequestsService } from './services/author-requests.service.js';
import { AuthorsService } from './services/authors.service.js';
import { UsersService } from './services/users.service.js';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AuthorProfile.name, schema: AuthorProfileSchema },
      { name: ManagerProfile.name, schema: ManagerProfileSchema },
      { name: AuthorRequest.name, schema: AuthorRequestSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: Story.name, schema: StorySchema },
      { name: Genre.name, schema: GenreSchema },
    ]),
  ],
  controllers: [
    UsersController,
    AuthorRequestsController,
    AdminUsersController,
    AuthorsController,
  ],
  providers: [
    UsersService,
    AdminUsersService,
    AuthorRequestsService,
    AuthorsService,
    AuthGuard,
    RolesGuard,
  ],
  exports: [
    UsersService,
    AdminUsersService,
    AuthorRequestsService,
    AuthorsService,
    MongooseModule,
    AuthGuard,
    RolesGuard,
  ],
})
export class UsersModule {}
