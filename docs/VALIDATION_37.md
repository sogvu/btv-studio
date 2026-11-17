# Kiểm chứng 3.7.0

- 45/45 unit tests đạt. Bổ sung kiểm tra intro tự đóng/chỉ chạy một lần mỗi tab, phục hồi focus/inert, bỏ qua khi ảnh còn đang decode, Esc/chế độ giảm chuyển động và ảnh decode lỗi.
- Bộ tích hợp video, chọn định dạng với yt-dlp thật và metadata mẫu, restart/cloud và hợp đồng HTTP đều đạt.
- Trình duyệt: quan sát mảnh ghép chuyển động riêng và logo ghép hoàn chỉnh; intro tự đóng, không có phần tử data-replay-intro, không có lỗi console trong thao tác đã kiểm tra.
- Logo ở trạng thái hoàn chỉnh sử dụng lại tài nguyên gốc; không thay logo chính hay thuật toán tải.
- Kiểm thử dùng nguồn mẫu, không dùng tài khoản Douyin/Google riêng và không xác nhận nhập trực tiếp vào Premiere. Chính sách giảm chuyển động được kiểm tra bằng fixture; chưa đổi thiết lập hệ điều hành để thử trực tiếp.

- Windows portable khởi động đạt: version 3.7.0, cloud=false, maxWorkers=3, đủ công cụ; HTML có mảnh ghép, không có nút replay và CSS mới trả HTTP 200.
