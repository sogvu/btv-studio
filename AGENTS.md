# Quy tắc làm việc — Nội Dung Tổng Hợp

## Mục tiêu và phạm vi
Duy trì tool tải video Windows và web Render với hành vi đã chốt. Mỗi nhiệm vụ phải có mục tiêu cụ thể, module chịu trách nhiệm, phần bị ảnh hưởng và điều kiện hoàn thành. Chỉ sửa đúng phạm vi được giao; thay đổi ở module liên quan cần giải thích bằng luồng dữ liệu thực tế. Yêu cầu trực tiếp của người dùng được ưu tiên hơn tài liệu này.

## Bản chuẩn và điểm vào
- Mã trong kho GitHub sogvu/btv-studio là mã phát hành; đối chiếu phiên bản trước khi sửa bản sao cũ trên máy.
- app/server.mjs chỉ khởi động dịch vụ và gắn vòng đời; public/ui.js chỉ khởi động giao diện.
- Đọc docs/ARCHITECTURE.md để xác định module, docs/REFRACTOR_AUDIT.md để biết phạm vi kiểm chứng. Không đọc toàn bộ lịch sử nếu không cần.
- Không đưa nghiệp vụ trở lại hai file điểm vào. Không tạo một module utils hoặc manager chứa nhiều chức năng không liên quan.

## Các yêu cầu phải giữ
1. Ưu tiên tải MP4 H.264/AAC có sẵn tại nguồn, chọn chất lượng cao nhất trong nhóm phù hợp; không đặt trần 1080p. Nguồn thiếu bản phù hợp mới dùng bản tốt nhất để chuẩn hóa. Không tự đổi thứ tự chọn định dạng hoặc hạ độ phân giải.
2. Hình/tiếng phù hợp chỉ ghép luồng. MP4 đã đạt H.264 8-bit yuv420p, CFR và AAC 48 kHz (nếu có tiếng) giữ nguyên byte; chỉ chuyển mã khi thiếu điều kiện hoặc không xác minh được. Không suy ra CFR chỉ từ đuôi file hoặc hai chỉ số FPS.
3. Không chèn credit; giữ khung hình/tỉ lệ. Chỉ giữ ngoại lệ đã có: thêm tối đa 1 pixel cho cạnh lẻ khi cần mã hóa, HDR chuyển SDR trong bước chuẩn hóa.
4. Tên file theo nguồn, không thêm số thứ tự phía trước. Trùng tên dùng thư mục con, không ghi đè file đã có.
5. Giữ nhập Sheets/CSV/dán bảng, sửa/thêm/xóa dòng, xem trước và xuất báo cáo CSV.
6. Giữ dừng/tiếp tục, thử lại riêng dòng lỗi, tự thử lại có backoff và bỏ qua dòng đã hoàn thành khi tiếp tục cùng lô. Không biến việc khởi động lại dịch vụ thành tự tải lại toàn bộ.
7. Windows: 1–3 video cùng lúc, dữ liệu và đầu ra trên máy. Web: tối đa 60 video/lô, 1 video xử lý/lượt, giới hạn nguồn và dung lượng hiện tại; không tự tăng tài nguyên hoặc đổi gói Render.
8. Giữ luồng chọn thư mục, quyền lưu của trình duyệt, lưu tuần tự và chỉ báo đã lưu sau khi ghi xong. Không ghi đè file hoặc tự xóa video trên máy người dùng.
9. Giữ xác thực Basic trên cloud, host/origin và mã phiên; tự làm mới phiên không được bỏ qua xác thực. Không tự gửi lại POST khi lỗi mạng vì thao tác có thể đã được máy chủ nhận.
10. Cookies Douyin chỉ nhận định dạng và tên miền hiện có; không đưa cookies, mật khẩu, token, danh sách riêng hoặc video người dùng lên GitHub/ZIP/log. Douyin vẫn là tính năng thử nghiệm; không hứa mọi link tải được.

## Ranh giới module
- Module miền dữ liệu không được gọi HTTP, chạy yt-dlp/FFmpeg hoặc thao tác DOM.
- downloader chỉ lấy nguồn/cache/progress; không tự xuất MP4, đặt tên đầu ra hoặc điều khiển hàng đợi.
- video-processor điều phối một video; chính sách codec ở premiere, chính sách nguồn ở formats, tài nguyên ở performance.
- job-queue quản lý vòng chạy và dừng/backoff; không tự chọn codec hay ghi tên file.
- state-store sở hữu ghi trạng thái nguyên tử và báo cáo; không thay cấu trúc dữ liệu/mode/cache key nếu không có phương án tương thích.
- http-routes chỉ xác thực, đọc request và gọi ứng dụng; không nhúng lệnh tải/chuyển mã.
- public/queue-view chỉ hiển thị và phát callback chỉnh sửa; public/downloads quản lý file/permission; public/studio điều phối thao tác, không nhúng chính sách codec.
- Truyền phụ thuộc qua factory/callback. Không import server từ module khác, không tạo vòng import hoặc trạng thái toàn cục dùng chung giữa phiên làm việc.

## Quy trình mỗi thay đổi
1. Ghi rõ yêu cầu, bằng chứng lỗi nếu có, module sửa và tiêu chí đạt.
2. Kiểm tra git status; giữ nguyên thay đổi/dữ liệu của người dùng. Không xóa đệ quy thư mục tính toán nếu chưa xác minh đích.
3. Sửa phần nhỏ nhất giải quyết đủ yêu cầu. Tách việc đổi hành vi khỏi việc di chuyển mã; không thêm dependency runtime nếu thư viện chuẩn đã đủ.
4. Chạy kiểm tra phù hợp trong bảng ở ARCHITECTURE. Sửa lỗi kiểm thử trước khi phát hành; không giảm kiểm tra chất lượng để làm test xanh. Bổ sung test cho ranh giới/hành vi dễ hồi quy, tránh test chỉ chép lại triển khai.
5. Thay đổi module frontend phải được phục vụ bằng MIME JavaScript và thử trên trình duyệt; không chỉ chạy node --check.
6. Trước phát hành thay đổi dùng chung, kiểm thử cả Windows và chế độ cloud, đồng bộ phiên bản/link ZIP, kiểm tra gói không có dữ liệu cá nhân và băm SHA-256.
7. Chỉ push/phát hành/triển khai khi nhiệm vụ hiện tại hoặc ủy quyền còn hiệu lực cho phép. Không hỏi lại bước đã được ủy quyền. Chờ Render live đúng commit và health OK trước khi báo đã cập nhật.
8. Báo ngắn: thay đổi, kiểm tra đã chạy, đường dẫn/link sử dụng, giới hạn chưa xác minh. Không gọi mô phỏng/fixture là đã thử trực tiếp trên Premiere, Douyin hoặc Google Sheets thật.

## Tài nguyên và giới hạn
Node.js >=22, thư viện chuẩn; yt-dlp, FFmpeg, ffprobe lấy từ bộ bin cấu hình. BTV_DATA, BTV_BIN, BTV_PORT/PORT và runtime-config.json giữ ý nghĩa hiện tại. Không đọc hay in secret từ môi trường nếu không cần. Chọn lọc tài liệu và công cụ, không lặp kiểm tra đã đạt trừ khi có thay đổi hoặc vấn đề mới.
