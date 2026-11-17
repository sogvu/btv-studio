# Nội Dung Tổng Hợp 3.4.5 — Sửa mất kết nối

- Tự làm mới phiên sau khi máy chủ khởi động lại, giữ tab và nội dung đang nhập.
- Không gửi chồng yêu cầu cập nhật; có timeout và tự kết nối lại.
- Bản web giới hạn 1 video/lượt và 2 đoạn tải song song để giảm RAM.
- Mã hóa trên web giảm bộ đệm, giữ CRF18, kích thước nguồn và H.264/AAC/CFR.
- Windows vẫn hỗ trợ 1–3 video cùng lúc.
- Kiểm tra khởi động lại máy chủ, giữ danh sách và xác thực; 34 unit tests cùng kiểm thử tải video đã đạt.
- Render Free vẫn có giới hạn tài nguyên; nhấn Tiếp tục để chạy các dòng bị gián đoạn, file tạm có thể mất khi máy chủ được thay mới.
