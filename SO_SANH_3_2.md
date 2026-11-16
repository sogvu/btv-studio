# So sánh bản cài đặt người dùng với v3.1

Bản được cung cấp có hai tầng thư mục BTV-Studio-2.0-Windows và các bản sao lưu; so sánh mã đang dùng trong app/public, không lấy mã từ thư mục backup.

| Thành phần | Bản cung cấp | v3.1 | Kết quả v3.2 |
|---|---|---|---|
| Xóa hết danh sách | Có | Thiếu | Bổ sung, giữ file đã tải |
| Nút chỉ tải lại video lỗi | Có | Có vòng tự thử lại nhưng thiếu nút riêng | Bổ sung, bỏ qua pending/invalid/done |
| Lưu danh sách có giữ trạng thái dòng không đổi | Có, so sánh ID/link/nguồn và thư mục | Lưu lại tạo lô mới | Ghép logic giữ lô khi cùng thư mục và có dòng khớp |
| Lưu state khi Windows khóa file | File tạm riêng + thử rename lại | File tạm cố định | Ghép cơ chế bản cung cấp |
| Mở tool bằng bộ Node đi kèm | Có | Có | Giữ |
| Tải gốc, không chèn chữ/đổi khung | Có | Có | Giữ |
| 60 dòng web, 3 lượt tải | Không | Có | Giữ |
| Douyin + cookies riêng | Không | Có (thử nghiệm) | Giữ |
| Tự thử lại đến khi xong/Dừng | Không | Có | Giữ |
| Giao diện mới, mục Đã hoàn thành | Không | Có | Giữ |

Đã kiểm thử: sửa một dòng thành công không thay đổi clip thành công khác; ID/link/nguồn không đổi giữ trạng thái; đổi tên nguồn chuyển dòng đó về chờ; nút retry-only chạy dòng lỗi dù còn pending/invalid; không ghi đè clip thành công; dừng/tiếp tục và tự thử lại. Không chép danh sách, cấu hình máy hoặc thư mục backup vào repository.
