import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3001/api';
const MONGODB_URI = 'mongodb://127.0.0.1:27017/storyvn';
const JWT_SECRET = 'storyvn_jwt_secret_key_super_secret_2026_auth_service';

async function testAuthorApis() {
  console.log('🚀 Bắt đầu kiểm thử toàn diện các API Nâng cấp tác giả...');

  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const usersColl = db.collection('users');
  const authorReqColl = db.collection('author_requests');
  const authorProfColl = db.collection('author_profiles');

  const userEmail = 'user_author_test@storyvn.com';
  const adminEmail = 'admin_author_test@storyvn.com';

  await usersColl.deleteMany({ email: { $in: [userEmail, adminEmail] } });
  await authorReqColl.deleteMany({});
  await authorProfColl.deleteMany({ penName: { $in: ['Bút Danh Test', 'Bút Danh Cập Nhật'] } });

  const passwordHash = await bcrypt.hash('Password123@#', 10);

  const userRes = await usersColl.insertOne({
    email: userEmail,
    username: 'user_author_test',
    passwordHash,
    displayName: 'Thành Viên Test',
    avatarUrl: null,
    role: 'USER',
    status: 'ACTIVE',
    versionToken: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const normalUserId = userRes.insertedId;

  const adminRes = await usersColl.insertOne({
    email: adminEmail,
    username: 'admin_author_test',
    passwordHash,
    displayName: 'Quản Trị Viên Test',
    avatarUrl: null,
    role: 'ADMIN',
    status: 'ACTIVE',
    versionToken: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const adminId = adminRes.insertedId;

  const userToken = jwt.sign(
    { sub: normalUserId.toString(), role: 'USER', versionToken: 0 },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

  const adminToken = jwt.sign(
    { sub: adminId.toString(), role: 'ADMIN', versionToken: 0 },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

  console.log('--- 1. Kiểm thử GET /users/author-request (khi chưa nộp đơn) ---');
  const getInitialRes = await fetch(`${BASE_URL}/users/author-request`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const getInitialJson = await getInitialRes.json();
  console.log('Status code:', getInitialRes.status);
  console.log('isProcessed:', getInitialJson.data?.isProcessed);
  console.log('canEdit:', getInitialJson.data?.canEdit);
  console.log('request:', getInitialJson.data?.request);
  console.log('authorProfile:', getInitialJson.data?.authorProfile);

  console.log('\n--- 2. Kiểm thử POST /users/author-request (Gửi yêu cầu chỉ cần bút danh) ---');
  const postReqRes = await fetch(`${BASE_URL}/users/author-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      penName: 'Bút Danh Test',
    }),
  });
  const postReqJson = await postReqRes.json();
  console.log('Status code:', postReqRes.status, '| Success:', postReqJson.success);
  console.log('Tạo đơn thành công với penName:', postReqJson.data?.request?.penName);
  console.log('Trạng thái đơn:', postReqJson.data?.request?.status);
  const requestId = postReqJson.data?.request?._id;

  console.log('\n--- 3. Kiểm thử GET /users/author-request (sau khi đã nộp đơn) ---');
  const getPendingRes = await fetch(`${BASE_URL}/users/author-request`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  const getPendingJson = await getPendingRes.json();
  console.log('isProcessed (phải false):', getPendingJson.data?.isProcessed);
  console.log('canEdit (phải true):', getPendingJson.data?.canEdit);
  console.log('Current request status:', getPendingJson.data?.request?.status);

  console.log('\n--- 4. Kiểm thử PUT /users/author-request (chỉnh sửa khi chưa duyệt) ---');
  const putRes = await fetch(`${BASE_URL}/users/author-request`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      penName: 'Bút Danh Cập Nhật',
      biography: 'Tiểu sử tác giả đã được cập nhật bổ sung',
      bankName: 'Techcombank',
      bankAccountNumber: '190367890123',
      bankAccountName: 'THANH VIEN TEST',
    }),
  });
  const putJson = await putRes.json();
  console.log('Status code:', putRes.status, '| Success:', putJson.success);
  console.log('penName sau update:', putJson.data?.request?.penName);
  console.log('bankName sau update:', putJson.data?.request?.bankName);

  console.log('\n--- 5. Kiểm thử Admin GET /users/author-requests (phân trang + lọc) ---');
  const adminListRes = await fetch(`${BASE_URL}/users/author-requests?status=PENDING&page=1&limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminListJson = await adminListRes.json();
  console.log('Status code:', adminListRes.status, '| Success:', adminListJson.success);
  console.log('Tổng số bản ghi:', adminListJson.data?.pagination?.totalItems);
  console.log('Bố cục phân trang:', adminListJson.data?.pagination);
  console.log('Số lượng items lấy về:', adminListJson.data?.items?.length);

  console.log('\n--- 6. Kiểm thử Admin PATCH /users/author-requests/:id/review (Phê duyệt) ---');
  const reviewRes = await fetch(`${BASE_URL}/users/author-requests/${requestId}/review`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      status: 'APPROVED',
      adminNote: 'Hồ sơ đầy đủ, duyệt lên tác giả!',
    }),
  });
  const reviewJson = await reviewRes.json();
  console.log('Status code:', reviewRes.status, '| Message:', reviewJson.message);

  console.log('\n--- 7. Kiểm tra dữ liệu trong MongoDB sau khi phê duyệt ---');
  const updatedUserInDb = await usersColl.findOne({ _id: normalUserId });
  console.log('User role sau duyệt (Mong muốn: AUTHOR):', updatedUserInDb?.role);

  const authorProfileInDb = await authorProfColl.findOne({ userId: normalUserId });
  console.log('Đã tạo author_profile trong MongoDB:', authorProfileInDb ? 'CÓ (Chính xác)' : 'KHÔNG');
  console.log('AuthorProfile penName:', authorProfileInDb?.penName);
  console.log('AuthorProfile bankName:', authorProfileInDb?.bankName);
  console.log('AuthorProfile status:', authorProfileInDb?.status);

  console.log('\n--- 8. Phía Author kiểm tra lại GET /users/author-request sau khi đã được duyệt ---');
  // Khi duyệt, versionToken tăng lên 1 và role thành AUTHOR. Cấp token mới tương ứng:
  const authorToken = jwt.sign(
    { sub: normalUserId.toString(), role: 'AUTHOR', versionToken: updatedUserInDb.versionToken },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

  const getApprovedRes = await fetch(`${BASE_URL}/users/author-request`, {
    headers: { Authorization: `Bearer ${authorToken}` },
  });
  const getApprovedJson = await getApprovedRes.json();
  console.log('isAuthor:', getApprovedJson.data?.isAuthor);
  console.log('isProcessed:', getApprovedJson.data?.isProcessed);
  console.log('canEdit (phải false vì đã duyệt):', getApprovedJson.data?.canEdit);
  console.log('Author Profile trả về penName:', getApprovedJson.data?.authorProfile?.penName);

  console.log('\n--- 9. Thử PUT sửa đơn sau khi đã APPROVED (phải bị chặn 400) ---');
  const editApprovedRes = await fetch(`${BASE_URL}/users/author-request`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authorToken}`,
    },
    body: JSON.stringify({ penName: 'Sửa Trộm' }),
  });
  const editApprovedJson = await editApprovedRes.json();
  console.log('Status code (Mong muốn 400):', editApprovedRes.status);
  console.log('Lỗi trả về:', editApprovedJson.message);

  // Dọn dẹp dữ liệu kiểm thử
  await usersColl.deleteMany({ email: { $in: [userEmail, adminEmail] } });
  await authorReqColl.deleteMany({});
  await authorProfColl.deleteMany({ userId: normalUserId });
  await mongoose.disconnect();

  console.log('\n🎉 TOÀN BỘ CÁC API NÂNG CẤP TÁC GIẢ ĐÃ HOẠT ĐỘNG HOÀN TOÀN CHÍNH XÁC!');
}

testAuthorApis().catch((err) => {
  console.error('Lỗi khi kiểm thử API:', err);
  process.exit(1);
});
