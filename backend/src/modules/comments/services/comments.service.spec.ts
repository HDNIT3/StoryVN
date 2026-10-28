import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StoryStatus } from '../../stories/schemas/story.schema.js';
import { UserRole } from '../../users/schemas/user.schema.js';
import { CommentStatus } from '../schemas/comment.schema.js';
import { CommentsService } from './comments.service.js';

describe('CommentsService', () => {
  let service: CommentsService;
  let mockCommentModel: any;
  let mockStoryModel: any;
  let mockChapterModel: any;
  let mockNotificationsService: any;

  const mockAuthorId = '507f1f77bcf86cd799439011';
  const mockUserId = '507f1f77bcf86cd799439022';
  const mockOtherUserId = '507f1f77bcf86cd799439088';
  const mockStoryId = '507f1f77bcf86cd799439033';
  const mockChapterId = '507f1f77bcf86cd799439044';
  const mockCommentId = '507f1f77bcf86cd799439055';

  beforeEach(() => {
    mockCommentModel = {
      create: vi.fn(),
      findById: vi.fn(),
      find: vi.fn(),
      countDocuments: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
    };

    mockStoryModel = {
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
    };

    mockChapterModel = {
      findById: vi.fn(),
    };

    mockNotificationsService = {
      create: vi.fn().mockResolvedValue({}),
    };

    service = new CommentsService(
      mockCommentModel,
      mockStoryModel,
      mockChapterModel,
      mockNotificationsService,
    );
  });

  describe('createComment', () => {
    it('bình luận mới tạo ra có status là VISIBLE và hiện ra luôn', async () => {
      mockStoryModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: mockStoryId,
          title: 'Truyện hay 2026',
          authorId: { toString: () => mockAuthorId },
          status: StoryStatus.PUBLISHED,
        }),
      });

      const createdComment = {
        _id: mockCommentId,
        userId: mockUserId,
        storyId: mockStoryId,
        content: 'Bình luận thử nghiệm',
        status: CommentStatus.VISIBLE,
      };

      mockCommentModel.create.mockResolvedValue(createdComment);
      const queryMock: any = {};
      queryMock.populate = vi.fn().mockReturnValue(queryMock);
      queryMock.lean = vi.fn().mockResolvedValue(createdComment);
      mockCommentModel.findById.mockReturnValue(queryMock);

      const result = await service.createComment(mockUserId, {
        storyId: mockStoryId,
        content: 'Bình luận thử nghiệm',
      });

      expect(mockCommentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: CommentStatus.VISIBLE,
          content: 'Bình luận thử nghiệm',
        }),
      );
      expect(result.status).toBe(CommentStatus.VISIBLE);
      expect(mockStoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        mockStoryId,
        { $inc: { 'stats.commentCount': 1 } },
      );
    });

    it('tạo phản hồi tầng 2 thì tự động xác định parentId gốc và replyToUserId', async () => {
      const mockChildCommentId = '507f1f77bcf86cd799439066';
      mockStoryModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: mockStoryId,
          title: 'Truyện hay 2026',
          authorId: { toString: () => mockAuthorId },
          status: StoryStatus.PUBLISHED,
        }),
      });

      // parentComment ở tầng 2: bản thân nó đã có parentId là mockCommentId
      mockCommentModel.findById.mockResolvedValueOnce({
        _id: mockChildCommentId,
        storyId: mockStoryId,
        parentId: mockCommentId,
        userId: mockOtherUserId,
        status: CommentStatus.VISIBLE,
      });

      const createdReply = {
        _id: '507f1f77bcf86cd799439077',
        userId: mockUserId,
        storyId: mockStoryId,
        parentId: mockCommentId,
        replyToUserId: mockOtherUserId,
        content: 'Phản hồi tầng 2',
        status: CommentStatus.VISIBLE,
      };

      mockCommentModel.create.mockResolvedValue(createdReply);
      const queryMock: any = {};
      queryMock.populate = vi.fn().mockReturnValue(queryMock);
      queryMock.lean = vi.fn().mockResolvedValue(createdReply);
      mockCommentModel.findById.mockReturnValue(queryMock);

      await service.createComment(mockUserId, {
        storyId: mockStoryId,
        parentId: mockChildCommentId,
        content: 'Phản hồi tầng 2',
      });

      expect(mockCommentModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          parentId: mockCommentId,
          replyToUserId: mockOtherUserId,
          content: 'Phản hồi tầng 2',
        }),
      );
    });
  });

  describe('toggleCommentVisibility', () => {
    it('cho phép Tác giả của truyện ẩn hoặc hiện lại bình luận', async () => {
      const mockCommentDoc = {
        _id: mockCommentId,
        storyId: mockStoryId,
        status: CommentStatus.VISIBLE,
        save: vi.fn().mockResolvedValue(true),
      };

      mockCommentModel.findById.mockResolvedValue(mockCommentDoc);
      mockStoryModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: mockStoryId,
          authorId: { toString: () => mockAuthorId },
        }),
      });

      const hiddenQueryMock: any = {};
      hiddenQueryMock.populate = vi.fn().mockReturnValue(hiddenQueryMock);
      hiddenQueryMock.lean = vi.fn().mockResolvedValue({
        ...mockCommentDoc,
        status: CommentStatus.HIDDEN,
      });
      mockCommentModel.findById
        .mockReturnValueOnce(mockCommentDoc)
        .mockReturnValue(hiddenQueryMock);

      // Tác giả truyện ẩn bình luận
      await service.toggleCommentVisibility(
        mockAuthorId,
        UserRole.AUTHOR,
        mockCommentId,
        CommentStatus.HIDDEN,
      );

      expect(mockCommentDoc.status).toBe(CommentStatus.HIDDEN);
      expect(mockCommentDoc.save).toHaveBeenCalled();
    });

    it('cho phép Admin ẩn hoặc hiện lại bình luận', async () => {
      const mockCommentDoc = {
        _id: mockCommentId,
        storyId: mockStoryId,
        status: CommentStatus.HIDDEN,
        save: vi.fn().mockResolvedValue(true),
      };

      mockCommentModel.findById.mockResolvedValue(mockCommentDoc);
      mockStoryModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: mockStoryId,
          authorId: { toString: () => mockAuthorId },
        }),
      });

      const visibleQueryMock: any = {};
      visibleQueryMock.populate = vi.fn().mockReturnValue(visibleQueryMock);
      visibleQueryMock.lean = vi.fn().mockResolvedValue({
        ...mockCommentDoc,
        status: CommentStatus.VISIBLE,
      });
      mockCommentModel.findById
        .mockReturnValueOnce(mockCommentDoc)
        .mockReturnValue(visibleQueryMock);

      // Admin hiện lại bình luận
      await service.toggleCommentVisibility(
        'admin_id_123',
        UserRole.ADMIN,
        mockCommentId,
        CommentStatus.VISIBLE,
      );

      expect(mockCommentDoc.status).toBe(CommentStatus.VISIBLE);
      expect(mockCommentDoc.save).toHaveBeenCalled();
    });

    it('ném lỗi Forbidden nếu người dùng không phải tác giả truyện và không phải admin/quản lý', async () => {
      const mockCommentDoc = {
        _id: mockCommentId,
        storyId: mockStoryId,
        status: CommentStatus.VISIBLE,
      };

      mockCommentModel.findById.mockResolvedValue(mockCommentDoc);
      mockStoryModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: mockStoryId,
          authorId: { toString: () => mockAuthorId },
        }),
      });

      await expect(
        service.toggleCommentVisibility(
          mockOtherUserId,
          UserRole.USER,
          mockCommentId,
          CommentStatus.HIDDEN,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

