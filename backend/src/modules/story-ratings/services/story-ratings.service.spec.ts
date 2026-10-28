import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StoryStatus } from '../../stories/schemas/story.schema.js';
import { StoryRatingStatus } from '../schemas/story-rating.schema.js';
import { StoryRatingsService } from './story-ratings.service.js';

describe('StoryRatingsService', () => {
  let service: StoryRatingsService;
  let mockRatingModel: any;
  let mockStoryModel: any;

  const mockAuthorId = '507f1f77bcf86cd799439011';
  const mockUserId = '507f1f77bcf86cd799439022';
  const mockStoryId = '507f1f77bcf86cd799439033';

  beforeEach(() => {
    mockRatingModel = {
      findOneAndUpdate: vi.fn(),
      aggregate: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      countDocuments: vi.fn(),
      findByIdAndUpdate: vi.fn(),
    };

    mockStoryModel = {
      findById: vi.fn(),
      findByIdAndUpdate: vi.fn(),
    };

    service = new StoryRatingsService(mockRatingModel, mockStoryModel);
  });

  describe('rateStory', () => {
    it('ném lỗi nếu truyện không tồn tại', async () => {
      mockStoryModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      await expect(
        service.rateStory(mockUserId, mockStoryId, { rating: 5, review: 'Hay' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('ném lỗi nếu tác giả tự đánh giá truyện của chính mình', async () => {
      mockStoryModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: mockStoryId,
          authorId: { toString: () => mockUserId },
          status: StoryStatus.PUBLISHED,
        }),
      });

      await expect(
        service.rateStory(mockUserId, mockStoryId, { rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('ném lỗi nếu truyện chưa được xuất bản', async () => {
      mockStoryModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: mockStoryId,
          authorId: { toString: () => mockAuthorId },
          status: StoryStatus.DRAFT,
        }),
      });

      await expect(
        service.rateStory(mockUserId, mockStoryId, { rating: 5 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('đánh giá thành công và tính lại thống kê điểm số của truyện', async () => {
      mockStoryModel.findById.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: mockStoryId,
          authorId: { toString: () => mockAuthorId },
          status: StoryStatus.PUBLISHED,
        }),
      });

      const savedRating = {
        _id: '507f1f77bcf86cd799439044',
        userId: mockUserId,
        storyId: mockStoryId,
        rating: 5,
        review: 'Cực hay!',
        status: StoryRatingStatus.VISIBLE,
      };

      mockRatingModel.findOneAndUpdate.mockResolvedValue(savedRating);
      mockRatingModel.aggregate.mockResolvedValue([
        { _id: mockStoryId, avgRating: 4.5, count: 2 },
      ]);
      mockStoryModel.findByIdAndUpdate.mockResolvedValue({});

      const result = await service.rateStory(mockUserId, mockStoryId, {
        rating: 5,
        review: 'Cực hay!',
      });

      expect(result).toEqual(savedRating);
      expect(mockRatingModel.findOneAndUpdate).toHaveBeenCalled();
      expect(mockStoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        {
          $set: {
            'stats.ratingCount': 2,
            'stats.ratingAverage': 4.5,
          },
        },
      );
    });
  });

  describe('getRatingSummary', () => {
    it('trả về tóm tắt phân bổ 1-5 sao chuẩn xác', async () => {
      mockRatingModel.aggregate.mockResolvedValue([
        { _id: 5, count: 8 },
        { _id: 4, count: 2 },
      ]);

      const summary = await service.getRatingSummary(mockStoryId);

      expect(summary.ratingCount).toBe(10);
      expect(summary.ratingAverage).toBe(4.8);
      expect(summary.breakdown[5]).toBe(8);
      expect(summary.breakdown[4]).toBe(2);
      expect(summary.breakdown[1]).toBe(0);
    });
  });
});

