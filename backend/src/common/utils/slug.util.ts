import { Model, Types } from 'mongoose';

export function toSlug(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export interface GenerateUniqueSlugOptions {
  excludeId?: Types.ObjectId | string;
  slugField?: string;
  fallback?: string;
  separator?: string;
}

export async function generateUniqueSlug<T = any>(
  model: Model<T>,
  sourceText: string,
  options: GenerateUniqueSlugOptions = {},
): Promise<string> {
  const {
    excludeId,
    slugField = 'slug',
    fallback = 'item',
    separator = '-',
  } = options;

  const baseSlug = toSlug(sourceText) || fallback;
  let candidateSlug = baseSlug;
  let counter = 1;

  while (true) {
    const filter: Record<string, any> = {
      [slugField]: candidateSlug,
    };

    if (excludeId) {
      filter._id = {
        $ne: typeof excludeId === 'string' ? new Types.ObjectId(excludeId) : excludeId,
      };
    }

    const exists = await model.findOne(filter).select('_id').lean();
    if (!exists) {
      return candidateSlug;
    }

    candidateSlug = `${baseSlug}${separator}${counter}`;
    counter++;
  }
}

export async function isSlugAvailable<T = any>(
  model: Model<T>,
  slug: string,
  options: {
    excludeId?: Types.ObjectId | string;
    slugField?: string;
  } = {},
): Promise<boolean> {
  const { excludeId, slugField = 'slug' } = options;
  const filter: Record<string, any> = {
    [slugField]: slug,
  };

  if (excludeId) {
    filter._id = {
      $ne: typeof excludeId === 'string' ? new Types.ObjectId(excludeId) : excludeId,
    };
  }

  const exists = await model.findOne(filter).select('_id').lean();
  return !exists;
}
