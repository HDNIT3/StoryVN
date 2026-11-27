import mongoose, { Types } from 'mongoose';
import { authorSlugBase } from '../modules/users/author-slug.js';

interface AuthorProfile {
  _id: Types.ObjectId;
  penName?: string;
  slug?: string | null;
}

const missingSlug = {
  $or: [{ slug: null }, { slug: /^\s*$/ }],
};

async function backfillAuthorSlugs(uri: string, apply: boolean) {
  const connection = await mongoose.createConnection(uri, { autoIndex: false }).asPromise();
  try {
    const profiles = connection.collection<AuthorProfile>('author_profiles');
    const existing = profiles.find(
      { slug: { $type: 'string' } },
      { projection: { slug: 1, _id: 0 } },
    );
    const occupied = new Set<string>();
    for await (const profile of existing) {
      if (profile.slug?.trim()) occupied.add(profile.slug.toLowerCase());
    }

    const candidates = profiles.find(missingSlug, { projection: { penName: 1 } }).sort({ _id: 1 });
    let assigned = 0;
    let skipped = 0;
    for await (const profile of candidates) {
      const base = authorSlugBase(profile.penName ?? '');
      for (let suffix = 1; ; suffix++) {
        const slug = suffix === 1 ? base : `${base}-${suffix}`;
        if (occupied.has(slug)) continue;

        if (apply) {
          try {
            const result = await profiles.updateOne(
              { _id: profile._id, ...missingSlug },
              { $set: { slug } },
            );
            if (result.modifiedCount === 0) {
              skipped++;
              break;
            }
          } catch (error) {
            const duplicate = error as { code?: number; keyPattern?: { slug?: number } };
            if (duplicate.code !== 11000 || !duplicate.keyPattern?.slug) throw error;
            occupied.add(slug);
            continue;
          }
        }

        occupied.add(slug);
        assigned++;
        console.log(`${profile._id} → ${slug}`);
        break;
      }
    }

    console.log(`${apply ? 'Đã cập nhật' : 'Dự kiến cập nhật'} slug cho ${assigned} hồ sơ.`);
    if (skipped) console.log(`Đã bỏ qua ${skipped} hồ sơ được cập nhật trong lúc chạy.`);
  } finally {
    await connection.close();
  }
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Vui lòng cấu hình MONGODB_URI.');
  process.exitCode = 1;
} else {
  backfillAuthorSlugs(uri, process.argv.includes('--apply')).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Không thể bổ sung slug tác giả.');
    process.exitCode = 1;
  });
}
