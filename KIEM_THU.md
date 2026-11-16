# Kết quả kiểm thử

## Bản 2.0 — 16/11/2026

8/8 kiểm thử dữ liệu/cấu hình đạt. Kiểm thử tích hợp dùng yt-dlp thật tải HTTP cục bộ đạt: SHA-256 đầu ra giống nguồn, giữ kích thước và SAR (clip dọc 360 × 640 và clip 2560 × 1440 có tiếng), tên nguồn không tiền tố, trùng tên tách thư mục không ghi đè, thử lại, dừng/tiếp tục, CSV và bảo vệ API. Artifacts: dataDir/integration-1794799468110. Chưa kiểm thử toàn bộ các nền tảng với chế độ mới.

## Lịch sử bản 1.0 — 16/11/2026 (không mô tả chế độ hiện tại)

- 9/9 kiểm thử dữ liệu và cấu hình đạt (`node --test tests/core.test.mjs`).
- Quy trình tích hợp dùng yt-dlp và FFmpeg thực, tải các video tạo riêng qua HTTP cục bộ, xử lý 2 video đồng thời, xuất MP4 1920 × 1080.
- Đã kiểm tra clip dọc không âm thanh và clip ngang có âm thanh, bao gồm nguồn pixel không vuông; đầu ra pixel vuông, đúng kích thước và giữ luồng audio nếu có.
- Đã đọc pixel khung đầu ra để xác nhận chữ trắng ở góc trái dưới và vùng đen ở bên trái phía trên; đã xem trực tiếp ảnh có credit tiếng Việt, dấu phần trăm và dấu nháy.
- Đã kiểm tra nguồn lỗi → thử lại thành công; file đã hoàn thành không bị ghi đè.
- Đã kiểm tra dừng → tiếp tục, tạo preview, xuất CSV và chặn API khi thiếu token hoặc origin khác.
- Đã kiểm tra giao diện: dán bảng có STT, nhận diện link trùng, thiếu credit, chặn bắt đầu khi danh sách còn lỗi; ảnh xem thử hiển thị thành công.
- Đã chạy Start-BTV.ps1 để khởi động tiến trình nền và kiểm tra giao diện báo bộ xử lý sẵn sàng.

Chưa kiểm thử dữ liệu Google Sheets của người dùng, đăng nhập Google, các nền tảng mạng xã hội thực tế hoặc lô 50–60 clip. Không suy rộng kết quả tải HTTP cục bộ thành cam kết tải được mọi nền tảng.

Bản chạy trên máy hiện tại dùng yt-dlp 2026.10.26 và FFmpeg N-128946-g33a5956d8b-20261115. Binaries ở đường dẫn binDir trong runtime-config.json. Các file thử độc lập nằm trong dataDir/integration-1794797549596; không nằm trong lô làm việc của người dùng.
