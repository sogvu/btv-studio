# Chạy trên Render Free

[Triển khai trên Render](https://render.com/deploy?repo=https://github.com/sogvu/btv-studio)

Blueprint render.yaml chọn plan free, Docker và tự sinh BTV_PASSWORD. Không chọn nâng cấp trả phí.

Đăng nhập website với tên btv; mật khẩu xem trong Environment của dịch vụ Render, biến BTV_PASSWORD. Bản web dành cho một người/nhóm dùng chung tài khoản; mọi người được cấp mật khẩu cùng truy cập một hàng đợi. Không chia sẻ mật khẩu công khai.

Giới hạn bản web: 5 link/lô, 1 lượt tải đồng thời, giới hạn bộ tải 200 MB mỗi file nguồn. Hỗ trợ các link YouTube, TikTok, Instagram, Facebook, Vimeo và Dailymotion được yt-dlp đọc được. Nguồn yêu cầu đăng nhập có thể thất bại.

File được lưu tạm trên máy chủ, tải bằng nút Tải video. Dữ liệu công việc tự dọn sau khoảng 2 giờ khi tool rảnh và có thể mất sớm hơn khi Render ngủ hoặc khởi động lại. Không dùng làm nơi lưu trữ. Bản Windows trên Releases tiếp tục hoạt động như trước.

Docker image cần được build và thử trên Render; kiểm thử trên Windows không xác minh được khả năng tải từng nền tảng từ IP máy chủ Render.
