# Kiểm chứng 3.6.0

- 41 unit tests đạt; tích hợp video, bộ chọn định dạng thực với fixture, restart/cloud và hợp đồng HTTP đều đạt.
- Trình duyệt: intro lần đầu tự đóng, xem lại, Bỏ qua, Vào không gian làm việc, Escape và khôi phục tương tác; nhập danh sách vẫn hoạt động, không có lỗi console trong thao tác thử.
- Kiểm tra giao diện ở 390 px và 1366 px; không thấy tràn ngang ở màn hình nhỏ. CSS có nhánh giảm chuyển động theo hệ điều hành; chưa đổi cài đặt hệ điều hành để thử trực tiếp nhánh này.
- Windows portable: chạy bộ Node đi kèm, version 3.6.0, cloud=false, maxWorkers=3, đủ công cụ; logo SVG, CSS và module intro trả HTTP 200/MIME đúng.
- Kiểm thử dùng dữ liệu mẫu, không xác nhận lại Douyin/Sheets thực hoặc nhập trực tiếp vào Premiere.
