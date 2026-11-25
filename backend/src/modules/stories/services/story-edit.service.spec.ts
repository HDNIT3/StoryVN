import { ConflictException, ForbiddenException } from '@nestjs/common';
import { Error as MongooseError, Types } from 'mongoose';
import { describe, expect, it, vi } from 'vitest';
import { RevisionStatus } from '../../../common/enums/revision-status.enum.js';
import { StoryAction } from '../dto/create-story.dto.js';
import {
  StoryAgeRating,
  StoryProgressState,
  StoryStatus,
  StoryVisibility,
} from '../schemas/story.schema.js';
import { AdminStoriesService } from './admin-stories.service.js';
import { StoriesService } from './stories.service.js';

function setup() {
  const authorId = new Types.ObjectId();
  const reviewerId = new Types.ObjectId().toString();
  const story = {
    _id: new Types.ObjectId(),
    authorId,
    title: 'Tên cũ',
    slug: 'duong-dan-rieng',
    description: '',
    coverUrl: 'https://example.com/cover.jpg',
    authorNote: 'Lời ngỏ cũ',
    genreIds: [],
    tagIds: [new Types.ObjectId()],
    ageRating: StoryAgeRating.ALL,
    status: StoryStatus.PUBLISHED,
    visibility: StoryVisibility.PUBLIC,
    hiddenByModerator: undefined as boolean | undefined,
    progressState: StoryProgressState.ONGOING,
    revisions: [] as {
      _id: Types.ObjectId;
      status: RevisionStatus;
      snapshot: Record<string, unknown>;
    }[],
    $where: {},
    save: vi.fn().mockResolvedValue(undefined),
    markModified: vi.fn(),
  };
  const chain = {
    select: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    lean: vi.fn().mockReturnThis(),
    exec: vi.fn().mockImplementation(async () => ({ ...story })),
  };
  const model = {
    findOne: vi.fn(() => ({ select: vi.fn().mockResolvedValue(story) })),
    findById: vi.fn().mockReturnValue(chain),
  };
  const notifications = { create: vi.fn(), notifyModerationToModerators: vi.fn() };
  const stories = new StoriesService(
    model as never, {} as never, {} as never, {} as never, notifications as never, {} as never,
  );
  const admin = new AdminStoriesService(
    model as never, {} as never, {} as never, notifications as never,
  );
  vi.spyOn(admin, 'findById').mockResolvedValue({});
  const identifier = story._id.toString();
  const update = (dto: Parameters<StoriesService['updateMyStory']>[2]) =>
    stories.updateMyStory(authorId, identifier, dto);
  const queueRevision = (title: string) => {
    story.revisions.push({
      _id: new Types.ObjectId(),
      status: RevisionStatus.PENDING_REVIEW,
      snapshot: { title, ageRating: story.ageRating },
    });
  };
  return { story, update, admin, reviewerId, identifier, queueRevision, chain, model };
}

describe('sửa tác phẩm', () => {
  it('cập nhật tiến độ trong khi bản nội dung vẫn chờ duyệt', async () => {
    const { story, update, queueRevision } = setup();
    queueRevision('Tên chờ duyệt');

    await update({ progressState: StoryProgressState.COMPLETED });

    expect(story.progressState).toBe(StoryProgressState.COMPLETED);
    expect(story.revisions[0].status).toBe(RevisionStatus.PENDING_REVIEW);
    expect(story.revisions[0].snapshot.title).toBe('Tên chờ duyệt');
  });

  it('lưu thay đổi nội dung vào bản sửa và áp dụng việc xóa thẻ ngay', async () => {
    const { story, update } = setup();
    await update({ action: StoryAction.DRAFT, coverImage: '', authorNote: '', tagIds: [] });

    expect(story.revisions[0].snapshot).toMatchObject({
      coverUrl: null,
      authorNote: '',
      tagIds: [],
    });
    expect(story.tagIds).toEqual([]);
  });

  it('cập nhật thể loại và thẻ ngay, kể cả khi một bản sửa cũ đang chờ duyệt', async () => {
    const { story, update, admin, reviewerId, identifier, queueRevision, chain } = setup();
    queueRevision('Tên chờ duyệt');
    story.revisions[0].snapshot.genreIds = [new Types.ObjectId()];
    story.revisions[0].snapshot.tagIds = [...story.tagIds];
    const newGenre = new Types.ObjectId();

    await update({ genreIds: [String(newGenre)], tagIds: [] });

    expect(story.genreIds).toEqual([newGenre]);
    expect(story.tagIds).toEqual([]);
    expect(story.revisions[0].status).toBe(RevisionStatus.PENDING_REVIEW);

    chain.select.mockResolvedValueOnce(story);
    await admin.approveStory(identifier, reviewerId);

    expect(story.title).toBe('Tên chờ duyệt');
    expect(story.genreIds).toEqual([newGenre]);
    expect(story.tagIds).toEqual([]);
  });

  it('gửi lại nội dung kèm cài đặt trong một lần cập nhật bản chờ duyệt', async () => {
    const { story, update, queueRevision } = setup();
    queueRevision('Tên chờ duyệt');
    const revisionId = story.revisions[0]._id;

    await update({
      description: 'Tóm tắt mới',
      progressState: StoryProgressState.COMPLETED,
      action: StoryAction.SUBMIT,
    });

    expect(story.progressState).toBe(StoryProgressState.COMPLETED);
    expect(story.description).toBe('');
    expect(story.revisions).toHaveLength(1);
    expect(story.revisions[0]).toMatchObject({
      _id: revisionId,
      status: RevisionStatus.PENDING_REVIEW,
      snapshot: { title: 'Tên chờ duyệt', description: 'Tóm tắt mới' },
    });
    expect(story.save).toHaveBeenCalledTimes(1);
  });

  it('duyệt tên mới và giữ đường dẫn đang sử dụng', async () => {
    const { story, admin, reviewerId, identifier, queueRevision, chain } = setup();
    queueRevision('Tên mới');
    chain.select.mockResolvedValueOnce(story);

    await admin.approveStory(identifier, reviewerId);

    expect(story.title).toBe('Tên mới');
    expect(story.slug).toBe('duong-dan-rieng');
  });

  it('chỉ cho tác giả công khai lại sau khi quản trị viên gỡ ẩn', async () => {
    const { story, update, admin, reviewerId, identifier, chain, model } = setup();
    chain.select.mockResolvedValueOnce(story);
    await admin.hideStory(identifier, reviewerId);

    expect(story.visibility).toBe(StoryVisibility.PRIVATE);
    await expect(update({ visibility: StoryVisibility.PUBLIC })).rejects.toBeInstanceOf(ForbiddenException);
    await update({ progressState: StoryProgressState.ON_HOLD });
    expect(story.visibility).toBe(StoryVisibility.PRIVATE);

    model.findById.mockResolvedValueOnce(story);
    await admin.unhideStory(identifier, reviewerId);
    expect(story.hiddenByModerator).toBe(false);
    await update({ visibility: StoryVisibility.PUBLIC });
    expect(story.$where).toEqual({ hiddenByModerator: { $ne: true } });
  });

  it('báo xung đột nếu quản trị viên vừa ẩn tác phẩm trong lúc lưu công khai', async () => {
    const { story, update } = setup();
    story.visibility = StoryVisibility.PRIVATE;
    story.save.mockRejectedValueOnce(new MongooseError.DocumentNotFoundError({}));

    await expect(update({ visibility: StoryVisibility.PUBLIC })).rejects.toBeInstanceOf(ConflictException);
    expect(story.$where).toEqual({ hiddenByModerator: { $ne: true } });
  });
});
