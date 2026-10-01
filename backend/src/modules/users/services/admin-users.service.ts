import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  buildPaginationMeta,
  PaginatedResult,
} from '../../../common/dto/pagination.dto.js';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import {
  RefreshToken,
  RefreshTokenDocument,
} from '../../auth/schemas/refresh-token.schema.js';
import { QueryUsersDto } from '../dto/query-users.dto.js';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto.js';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto.js';
import {
  AuthorProfile,
  AuthorProfileDocument,
} from '../schemas/author-profile.schema.js';
import {
  AuthorRequest,
  AuthorRequestDocument,
} from '../schemas/author-request.schema.js';
import {
  ManagerProfile,
  ManagerProfileDocument,
  ManagerProfileStatus,
} from '../schemas/manager-profile.schema.js';
import {
  User,
  UserDocument,
  UserRole,
  UserStatus,
} from '../schemas/user.schema.js';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AuthorProfile.name)
    private authorProfileModel: Model<AuthorProfileDocument>,
    @InjectModel(ManagerProfile.name)
    private managerProfileModel: Model<ManagerProfileDocument>,
    @InjectModel(AuthorRequest.name)
    private authorRequestModel: Model<AuthorRequestDocument>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async findAll(query: QueryUsersDto): Promise<PaginatedResult<Partial<User>>> {
    const filter: Record<string, any> = {};

    if (query.role) {
      filter.role = query.role;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { email: searchRegex },
        { username: searchRegex },
        { displayName: searchRegex },
      ];
    }

    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, any> = { [sortField]: sortOrder };

    const [totalItems, users] = await Promise.all([
      this.userModel.countDocuments(filter),
      this.userModel
        .find(filter)
        .select('-passwordHash')
        .sort(sort)
        .skip(query.skip)
        .limit(query.limit)
        .lean(),
    ]);

    return {
      items: users as any[],
      pagination: buildPaginationMeta(totalItems, query.page, query.limit),
    };
  }

  async getStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalActive,
      totalBanned,
      usersCount,
      authorsCount,
      managersCount,
      adminsCount,
      newUsersToday,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ status: UserStatus.ACTIVE }),
      this.userModel.countDocuments({ status: UserStatus.BANNED }),
      this.userModel.countDocuments({ role: UserRole.USER }),
      this.userModel.countDocuments({ role: UserRole.AUTHOR }),
      this.userModel.countDocuments({ role: UserRole.MANAGER }),
      this.userModel.countDocuments({ role: UserRole.ADMIN }),
      this.userModel.countDocuments({ createdAt: { $gte: startOfToday } }),
    ]);

    return {
      totalUsers,
      status: {
        active: totalActive,
        banned: totalBanned,
      },
      roles: {
        user: usersCount,
        author: authorsCount,
        manager: managersCount,
        admin: adminsCount,
      },
      newUsersToday,
    };
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    const user = await this.userModel.findById(id).select('-passwordHash').lean();
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    let authorProfile: any = null;
    let authorRequest: any = null;
    let managerProfile: any = null;

    if (user.role === UserRole.AUTHOR) {
      authorProfile = await this.authorProfileModel
        .findOne({ userId: user._id })
        .lean();
      authorRequest = await this.authorRequestModel
        .findOne({ userId: user._id })
        .sort({ createdAt: -1 })
        .lean();
    } else if (user.role === UserRole.MANAGER) {
      managerProfile = await this.managerProfileModel
        .findOne({ userId: user._id })
        .populate('genreIds', 'name slug')
        .lean();
    }

    return {
      user,
      authorProfile,
      authorRequest,
      managerProfile,
    };
  }

  async updateStatus(
    id: string,
    dto: UpdateUserStatusDto,
    currentActor: UserDocument & { _id: any },
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    if (currentActor._id.toString() === id) {
      throw new BadRequestException(ErrorCode.CANNOT_MODIFY_SELF_STATUS);
    }

    const targetUser = await this.userModel.findById(id);
    if (!targetUser) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    if (currentActor.role === UserRole.MANAGER) {
      if (
        targetUser.role === UserRole.MANAGER ||
        targetUser.role === UserRole.ADMIN
      ) {
        throw new ForbiddenException(ErrorCode.MANAGER_PERMISSION_DENIED);
      }
    }

    if (
      targetUser.role === UserRole.ADMIN &&
      currentActor.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(ErrorCode.CANNOT_MODIFY_ADMIN);
    }

    targetUser.status = dto.status;

    if (dto.status === UserStatus.BANNED) {
      targetUser.versionToken = (targetUser.versionToken || 0) + 1;
      await this.refreshTokenModel.updateMany(
        { userId: targetUser._id, revokedAt: null },
        { revokedAt: new Date() },
      );
    }

    await targetUser.save();

    return {
      _id: targetUser._id,
      email: targetUser.email,
      username: targetUser.username,
      displayName: targetUser.displayName,
      role: targetUser.role,
      status: targetUser.status,
      updatedAt: targetUser.updatedAt,
    };
  }

  async updateRole(
    id: string,
    dto: UpdateUserRoleDto,
    currentAdmin: UserDocument & { _id: any },
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(ErrorCode.INVALID_OBJECT_ID);
    }

    if (currentAdmin._id.toString() === id) {
      throw new BadRequestException(ErrorCode.CANNOT_MODIFY_SELF_ROLE);
    }

    if (dto.role === UserRole.AUTHOR) {
      throw new BadRequestException(ErrorCode.AUTHOR_ROLE_USE_REQUEST_FLOW);
    }

    const targetUser = await this.userModel.findById(id);
    if (!targetUser) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    const previousRole = targetUser.role;
    targetUser.role = dto.role;

    if (dto.role === UserRole.MANAGER) {
      await this.managerProfileModel.findOneAndUpdate(
        { userId: targetUser._id },
        {
          status: ManagerProfileStatus.ACTIVE,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    } else if (previousRole === UserRole.MANAGER) {
      await this.managerProfileModel.findOneAndUpdate(
        { userId: targetUser._id },
        { status: ManagerProfileStatus.INACTIVE },
      );
    }

    targetUser.versionToken = (targetUser.versionToken || 0) + 1;
    await Promise.all([
      targetUser.save(),
      this.refreshTokenModel.updateMany(
        { userId: targetUser._id, revokedAt: null },
        { revokedAt: new Date() },
      ),
    ]);

    return {
      _id: targetUser._id,
      email: targetUser.email,
      username: targetUser.username,
      displayName: targetUser.displayName,
      role: targetUser.role,
      status: targetUser.status,
      updatedAt: targetUser.updatedAt,
    };
  }
}
