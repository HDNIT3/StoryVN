import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import { RevisionStatus } from '../../../common/enums/revision-status.enum.js';
import type { NotificationsService } from '../../notifications/notifications.service.js';
import type { StoryDocument } from '../../stories/schemas/story.schema.js';
import type { StoryDailyViewDocument } from '../../stories/schemas/story-daily-view.schema.js';
import { UserRole } from '../../users/schemas/user.schema.js';
import type { ChapterDocument } from '../schemas/chapter.schema.js';
import { ChapterStatus } from '../schemas/chapter.schema.js';
import { ChapterAction } from '../dto/create-chapter.dto.js';
import { ChaptersService } from './chapters.service.js';

describe('published chapter pricing independent of content review', () => {
  const authorId = new Types.ObjectId();
  const storyId = new Types.ObjectId();
  const chapterId = new Types.ObjectId();
  type Revision = {
    _id: Types.ObjectId;
    status: RevisionStatus;
    snapshot: Record<string, unknown>;
  };
  let chapter: {
    _id: Types.ObjectId;
    storyId: Types.ObjectId;
    status: ChapterStatus;
    chapterNumber: number;
    title: string;
    content: string;
    isFree: boolean;
    coinPrice: number;
    requirePreviousChapter: boolean;
    scheduledAt: null;
    revisions: Revision[];
    save: ReturnType<typeof vi.fn>;
  };
  let service: ChaptersService;
  let notify: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    chapter = {
      _id: chapterId,
      storyId,
      status: ChapterStatus.PUBLISHED,
      chapterNumber: 2,
      title: 'Tiêu đề chính thức',
      content: 'Nội dung chính thức',
      isFree: false,
      coinPrice: 10,
      requirePreviousChapter: false,
      scheduledAt: null,
      revisions: [],
      save: vi.fn(),
    };
    chapter.save.mockImplementation(async () => chapter);
    const query = {
      select: vi.fn().mockReturnThis(),
      lean: vi.fn(async () => ({
        ...chapter,
        revisions: [...chapter.revisions],
      })),
      then: (
        resolve: (value: typeof chapter) => unknown,
        reject: (error: unknown) => unknown,
      ) => Promise.resolve(chapter).then(resolve, reject),
    };
    notify = vi.fn().mockResolvedValue(undefined);
    service = new ChaptersService(
      { findById: vi.fn(() => query) } as unknown as Model<ChapterDocument>,
      {
        findById: vi
          .fn()
          .mockResolvedValue({ _id: storyId, authorId, title: 'Truyện' }),
      } as unknown as Model<StoryDocument>,
      {} as Model<StoryDailyViewDocument>,
      {
        notifyModerationToModerators: notify,
      } as unknown as NotificationsService,
    );
  });

  const update = (dto: Parameters<ChaptersService['updateChapter']>[2]) =>
    service.updateChapter(authorId, String(chapterId), dto, UserRole.AUTHOR);

  it('changes price immediately without creating a revision or review notification', async () => {
    await update({ coinPrice: 50, action: ChapterAction.DRAFT });
    expect(chapter.coinPrice).toBe(50);
    expect(chapter.status).toBe(ChapterStatus.PUBLISHED);
    expect(chapter.revisions).toHaveLength(0);
    expect(notify).not.toHaveBeenCalled();
  });

  it('switches to free immediately and clears price and previous-purchase restriction', async () => {
    chapter.requirePreviousChapter = true;
    await update({ isFree: true });
    expect(chapter.isFree).toBe(true);
    expect(chapter.coinPrice).toBe(0);
    expect(chapter.requirePreviousChapter).toBe(false);
    expect(chapter.revisions).toHaveLength(0);
  });

  it('switches from free to paid immediately with a valid price', async () => {
    chapter.isFree = true;
    chapter.coinPrice = 0;
    await update({ isFree: false, coinPrice: 20 });
    expect(chapter.isFree).toBe(false);
    expect(chapter.coinPrice).toBe(20);
    expect(chapter.revisions).toHaveLength(0);
  });

  it('rejects a paid chapter with zero price without saving', async () => {
    await expect(update({ coinPrice: 0 })).rejects.toThrow();
    expect(chapter.save).not.toHaveBeenCalled();
  });

  it('retains the pending content and review status when only pricing changes', async () => {
    chapter.revisions.push({
      _id: new Types.ObjectId(),
      status: RevisionStatus.PENDING_REVIEW,
      snapshot: {
        title: 'Tiêu đề chờ duyệt',
        content: 'Nội dung chờ duyệt',
        isFree: false,
        coinPrice: 5,
        requirePreviousChapter: false,
      },
    });
    await update({
      coinPrice: 30,
      requirePreviousChapter: true,
      action: ChapterAction.DRAFT,
    });
    expect(chapter.title).toBe('Tiêu đề chính thức');
    expect(chapter.coinPrice).toBe(30);
    expect(chapter.requirePreviousChapter).toBe(true);
    expect(chapter.revisions).toHaveLength(1);
    expect(chapter.revisions[0].status).toBe(RevisionStatus.PENDING_REVIEW);
    expect(chapter.revisions[0].snapshot.coinPrice).toBe(30);
    expect(chapter.revisions[0].snapshot.requirePreviousChapter).toBe(true);
    expect(notify).not.toHaveBeenCalled();
  });

  it('applies pricing now while sending title/content changes for review', async () => {
    await update({
      title: 'Tiêu đề mới',
      content: 'Nội dung mới',
      coinPrice: 40,
      action: ChapterAction.SUBMIT,
    });
    expect(chapter.title).toBe('Tiêu đề chính thức');
    expect(chapter.content).toBe('Nội dung chính thức');
    expect(chapter.coinPrice).toBe(40);
    expect(chapter.revisions[0].status).toBe(RevisionStatus.PENDING_REVIEW);
    expect(chapter.revisions[0].snapshot.title).toBe('Tiêu đề mới');
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('submits updated content and pricing in one save when a revision is pending', async () => {
    const revisionId = new Types.ObjectId();
    chapter.revisions.push({
      _id: revisionId,
      status: RevisionStatus.PENDING_REVIEW,
      snapshot: {
        title: 'Tiêu đề chờ duyệt',
        content: 'Nội dung chờ duyệt',
      },
    });

    await update({
      content: 'Nội dung gửi lại',
      coinPrice: 40,
      action: ChapterAction.SUBMIT,
    });

    expect(chapter.content).toBe('Nội dung chính thức');
    expect(chapter.coinPrice).toBe(40);
    expect(chapter.revisions).toHaveLength(1);
    expect(chapter.revisions[0]).toMatchObject({
      _id: revisionId,
      status: RevisionStatus.PENDING_REVIEW,
      snapshot: { title: 'Tiêu đề chờ duyệt', content: 'Nội dung gửi lại' },
    });
    expect(chapter.save).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('enables and disables the previous-chapter restriction immediately', async () => {
    await update({ requirePreviousChapter: true, action: ChapterAction.DRAFT });
    expect(chapter.requirePreviousChapter).toBe(true);

    await update({ requirePreviousChapter: false, action: ChapterAction.DRAFT });
    expect(chapter.requirePreviousChapter).toBe(false);
    expect(chapter.revisions).toHaveLength(0);
    expect(notify).not.toHaveBeenCalled();
  });

  it('does not overwrite pricing from an old draft when submitting content later', async () => {
    chapter.coinPrice = 70;
    chapter.requirePreviousChapter = true;
    chapter.revisions.push({
      _id: new Types.ObjectId(),
      status: RevisionStatus.DRAFT,
      snapshot: {
        title: 'Tiêu đề nháp',
        content: 'Nội dung nháp',
        isFree: false,
        coinPrice: 5,
        requirePreviousChapter: false,
      },
    });
    await update({ action: ChapterAction.SUBMIT });
    expect(chapter.coinPrice).toBe(70);
    expect(chapter.requirePreviousChapter).toBe(true);
    expect(chapter.revisions[0].snapshot.coinPrice).toBe(70);
    expect(chapter.revisions[0].snapshot.requirePreviousChapter).toBe(true);
    expect(chapter.revisions[0].status).toBe(RevisionStatus.PENDING_REVIEW);
  });
});
