# Nội Dung Tổng Hợp

Công cụ Windows tải hàng loạt video từ danh sách Google Sheets/CSV và đặt tên file theo nguồn.

## Tải bản chạy sẵn

Vào mục **Releases** của kho, tải `Noi-Dung-Tong-Hop-3.5.0-Windows.zip`, giải nén toàn bộ rồi nhấp đúp **Mo Noi Dung Tong Hop.cmd**. Bộ ZIP đi kèm Node.js, yt-dlp, FFmpeg và ffprobe. Cần Internet để tải video.

Giao diện chạy tại http://127.0.0.1:43210. Dữ liệu mặc định lưu tại `%LOCALAPPDATA%\NoiDungTongHop`.

## Chức năng

- Nhập hai cột Link video và Nguồn/Credit bằng cách dán từ Sheets hoặc nhập CSV UTF-8.
- Đọc Google Sheets truy cập được bằng link; bảng riêng tư dùng dán dữ liệu hoặc CSV.
- Ưu tiên chất lượng cao nhất trong các bản MP4 H.264/AAC nguồn cung cấp. Nếu không có, tải bản tốt nhất để chuẩn hóa.
- Xuất MP4 H.264 8-bit yuv420p, tốc độ khung hình cố định và âm thanh AAC 48 kHz. Không chèn credit; giữ kích thước và tỉ lệ nguồn (cạnh lẻ thêm tối đa 1 pixel viền).
- Tên file theo nguồn, không thêm số thứ tự. Video trùng tên được lưu trong thư mục con riêng.
- Hàng đợi, tiến độ, dừng/tiếp tục, thử lại dòng lỗi và bảng đối chiếu CSV.

File đầu ra luôn là MP4. Video đã đạt chuẩn Premiere được giữ nguyên từng byte; chỉ chuyển mã khi chưa đạt chuẩn hoặc không xác minh được. HDR được chuyển về SDR. Chữ hoặc watermark sẵn có trong nguồn vẫn được giữ. Không cam kết tải được các nội dung yêu cầu đăng nhập, CAPTCHA hoặc bị nền tảng hạn chế.

## Chạy từ mã nguồn

Yêu cầu Windows 64-bit và Node.js 22 trở lên.

1. Tải hoặc clone mã nguồn.
2. Chạy `Cai bo xu ly.ps1` để tải bộ xử lý vào `bin`.
3. Mở `Mo Noi Dung Tong Hop.cmd` hoặc chạy `npm start`.

Không cần `npm install`; ứng dụng dùng thư viện chuẩn Node.js.

Biến môi trường tùy chọn: `BTV_DATA` (thư mục dữ liệu), `BTV_BIN` (thư mục bộ xử lý), `BTV_PORT` (cổng). Có thể tạo `runtime-config.json` cục bộ với `dataDir` và `binDir`; file này được loại khỏi Git.

## Kiểm thử

```text
npm test
node tests/integration.mjs
```

Kiểm thử tích hợp cần các bộ xử lý trong `bin` hoặc đường dẫn cấu hình, dùng các cổng thử 43190 và 43191. Phép thử tải video mẫu qua HTTP cục bộ, kiểm tra H.264/AAC/CFR, giữ tỉ lệ, tên file, trùng tên và dừng/thử lại. Không sử dụng tài khoản hoặc video riêng tư.

Xem [hướng dẫn](HUONG_DAN.md) và [kết quả kiểm thử](KIEM_THU.md).

## Thành phần bên thứ ba

- [Node.js](https://nodejs.org/)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [FFmpeg](https://ffmpeg.org/) và [FFmpeg Builds](https://github.com/yt-dlp/FFmpeg-Builds)

Bản ZIP có thư mục `licenses` kèm giấy phép và liên kết nguồn của các thành phần đóng gói.

## Phiên bản 3

Giao diện mới; bản web hỗ trợ 60 video/lô và 1–3 video đồng thời. Douyin ở mức thử nghiệm: nhận link đầy đủ/rút gọn và file cookies Netscape chỉ thuộc Douyin. Kiểm tra thực tế 16/11/2026: link mẫu bị 403 và yêu cầu cookies mới; chưa xác minh tải Douyin thành công. Render Free có thể quá tải với 3 lượt, giảm còn 1–2 nếu cần.

## Cấu trúc và quy tắc phát triển

Phiên bản 3.5 tách backend và giao diện thành các module riêng, giữ tính năng của 3.4.5. Xem [AGENTS.md](AGENTS.md), [bảng trách nhiệm module](docs/ARCHITECTURE.md), [rà soát](docs/REFRACTOR_AUDIT.md) và [kiểm chứng 3.5](docs/VALIDATION_35.md). Điểm vào vẫn là `app/server.mjs` và `public/ui.js`; chạy không cần cài thêm dependency. Bộ kiểm thử dùng `npm test` và `npm run test:integration` với thư mục bộ xử lý được cấu hình theo hướng dẫn.
