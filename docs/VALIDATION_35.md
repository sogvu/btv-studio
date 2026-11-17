# Kiểm chứng phiên bản 3.5.0

- `npm test`: 41/41 đạt. Có kiểm tra ranh giới module/import và kiểm tra mới cho phục hồi state, Sheets trả về HTML đăng nhập, tiến trình báo lỗi/timeout.
- `tests/integration.mjs`: tải HTTP fixture, song song, nguyên byte MP4 chuẩn có/không tiếng, WebM/VFR → H.264/AAC/CFR, kích thước/tỉ lệ, tên/trùng tên, retry không ghi đè, dừng/tiếp tục, preview, CSV và bảo vệ API đều đạt.
- `tests/formats-integration.mjs`: yt-dlp thật với metadata fixture, 6 tình huống chọn MP4/AAC48/ghép luồng/fallback giữ tiếng đều đạt.
- `tests/reconnect-integration.mjs`: restart server thật, đổi token, tự phục hồi phiên, giữ danh sách và giới hạn cloud đều đạt.
- `tests/http-contract-integration.mjs`: các module browser HTTP 200/MIME đúng, host localhost, chặn host/origin/token sai, tải output/header/byte, từ chối output cũ, CSV, cookies và stop đều đạt.
- Trình duyệt local: nhập/sửa/thêm/xóa dòng, chuyển tab Sheets, mở cài đặt, chọn 3 worker, xóa danh sách; restart giữ tab và tự khôi phục bảng, hiển thị completed/error. Không có lỗi console ở các thao tác đã thử. Không xác minh quyền ghi thư mục native của trình duyệt trong đợt này; streaming/collision được kiểm tra bằng bộ mock hiện có.

Kiểm thử chỉ dùng dữ liệu mẫu và thư mục tạm. Không dùng tài khoản/cookies riêng, không xác nhận tải Douyin hoặc Google Sheets thực và không xác nhận nhập trực tiếp vào Premiere. Kiểm tra ZIP được ghi sau khi đóng gói; commit Render live và health được đối chiếu ở bước bàn giao.

- Gói Windows 3.5.0: mở bằng Start-BTV.ps1 -NoBrowser với bộ Node đi kèm; API báo version 3.5.0, cloud=false, maxWorkers=3, đủ yt-dlp/FFmpeg/ffprobe, module studio trả HTTP 200.
