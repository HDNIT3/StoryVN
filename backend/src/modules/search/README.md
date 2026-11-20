# Thử nghiệm tìm kiếm tiếng Việt bằng embedding cục bộ

Module độc lập cho StoryVN, dùng Transformers.js + `Xenova/multilingual-e5-small`
(CPU, q8, mean pooling, L2, 384 chiều). Không gọi API inference trả phí.

## Phạm vi và mức độ cách ly

- Mặc định **tắt**. `SearchModule.forRoot()` không đăng ký controller, provider,
  model MongoDB hay timer nếu `SEMANTIC_SEARCH_ENABLED` không bằng `true`.
- Không sửa `StoriesService`, schema truyện, luồng kiểm duyệt, frontend hoặc API
  `/api/stories`. Thay đổi tích hợp chỉ là import module trong `AppModule`.
- Đọc bản chính thức `PUBLISHED` + `PUBLIC`, không đọc `revisions`.
- Chỉ ghi vào collection mới `story_search_embeddings`. Không migrate hoặc ghi
  vào collection nghiệp vụ cũ. Nội dung tên/giới thiệu không được lưu ở collection
  embedding; chỉ có storyId, profile, hash, vector và timestamps.
- Các bản ghi embedding của truyện đã ẩn/xóa được dọn trong lần quét đầy đủ tiếp
  theo. Mỗi response vẫn kiểm tra quyền hiển thị từ dữ liệu gốc trước và sau
  inference, kể cả khi chỉ mục chưa kịp đồng bộ.
- Thư viện mới làm tăng kích thước cài đặt. Khi bật module, CPU/RAM/I/O vẫn dùng
  chung máy chủ; đây không phải cam kết tuyệt đối không ảnh hưởng tài nguyên.

## Chạy thử

1. Cài dependencies backend (`npm install`), copy các biến trong
   `backend/.env.search.example` vào môi trường backend.
2. Đặt `SEMANTIC_SEARCH_ENABLED=true`. Lần đầu đặt thêm
   `SEARCH_ALLOW_MODEL_DOWNLOAD=true`; cần mạng để tải model công khai vào
   `.cache/semantic-search` (dự trù hàng trăm MB). Không cần API key.
3. Chạy `npm run build` rồi `npm run start:dev` như thông thường. Worker nằm trong
   output TypeScript `dist/modules/search/embedding.worker.js`, chạy bằng worker
   thread riêng và giới hạn một luồng inference CPU.
4. Sau bootstrap 3 giây module quét dữ liệu trong nền, không chặn API khởi động.
   Có thể theo dõi bằng tài khoản ADMIN qua `GET /api/admin/search/status` hoặc
   Swagger `/api/docs`. Không thay `.env` trong repository khi chỉ review code.
5. Khi tải xong và cache đã lưu bền vững, chuyển
   `SEARCH_ALLOW_MODEL_DOWNLOAD=false` rồi khởi động lại để chạy offline. Giữ thư
   mục cache qua mỗi lần deploy. Cờ này không tự tải lại nếu cache mất.
6. Thử `GET /api/search/suggest?q=nữ%20chính%20trọng%20sinh&limit=8`.

Không tự bật module hoặc chạy reindex vào database đang sử dụng thật chỉ để kiểm
thử. Nên dùng database phát triển trước, vì bật module sẽ tạo collection dẫn xuất.

## API mới

| Endpoint | Quyền | Hành vi |
| --- | --- | --- |
| `GET /api/search/suggest?q=...` | Công khai | Tối đa 8 truyện để hiển thị dropdown |
| `GET /api/search?q=...&limit=20` | Công khai | Tối đa 20 truyện; chưa phân trang |
| `GET /api/admin/search/status` | ADMIN | Tiến độ, số vector, trạng thái giới hạn/lỗi |
| `POST /api/admin/search/reindex` | ADMIN | HTTP 202; yêu cầu đồng bộ lại trong nền |

Query tùy chọn: `genreId`, `tagId` (ObjectId), `progressState`, `ageRating`.
`ageRating` là lọc nhãn bằng giá trị được chọn, không thay thế chính sách xác minh
tuổi người dùng. `q` tối đa 256 ký tự. Dưới 2 ký tự hoặc chỉ dấu câu trả mảng rỗng.

Response theo convention `{ success, message, data }`. `data` gồm `query`, `mode`
(`hybrid` hoặc `keyword`), `items`, `hasMore`. Mỗi item có `_id`, `title`, `slug`,
`coverUrl`, giới thiệu plain text tối đa 240 ký tự, `progressState`, `ageRating`,
`genres`, `tags`. Không trả vector, revision hoặc điểm số giả dạng phần trăm.
`hasMore` chỉ nói còn kết quả trong tập ứng viên đã xét, không phải tổng truyện.

Header cần gọi endpoint sau debounce 300 ms, hủy/bỏ qua response câu cũ, mở
dropdown dưới input. Gõ tiếp sẽ tìm lại bằng toàn bộ câu hiện tại. Khi Enter có
thể mở trang kết quả riêng; frontend hiện tại chưa được nối vào module mới.

## Đồng bộ và truy hồi

- Quét read-only mỗi 60 giây, có chống chồng tác vụ trong **một tiến trình**.
  Không gắn hook vào code xuất bản cũ. Truyện mới/metadata mới có thể mất đến một
  chu kỳ quét cộng thời gian tạo embedding để xuất hiện.
- Hash nội dung tính từ tên, giới thiệu plain text và tên thể loại/tag active.
  Đổi tên thể loại/tag sẽ tạo lại vector; thay view/rating/bút danh không tạo lại
  vector. Bút danh vẫn dùng cho nhánh từ khóa, cập nhật mỗi lần quét.
- Lưu và nạp lại vector theo `profile` + hash, không tính lại mọi truyện khi restart.
  Đổi template/model/pooling phải tăng profile và dựng lại vector tương ứng.
- Mỗi query giữ dấu tiếng Việt, prefix `query: `. Truyện prefix `passage: `.
  Văn bản đầu vào giới hạn 12.000 ký tự để kiểm soát bộ nhớ; tokenizer của E5 còn
  giới hạn 512 token nên phần giới thiệu dài có thể bị cắt.
- Mô hình chỉ được nạp trong worker khi cần. Cache tối đa 100 query embedding,
  TTL 5 phút; các query trùng chia sẻ cùng promise. Hàng đợi tối đa 8 job.
- Khi mô hình chưa sẵn sàng, lỗi hoặc vượt deadline query (mặc định 1.200 ms),
  request dùng keyword. Job inference đã gửi có thể tiếp tục và làm ấm cache.
  Worker không phản hồi 180 giây sẽ bị dừng; lượt sau có thể tạo worker mới.
- Nhánh keyword dùng tên, tag, thể loại, giới thiệu, bút danh; normalize tiếng Việt
  không dấu. Đây là weighted token overlap cho bản thử, **không phải BM25**.
- Vector được so sánh chính xác, kết hợp thứ hạng bằng RRF, ưu tiên tên trùng
  chính xác. Không áp ngưỡng độ phù hợp đã hiệu chuẩn: vector tìm láng giềng gần
  nhất nên vẫn có thể gợi ý truyện không liên quan. Cần đánh giá truy vấn thực tế.
- Tối đa 2.000 truyện mặc định (`SEARCH_MAX_STORIES`, giới hạn cấu hình 5.000),
  chọn theo `_id` tăng dần. `truncated=true` báo dữ liệu vượt giới hạn; không âm
  thầm coi đây là kết quả đầy đủ. Endpoint có thể dùng keyword title/description
  trực tiếp trong MongoDB khi corpus chưa nạp xong.

## Giới hạn trước production

Đây là pilot có thể tắt bằng cờ môi trường, không phải triển khai ANN/outbox/HA.
Chạy trên **một backend instance** khi thử. Quét định kỳ và queue không phải
durable job; restart sẽ quét và tiếp tục từ vector đã lưu. Vẫn cần benchmark RAM,
độ trễ và chất lượng, đặc biệt trên truy vấn phủ định và câu dài.

Để nâng lên production lớn: thay truy hồi chính xác bằng vector index/ANN,
thay keyword bằng full-text/BM25, thêm outbox/durable queue hoặc CDC, khóa đồng bộ
nhiều instance, cache dùng chung, pagination và monitoring. Không cần thay API
truyện cũ để thực hiện các bước này.

## Kiểm tra

- `npm test -- src/modules/search/search.spec.ts` (mock inference/database).
- `npm run build` (kiểm tra worker được biên dịch cùng backend).
- `npm test` (regression suite của backend).

Test tự động không tải model, không gọi mạng và không kết nối database thật.
