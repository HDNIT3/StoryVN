import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import {
  comparePassword,
  hashPassword,
} from '../../../common/utils/hash.util.js';
import {
  RefreshToken,
  RefreshTokenDocument,
} from '../../auth/schemas/refresh-token.schema.js';
import { ChangePasswordDto } from '../dto/change-password.dto.js';
import { UpdateAvatarDto } from '../dto/update-avatar.dto.js';
import { UpdateProfileDto } from '../dto/update-profile.dto.js';
import { User, UserDocument } from '../schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() });
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username: username.trim() });
  }

  async findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({
      $or: [
        { email: email.toLowerCase().trim() },
        { username: username.trim() },
      ],
    });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId });
  }

  async incrementVersionToken(userId: any): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $inc: { versionToken: 1 } },
      { new: true },
    );
  }

  async updatePasswordHash(
    userId: any,
    passwordHash: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        passwordHash,
        $inc: { versionToken: 1 },
      },
      { new: true },
    );
  }

  async create(userData: Partial<User>): Promise<UserDocument> {
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    if (dto.displayName !== undefined) {
      user.displayName = dto.displayName.trim();
    }

    return user.save();
  }

  async updateAvatar(
    userId: string,
    dto: UpdateAvatarDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    user.avatarUrl = dto.avatarUrl.trim();
    return user.save();
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException(ErrorCode.CONFIRM_PASSWORD_MISMATCH);
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException(ErrorCode.NEW_PASSWORD_SAME_AS_OLD);
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    if (!user.passwordHash) {
      throw new BadRequestException(ErrorCode.ACCOUNT_REGISTERED_WITH_GOOGLE);
    }

    const isMatch = await comparePassword(dto.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException(ErrorCode.OLD_PASSWORD_INCORRECT);
    }

    const newHash = await hashPassword(dto.newPassword);

    await Promise.all([
      this.userModel.findByIdAndUpdate(userId, {
        passwordHash: newHash,
        $inc: { versionToken: 1 },
      }),
      this.refreshTokenModel.updateMany(
        { userId, revokedAt: null },
        { revokedAt: new Date() },
      ),
    ]);
  }
}
