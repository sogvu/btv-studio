# Rà soát và kiểm chứng đợt tách module 3.5

## Điểm phát hiện ở 3.4.5
- server.mjs chứa cấu hình, ghi state, chạy tiến trình, tải, mã hóa, queue, preview, xác thực và API. Một sửa đổi có thể đụng nhiều trạng thái dùng chung.
- core.mjs gộp parser, settings, tên file và CSV; ui.js gộp bảng, điều phối và file/permission trình duyệt.
- Các chính sách formats/premiere/performance/retry/connection đã có module riêng và kiểm thử, cần giữ lại thay vì viết lại.
- Thư mục làm việc cũ trên máy chứa bản nguồn chưa khớp bản phát hành. Đợt này dựa trên commit 3.4.5 a2c699e của sogvu/btv-studio, không lấy bản cũ để ghi đè các tính năng mới.

## Thay đổi
Tách dịch vụ qua factory và callback, chỉ một application sở hữu state. server và ui thành điểm vào. core giữ re-export tương thích. Giữ endpoint, HTML/CSS, dữ liệu/cookie, chính sách MP4, tên file, giới hạn Windows/cloud và mã khôi phục phiên. AGENTS.md đặt ranh giới, điều kiện hoàn thành và kiểm tra trước phát hành.

## Tiêu chí hoàn thành
- Nhập CSV/TSV, giữ Unicode, Sheets URL/gid, thêm/sửa/xóa dòng và báo cáo còn hoạt động.
- Tải mẫu HTTP cục bộ, chọn MP4 trực tiếp, giữ byte file đã chuẩn, chuyển WebM/VFR, giữ tỉ lệ và tên file.
- Dừng/tiếp tục, chỉ retry lỗi, không ghi đè file hoàn thành, khôi phục phiên sau restart.
- Cloud vẫn yêu cầu đăng nhập, chặn origin/host/token sai, giữ 1 worker và allowlist.
- Frontend nạp đầy đủ module, không có lỗi console trong các thao tác đã thử.
- ZIP chạy được; GitHub/Render trỏ tới đúng mã đã kiểm tra.

Kết quả thực thi cuối cùng xem docs/VALIDATION_35.md. Tài liệu này không coi việc tách module là bảo đảm không có lỗi; các bước kiểm chứng vẫn bắt buộc.

## Giới hạn kiểm chứng
Google Sheets thực, Douyin/cookies tài khoản, tải Internet ở từng nền tảng và nhập trực tiếp vào Premiere cần nguồn/tài khoản/ứng dụng tương ứng. Các fixture không xác nhận các dịch vụ đó luôn truy cập được. Không chuyển giao hay công bố dữ liệu riêng để kiểm thử.
