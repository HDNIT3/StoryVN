import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { buildPaginationMeta, PaginatedResult } from '../../../common/dto/pagination.dto.js';
import { ErrorCode } from '../../../common/enums/error-code.enum.js';
import { MailService } from '../../mail/mail.service.js';
import { CreateAuthorRequestDto } from '../dto/create-author-request.dto.js';
import { QueryAuthorRequestsDto } from '../dto/query-author-requests.dto.js';
import { ReviewAction, ReviewAuthorRequestDto } from '../dto/review-author-request.dto.js';
import { UpdateAuthorProfileDto } from '../dto/update-author-profile.dto.js';
import { UpdateAuthorRequestDto } from '../dto/update-author-request.dto.js';
import {
  AuthorProfile,
  AuthorProfileDocument,
  AuthorProfileStatus,
} from '../schemas/author-profile.schema.js';
import {
  AuthorRequest,
  AuthorRequestDocument,
  AuthorRequestStatus,
} from '../schemas/author-request.schema.js';
import { User, UserDocument, UserRole } from '../schemas/user.schema.js';

@Injectable()
export class AuthorRequestsService {
  private readonly logger = new Logger(AuthorRequestsService.name);

  constructor(
    @InjectModel(AuthorRequest.name)
    private authorRequestModel: Model<AuthorRequestDocument>,
    @InjectModel(AuthorProfile.name)
    private authorProfileModel: Model<AuthorProfileDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private mailService: MailService,
  ) {}

  async createRequest(userId: string, dto: CreateAuthorRequestDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    if (
      user.role === UserRole.AUTHOR ||
      user.role === UserRole.MANAGER ||
      user.role === UserRole.ADMIN
    ) {
      throw new BadRequestException(ErrorCode.ALREADY_AUTHOR);
    }

    const existingPending = await this.authorRequestModel.findOne({
      userId: new Types.ObjectId(userId),
      status: AuthorRequestStatus.PENDING,
    });
    if (existingPending) {
      throw new BadRequestException(ErrorCode.AUTHOR_REQUEST_PENDING);
    }

    const trimmedPenName = dto.penName.trim();
    const existingPenName = await this.authorProfileModel.findOne({
      penName: { $regex: new RegExp(`^${trimmedPenName}$`, 'i') },
    });
    if (existingPenName) {
      throw new BadRequestException(ErrorCode.PEN_NAME_ALREADY_EXISTS);
    }

    const previousRejected = await this.authorRequestModel.findOne({
      userId: new Types.ObjectId(userId),
      status: AuthorRequestStatus.REJECTED,
    });

    if (previousRejected) {
      previousRejected.penName = trimmedPenName;
      previousRejected.biography = dto.biography ? dto.biography.trim() : null;
      previousRejected.avatarUrl = dto.avatarUrl || user.avatarUrl || null;
      previousRejected.website = dto.website ? dto.website.trim() : null;
      previousRejected.socialLinks = dto.socialLinks || {};
      previousRejected.bankName = dto.bankName ? dto.bankName.trim() : null;
      previousRejected.bankAccountNumber = dto.bankAccountNumber
        ? dto.bankAccountNumber.trim()
        : null;
      previousRejected.bankAccountName = dto.bankAccountName
        ? dto.bankAccountName.trim().toUpperCase()
        : null;
      previousRejected.reason = dto.reason ? dto.reason.trim() : null;
      previousRejected.status = AuthorRequestStatus.PENDING;
      previousRejected.adminNote = null;
      previousRejected.processedBy = null;
      previousRejected.processedAt = null;
      return previousRejected.save();
    }

    const newRequest = new this.authorRequestModel({
      userId: user._id,
      penName: trimmedPenName,
      biography: dto.biography ? dto.biography.trim() : null,
      avatarUrl: dto.avatarUrl || user.avatarUrl || null,
      website: dto.website ? dto.website.trim() : null,
      socialLinks: dto.socialLinks || {},
      bankName: dto.bankName ? dto.bankName.trim() : null,
      bankAccountNumber: dto.bankAccountNumber
        ? dto.bankAccountNumber.trim()
        : null,
      bankAccountName: dto.bankAccountName
        ? dto.bankAccountName.trim().toUpperCase()
        : null,
      reason: dto.reason ? dto.reason.trim() : null,
      status: AuthorRequestStatus.PENDING,
    });

    return newRequest.save();
  }

  async getAuthorProfileAndRequestStatus(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    const [latestRequest, authorProfile] = await Promise.all([
      this.authorRequestModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .populate('processedBy', 'displayName email username'),
      this.authorProfileModel.findOne({ userId: new Types.ObjectId(userId) }),
    ]);

    const isProcessed = latestRequest
      ? latestRequest.status !== AuthorRequestStatus.PENDING
      : false;

    const canEdit = latestRequest
      ? latestRequest.status === AuthorRequestStatus.PENDING ||
        latestRequest.status === AuthorRequestStatus.REJECTED
      : false;

    return {
      currentRole: user.role,
      isAuthor: user.role === UserRole.AUTHOR,
      isProcessed,
      canEdit,
      request: latestRequest,
      authorProfile,
    };
  }

  async updatePendingOrRejectedRequest(
    userId: string,
    dto: UpdateAuthorRequestDto,
  ) {
    const request = await this.authorRequestModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });

    if (!request) {
      throw new NotFoundException(ErrorCode.AUTHOR_REQUEST_NOT_FOUND);
    }

    if (request.status === AuthorRequestStatus.APPROVED) {
      throw new BadRequestException(ErrorCode.AUTHOR_REQUEST_CANNOT_EDIT);
    }

    if (dto.penName && dto.penName.trim().toLowerCase() !== request.penName.toLowerCase()) {
      const trimmedPenName = dto.penName.trim();
      const existingPenName = await this.authorProfileModel.findOne({
        penName: { $regex: new RegExp(`^${trimmedPenName}$`, 'i') },
      });
      if (existingPenName) {
        throw new BadRequestException(ErrorCode.PEN_NAME_ALREADY_EXISTS);
      }
      request.penName = trimmedPenName;
    }

    if (dto.biography !== undefined) request.biography = dto.biography ? dto.biography.trim() : null;
    if (dto.avatarUrl !== undefined) request.avatarUrl = dto.avatarUrl;
    if (dto.website !== undefined) request.website = dto.website ? dto.website.trim() : null;
    if (dto.socialLinks !== undefined) request.socialLinks = dto.socialLinks;
    if (dto.bankName !== undefined) request.bankName = dto.bankName ? dto.bankName.trim() : null;
    if (dto.bankAccountNumber !== undefined) {
      request.bankAccountNumber = dto.bankAccountNumber ? dto.bankAccountNumber.trim() : null;
    }
    if (dto.bankAccountName !== undefined) {
      request.bankAccountName = dto.bankAccountName ? dto.bankAccountName.trim().toUpperCase() : null;
    }
    if (dto.reason !== undefined) request.reason = dto.reason ? dto.reason.trim() : null;

    if (request.status === AuthorRequestStatus.REJECTED) {
      request.status = AuthorRequestStatus.PENDING;
      request.adminNote = null;
      request.processedBy = null;
      request.processedAt = null;
    }

    return request.save();
  }

  async updateAuthorProfile(userId: string, dto: UpdateAuthorProfileDto) {
    const authorProfile = await this.authorProfileModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!authorProfile) {
      throw new NotFoundException(ErrorCode.AUTHOR_PROFILE_NOT_FOUND);
    }

    if (
      dto.penName &&
      dto.penName.trim().toLowerCase() !== authorProfile.penName.toLowerCase()
    ) {
      const trimmedPenName = dto.penName.trim();
      const existingPenName = await this.authorProfileModel.findOne({
        penName: { $regex: new RegExp(`^${trimmedPenName}$`, 'i') },
        userId: { $ne: authorProfile.userId },
      });
      if (existingPenName) {
        throw new BadRequestException(ErrorCode.PEN_NAME_ALREADY_EXISTS);
      }
      authorProfile.penName = trimmedPenName;
    }

    if (dto.biography !== undefined) {
      authorProfile.biography = dto.biography ? dto.biography.trim() : null;
    }
    if (dto.avatarUrl !== undefined) {
      authorProfile.avatarUrl = dto.avatarUrl ? dto.avatarUrl.trim() : null;
    }
    if (dto.website !== undefined) {
      authorProfile.website = dto.website ? dto.website.trim() : null;
    }
    if (dto.socialLinks !== undefined) {
      authorProfile.socialLinks = dto.socialLinks || {};
    }
    if (dto.bankName !== undefined) {
      authorProfile.bankName = dto.bankName ? dto.bankName.trim() : null;
    }
    if (dto.bankAccountNumber !== undefined) {
      authorProfile.bankAccountNumber = dto.bankAccountNumber
        ? dto.bankAccountNumber.trim()
        : null;
    }
    if (dto.bankAccountName !== undefined) {
      authorProfile.bankAccountName = dto.bankAccountName
        ? dto.bankAccountName.trim().toUpperCase()
        : null;
    }

    return authorProfile.save();
  }

  async getAuthorProfile(userId: string) {
    const authorProfile = await this.authorProfileModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    if (!authorProfile) {
      throw new NotFoundException(ErrorCode.AUTHOR_PROFILE_NOT_FOUND);
    }
    return authorProfile;
  }

  async findAllRequests(
    query: QueryAuthorRequestsDto,
  ): Promise<PaginatedResult<AuthorRequestDocument>> {
    const { status, search, page = 1, limit = 10 } = query;
    const filter: Record<string, any> = {};

    if (status) {
      filter.status = status;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { penName: searchRegex },
        { bankAccountName: searchRegex },
        { bankAccountNumber: searchRegex },
      ];
    }

    const skip = ((page || 1) - 1) * (limit || 10);

    const [items, totalItems] = await Promise.all([
      this.authorRequestModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'email username displayName avatarUrl role status')
        .populate('processedBy', 'email username displayName role')
        .exec(),
      this.authorRequestModel.countDocuments(filter),
    ]);

    return {
      items,
      pagination: buildPaginationMeta(totalItems, page, limit),
    };
  }

  async reviewRequest(
    requestId: string,
    reviewerId: string,
    dto: ReviewAuthorRequestDto,
  ) {
    const request = await this.authorRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException(ErrorCode.AUTHOR_REQUEST_NOT_FOUND);
    }

    if (request.status !== AuthorRequestStatus.PENDING) {
      throw new BadRequestException(ErrorCode.AUTHOR_REQUEST_ALREADY_PROCESSED);
    }

    const targetUser = await this.userModel.findById(request.userId);
    if (!targetUser) {
      throw new NotFoundException(ErrorCode.USER_NOT_FOUND);
    }

    if (dto.status === ReviewAction.APPROVED) {
      const duplicatePenName = await this.authorProfileModel.findOne({
        penName: { $regex: new RegExp(`^${request.penName}$`, 'i') },
        userId: { $ne: targetUser._id },
      });
      if (duplicatePenName) {
        throw new BadRequestException(ErrorCode.PEN_NAME_ALREADY_EXISTS);
      }

      targetUser.role = UserRole.AUTHOR;
      targetUser.versionToken = (targetUser.versionToken || 0) + 1;
      await targetUser.save();

      await this.authorProfileModel.findOneAndUpdate(
        { userId: targetUser._id },
        {
          userId: targetUser._id,
          penName: request.penName,
          biography: request.biography,
          avatarUrl: request.avatarUrl || targetUser.avatarUrl,
          website: request.website,
          socialLinks: request.socialLinks,
          bankName: request.bankName,
          bankAccountNumber: request.bankAccountNumber,
          bankAccountName: request.bankAccountName,
          status: AuthorProfileStatus.ACTIVE,
        },
        { upsert: true, new: true },
      );

      request.status = AuthorRequestStatus.APPROVED;
      request.processedBy = new Types.ObjectId(reviewerId);
      request.processedAt = new Date();
      request.adminNote = dto.adminNote?.trim() || null;
      await request.save();

      this.mailService
        .sendAuthorRequestApproved(
          targetUser.email,
          targetUser.displayName,
          request.penName,
        )
        .catch((err) =>
          this.logger.error(
            `Gửi email duyệt tác giả thất bại tới ${targetUser.email}: ${err.message}`,
          ),
        );

      return {
        message: 'Chấp thuận yêu cầu và đã nâng cấp quyền AUTHOR thành công',
        request,
      };
    } else {
      request.status = AuthorRequestStatus.REJECTED;
      request.processedBy = new Types.ObjectId(reviewerId);
      request.processedAt = new Date();
      request.adminNote = dto.adminNote?.trim() || null;
      await request.save();

      this.mailService
        .sendAuthorRequestRejected(
          targetUser.email,
          targetUser.displayName,
          request.penName,
          dto.adminNote?.trim(),
        )
        .catch((err) =>
          this.logger.error(
            `Gửi email từ chối tác giả thất bại tới ${targetUser.email}: ${err.message}`,
          ),
        );

      return {
        message: 'Từ chối yêu cầu nâng cấp tác giả thành công',
        request,
      };
    }
  }
}
