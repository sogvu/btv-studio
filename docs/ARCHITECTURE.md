# Cấu trúc module — phiên bản 3.5

Đợt này tách mã 3.4.5, giữ API, chế độ đầu ra premiere-mp4-v1, cache source-mp4-first-v1, cấu trúc state và hành vi giao diện. Không thay codec, chất lượng, giới hạn hoặc chính sách retry.

## Luồng xử lý
server → config + application + http-routes. application ghép state-store, process-runner, media-tools, downloader, output-files, video-processor, job-queue, preview và cookies qua factory. HTTP không gọi trực tiếp yt-dlp/FFmpeg.

ui → studio → queue-view + downloads + connection. connection quản lý phiên HTTP; local-save chỉ ghi Response vào thư mục đã chọn. Mã backend không import frontend và frontend không import module Node.

## Bảng trách nhiệm và hợp đồng
| Module | Đầu vào / kết quả | Trách nhiệm và giới hạn |
|---|---|---|
| app/server.mjs | env → listener | Ghép module, listen, đóng dịch vụ, lịch dọn file tạm |
| app/config.mjs | root + env/config cục bộ → cấu hình | Đường dẫn, phiên bản, chế độ cloud, token; không bắt đầu tải |
| app/application.mjs | cấu hình → snapshot/saveRows/start/stop | Chủ sở hữu state hiện hành và lệnh ứng dụng; giữ dòng done khi lưu cùng lô |
| app/state-store.mjs | state ↔ state.json, CSV | Ghi nguyên tử, phục hồi trạng thái stopped; không chạy tác vụ |
| app/settings.mjs | settings → settings hợp lệ | Giới hạn worker và tùy chọn |
| app/list-parser.mjs | CSV/TSV hoặc rows → rows | Chuẩn hóa đầu vào, lỗi/ID/cảnh báo trùng |
| app/sheets-url.mjs | URL/gid → URL CSV | Kiểm tra miền và tab Sheets |
| app/list-import.mjs | yêu cầu Sheets → rows | Lấy CSV, timeout và thông báo; không đổi queue |
| app/filenames.mjs + csv-report.mjs | tên/rows → chuỗi | Tên an toàn và CSV chống công thức |
| app/core.mjs | re-export | Giữ tương thích import cũ; không thêm nghiệp vụ mới |
| app/process-runner.mjs | lệnh/args/options → Promise output | Chạy tiến trình, dòng tiến độ, timeout, hủy; không chọn codec |
| app/media-tools.mjs | BIN + runner → probe/toolsStatus | Định vị công cụ, đọc metadata, kiểm tra công cụ |
| app/downloader.mjs | row/work → đường dẫn nguồn | yt-dlp, cache, progress, cookies riêng cho lượt tải |
| app/formats.mjs | hằng chính sách → selector | Ưu tiên nguồn MP4 H.264/AAC trước fallback |
| app/performance.mjs | cloud/CPU/workers → cấu hình | Số đoạn tải và chia luồng CPU |
| app/premiere.mjs | metadata → quyết định/args | Điều kiện giữ file, kiểm tra CFR, cấu hình mã hóa và xác minh |
| app/video-processor.mjs | row → cập nhật row | Tải → kiểm tra → giữ nguyên/chuyển mã → lưu; báo lỗi và dọn partial |
| app/output-files.mjs | row/source → đích/copy | Tên file, chống ghi đè, Explorer và dọn file tạm cũ |
| app/job-queue.mjs + retry.mjs | rows + callback → vòng chạy | Đồng thời, dừng, backoff; không chọn định dạng |
| app/preview.mjs | row/demo → PNG | Xem trước độc lập, không thay trạng thái dòng tải |
| app/cookies.mjs + platforms.mjs | cookies/URL → kiểm tra/lưu | Allowlist và cookies Douyin; không hứa vượt chặn nền tảng |
| app/security.mjs | request/token → cho phép/từ chối | Basic cloud, host/origin và token; giữ thứ tự kiểm tra |
| app/http-routes.mjs + http-utils.mjs | request → response | API/HTML/assets, header và body; không chứa nghiệp vụ tải |
| public/ui.js | document → khởi động | Điểm vào mỏng |
| public/studio.mjs | thao tác/state API → điều phối UI | Nhập bảng, cài đặt, refresh không chồng, nút thao tác |
| public/queue-view.mjs | state + callback → DOM | Bảng, thống kê, trạng thái/khóa nút; không giữ bản state riêng |
| public/downloads.mjs | rows + session → lưu/tải file | Completed tray, chọn thư mục, tự lưu, tránh lưu đồng thời |
| public/connection.mjs | request → Response | Token mới sau restart; không lặp POST vì lỗi mạng |
| public/local-save.mjs | row/Response/directory → ghi xong | Stream, thư mục con khi trùng tên, không nhận thành công trước close |

Factory giữ trạng thái riêng theo application/trang. getState() lấy state mới nhất; không giữ tham chiếu state cũ sau saveRows. Không import server trong các module thư viện. API dùng cùng mã phiên từ config, không tạo token thứ hai trong module khác.

## Kiểm tra theo phạm vi
| Thay đổi | Kiểm tra bắt buộc phù hợp |
|---|---|
| Parser/settings/codec/retry/connection | npm test |
| State, tải, xử lý, file hoặc điều phối | npm test + node tests/integration.mjs |
| Chọn định dạng nguồn | node tests/formats-integration.mjs (yt-dlp thật, danh sách metadata fixture) |
| Phiên/xác thực/cloud/HTTP | node tests/reconnect-integration.mjs + kiểm tra API hợp đồng |
| UI/view/downloads | Thử trình duyệt nhập/sửa/xóa, tabs, cài đặt, completed; kiểm tra console và tất cả import có HTTP 200 |
| Phát hành dùng chung | Toàn bộ trên + khởi động ZIP Windows, kiểm tra cloud và Render live/health |

BTV_BIN cần trỏ tới thư mục có ffmpeg/ffprobe/yt-dlp. BTV_DATA trong kiểm thử phải là thư mục tạm riêng; không dùng dữ liệu thật. Tích hợp tải dùng cổng 43190/43191, thử restart dùng 43192; chạy tuần tự khi trùng cổng. Không có npm install cho runtime.

`tests/architecture.test.mjs` kiểm tra đường dẫn import, vòng phụ thuộc, không import điểm vào server, không kéo Node/backend vào frontend và giữ module chính sách độc lập với HTTP/filesystem/tiến trình.
