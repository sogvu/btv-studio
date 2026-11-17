# Nội Dung Tổng Hợp 3.4.3 — Tối ưu tốc độ

- Bỏ giới hạn tải 4 MiB/s trên web.
- Tải đồng thời 4 đoạn HLS/DASH trên web, 8 đoạn trên Windows nếu nguồn hỗ trợ; lỗi thiếu đoạn sẽ thử lại.
- Windows tự chia CPU theo số video đang xử lý, tối đa 8 luồng/video. Render giữ 1 luồng để hạn chế quá tải.
- Hiển thị tốc độ tải và thời gian còn lại do yt-dlp cung cấp.
- Giữ nguyên chất lượng tốt nhất, kiểm tra CFR đầy đủ và MP4 Premiere; file đã chuẩn không nén lại.
- Tốc độ thực tế phụ thuộc nguồn, mạng và CPU, chưa có số đo tăng tốc trên video của bạn.
