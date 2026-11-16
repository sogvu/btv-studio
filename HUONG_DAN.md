# BTV Studio — phiên bản 2.0: tải video nguyên bản

Mở **Mo BTV Studio.cmd** hoặc http://127.0.0.1:43189 khi tool đã chạy. Sau khi cập nhật, nhấn F5.

## Chế độ tải
- Tên file lấy từ cột Nguồn/Credit, không thêm số thứ tự phía trước.
- Không chèn chữ. Chữ/watermark đã có sẵn trong nguồn vẫn giữ nguyên.
- Không thay đổi kích thước, tỉ lệ khung hình, tốc độ khung hình hoặc âm thanh của bản tải.
- Chọn chất lượng tốt nhất nguồn cho phép tải bằng yt-dlp (bv*+ba/b), không giới hạn 1080p.
- Không mã hóa lại. Nếu nguồn tách hình/tiếng, FFmpeg chỉ ghép luồng, không nén lại. Định dạng có thể là MP4, WebM hoặc MKV; không ép MP4.
- Nguyên bản là bản nền tảng cung cấp để tải, không phải file máy quay trước khi nền tảng nén.

## Sử dụng
1. Dán hai cột Link video và Nguồn/Credit từ Sheets, hoặc nhập CSV UTF-8. Có tiêu đề thì hỗ trợ cột STT; không tiêu đề thì hai cột phải theo thứ tự link, nguồn.
2. Tab Google Sheets đọc bảng truy cập được bằng link. Bảng riêng tư dùng dán dữ liệu hoặc CSV; chưa có đăng nhập Google.
3. Kiểm tra/sửa tên nguồn, chọn thư mục lưu và 1 hoặc 2 video đồng thời.
4. Bắt đầu xử lý. Lấy file qua Mở thư mục kết quả hoặc nút Tải video ở từng dòng.

Ví dụ nguồn Shells → Shells.mp4. Ký tự không hợp lệ trên Windows được đổi thành dấu gạch dưới, tên quá dài được rút ngắn. Clip trùng tên nằm trong thư mục con trung-ten/<mã riêng>/, giữ nguyên tên file và không ghi đè.

Mỗi lô có thư mục riêng, bang_nguon.csv ghi chính xác đường dẫn từng clip và thiet_lap.json ghi thiết lập.

## Video đã tải bằng bản cũ
Video cũ có credit/khung 16:9 vẫn ở thư mục lô cũ. Nút **Tải lại danh sách theo bản nguyên gốc** tạo lô mới và tải lại theo cấu hình mới, không dùng bộ nhớ tải cũ bị giới hạn 1080p. Đổi tên file cũ không thể gỡ chữ đã ghi vào hình.

Trong lô mới, Dừng và Tiếp tục / thử lại giữ các clip hoàn tất, xử lý các dòng còn lại. Sửa danh sách hoặc thư mục rồi chạy tạo lô mới.

## Dữ liệu và cài đặt
runtime-config.json chỉ định dataDir (dữ liệu) và binDir (bộ xử lý). Máy hiện tại dùng thư mục phụ do Windows hạn chế ghi trong Documents. Không xóa thư mục phụ khi đang dùng tool. File nguồn lưu tạm tại dataDir/work để thử lại.

Máy khác cần Node.js 22+ từ https://nodejs.org/ và chạy Cai bo xu ly.ps1. Điều chỉnh hoặc bỏ runtime-config.json của máy cũ. Không cần npm install.

## Giới hạn và kiểm thử
Link yêu cầu đăng nhập, CAPTCHA, bị gỡ hoặc giới hạn vùng có thể không tải được. Chưa nhập cookies, tải playlist/bài nhiều video, ghi ngược trạng thái lên Sheets. Chất lượng tối đa tùy nguồn cung cấp.

Tài liệu: https://github.com/yt-dlp/yt-dlp#format-selection

Chạy node --test tests/core.test.mjs và node tests/integration.mjs. Phép thử tích hợp tải qua HTTP cục bộ bằng yt-dlp, so sánh SHA-256 đầu ra với nguồn, kiểm tra giữ khung/SAR (cả 2560 × 1440), tên không tiền tố, trùng tên, dừng/tiếp tục và thử lại. Không suy rộng thành kiểm thử mọi nền tảng.

## V3

Chọn 1–3 video cùng lúc. Bản web nhận tối đa 60 video/lô. Hỗ trợ thử nghiệm link Douyin; mở thiết lập Douyin để nhập cookies.txt Netscape chỉ của Douyin nếu nguồn yêu cầu. Cookies được gửi/lưu trên máy xử lý riêng của bạn, không lên GitHub; có nút xóa. Douyin vẫn có thể chặn dù có cookies.

## V3.1 — tự thử lại

Mặc định tự thử lại video lỗi đến khi hoàn thành hoặc bạn bấm Dừng. Mỗi vòng chỉ tải các video còn lỗi, nghỉ 30 giây rồi tăng dần đến tối đa 5 phút giữa các vòng. Video thành công tự rời danh sách chờ và chuyển vào mục Đã hoàn thành, file không bị xóa. Có thể tắt lựa chọn tự thử lại trước khi bắt đầu để chỉ chạy một vòng. Nếu máy chủ Render ngủ/khởi động lại, mở tool và nhấn Tiếp tục; không cam kết tiếp tục khi máy chủ bị tắt. Video đã xóa/chặn có thể lỗi mãi dù lặp lại.
