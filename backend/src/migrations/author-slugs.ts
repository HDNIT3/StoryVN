import mongoose, { Types } from 'mongoose';
import { authorSlugBase, isReservedAuthorSlug } from '../modules/users/author-slug.js';

interface LegacyUser {
  _id: Types.ObjectId;
  username?: string;
  displayName: string;
  role: string;
}

interface AuthorProfile {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  penName: string;
  slug?: string;
  status: string;
}

async function migrate(uri: string, apply: boolean) {
  const connection = await mongoose.createConnection(uri, { autoIndex: false }).asPromise();
  try {
    const users = connection.collection<LegacyUser>('users');
    const profiles = connection.collection<AuthorProfile>('author_profiles');
    const existing = await profiles.find({}).sort({ _id: 1 }).toArray();
    const knownAuthors = new Set(existing.map((profile) => String(profile.userId)));
    const legacyUsers = await users
      .find({ $or: [{ role: 'AUTHOR' }, { _id: { $in: existing.map((profile) => profile.userId) } }] })
      .sort({ _id: 1 })
      .toArray();
    const usersById = new Map(legacyUsers.map((user) => [String(user._id), user]));
    const missingProfiles = legacyUsers
      .filter((user) => user.role === 'AUTHOR' && !knownAuthors.has(String(user._id)))
      .map((user): AuthorProfile => ({
        _id: new Types.ObjectId(),
        userId: user._id,
        penName: user.displayName,
        status: 'ACTIVE',
      }));

    const allProfiles = [...existing, ...missingProfiles];
    const reserved = new Map(existing.flatMap((profile) => profile.slug
      ? [[profile.slug, String(profile.userId)] as const]
      : []));
    const previousPaths = new Map<string, string>();
    for (const profile of allProfiles) {
      const owner = String(profile.userId);
      const previousPath = usersById.get(owner)?.username?.trim().toLowerCase();
      if (profile.slug || !previousPath || isReservedAuthorSlug(previousPath) || reserved.has(previousPath)) continue;
      previousPaths.set(owner, previousPath);
      reserved.set(previousPath, owner);
    }

    let updated = 0;
    for (const profile of allProfiles) {
      if (profile.slug) continue;
      const owner = String(profile.userId);
      const base = authorSlugBase(profile.penName);
      let slug = previousPaths.get(owner) || base;
      for (let suffix = 2; reserved.has(slug) && reserved.get(slug) !== owner; suffix++) {
        slug = `${base}-${suffix}`;
      }
      reserved.set(slug, owner);
      updated++;
      if (apply) {
        await profiles.updateOne(
          { userId: profile.userId },
          {
            $set: { slug },
            $setOnInsert: { penName: profile.penName, status: profile.status },
          },
          { upsert: true },
        );
      }
    }

    const legacyCount = await users.countDocuments({ username: { $exists: true } });
    if (apply) {
      await profiles.createIndex({ slug: 1 }, { unique: true, sparse: true });
      const indexes = await users.indexes();
      for (const index of indexes) {
        if (index.name && Object.hasOwn(index.key, 'username')) await users.dropIndex(index.name);
      }
      await users.updateMany({ username: { $exists: true } }, { $unset: { username: '' } });
    }
    console.log(`${apply ? 'Đã chuyển' : 'Dự kiến chuyển'} ${updated} hồ sơ tác giả và xóa username khỏi ${legacyCount} tài khoản.`);
  } finally {
    await connection.close();
  }
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('Vui lòng cung cấp MONGODB_URI cho môi trường cần chuyển dữ liệu.');
  process.exitCode = 1;
} else {
  migrate(uri, process.argv.includes('--apply')).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Chuyển dữ liệu thất bại');
    process.exitCode = 1;
  });
}
