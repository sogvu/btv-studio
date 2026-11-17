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

## V3.2

Nút Xóa hết chỉ xóa danh sách, giữ file đã tải. Nút Chỉ tải lại video lỗi chỉ chọn trạng thái lỗi. Khi sửa danh sách và lưu cùng thư mục, dòng có ID/link/nguồn không đổi giữ trạng thái; dòng sửa nội dung trở về chờ. Lưu trạng thái có cơ chế thử lại khi Windows khóa file.

## Lưu bản web vào thư mục trên máy

Trên Chrome/Edge máy tính, bấm Chọn thư mục trên máy, cấp quyền ghi rồi bắt đầu. Khi bắt đầu mà chưa chọn, trình duyệt sẽ hỏi thư mục. Video hoàn thành tự chuyển từ máy chủ vào thư mục qua luồng dữ liệu, không cần nạp toàn bộ vào RAM trình duyệt. Giữ tab mở, chọn lại sau khi tải lại trang. File có sẵn không bị ghi đè; file trùng tên chuyển vào thư mục con. Máy chủ vẫn cần lưu tạm để xử lý và chuyển file. Bản Windows tiếp tục lưu trực tiếp theo đường dẫn của máy.

## Windows 3.3 — Nội Dung Tổng Hợp

Giải nén và mở Mo Noi Dung Tong Hop.cmd. Địa chỉ cục bộ mặc định http://127.0.0.1:43210; dữ liệu tại %LOCALAPPDATA%\NoiDungTongHop. Nhập đường dẫn thư mục lưu trong tool để lưu trực tiếp vào máy. Bản cũ ở cổng 43189 và dữ liệu cũ vẫn được giữ. Cấu hình runtime-config.json/BTV_DATA chỉ dùng khi cần đường dẫn riêng.

## V3.4 — luôn MP4 cho Premiere (thay chế độ nguyên bản)

Tải nguồn tốt nhất rồi xuất .mp4: H.264 High, yuv420p, CFR, AAC 48 kHz nếu có tiếng. CRF18/preset veryfast; không upscale, không thêm chữ. HDR tone-map về SDR; kích thước lẻ thêm tối đa một pixel ở mép. Không còn bảo đảm giống từng byte nguồn vì chuyển mã. Chậm hơn, đặc biệt Render Free; nên dùng 1 lượt trên web.

File đã tải bằng bản cũ vẫn giữ nguyên. Nhấn Xuất lại danh sách thành MP4 Premiere để tạo lô mới. Chưa kiểm thử trực tiếp mọi phiên bản Premiere; kiểm tra codec, frame timestamp và giải mã file bằng FFmpeg.

## 3.4.2 — Tự bỏ qua chuyển mã khi đã đạt chuẩn

Kiểm tra MP4, H.264 8-bit, AAC 48 kHz (nếu có tiếng) và quét toàn bộ nhịp khung hình. File đạt chuẩn được sao chép nguyên byte, không nén lại. File chưa đạt chuẩn hoặc không xác minh được sẽ dùng bước chuyển mã của 3.4. Danh sách hoàn thành ghi Giữ nguyên file / Đã chuẩn hóa. Vẫn cần tải video nguồn để kiểm tra.

## 3.4.3 — Tối ưu tốc độ

Bỏ giới hạn 4 MiB/s trên web. Tải đồng thời 4 đoạn trên web, 8 đoạn trên Windows đối với nguồn HLS/DASH hỗ trợ. Nếu thiếu đoạn, báo lỗi để thử lại, không bỏ qua đoạn. Windows chia tối đa 8 luồng CPU/video theo số video đồng thời; Render giữ 1 luồng để hạn chế quá tải. Vẫn kiểm tra CFR đầy đủ, giữ chất lượng nguồn và MP4 Premiere. Dòng Đang tải hiển thị tốc độ và thời gian dự kiến khi nguồn cung cấp. Tốc độ phụ thuộc nguồn, mạng và CPU.

## 3.4.4 — Chọn MP4 từ nguồn trước khi tải

Tool ưu tiên bản MP4 H.264 và tiếng AAC nguồn cung cấp, ưu tiên AAC 48 kHz nếu có. Hình/tiếng tách riêng chỉ ghép luồng, không mã hóa lại. Sau khi tải, file đúng chuẩn CFR được giữ nguyên. Chỉ chuyển mã khi nguồn không có bản phù hợp hoặc file thực tế chưa đạt chuẩn. Bản MP4 có thể có độ phân giải thấp hơn bản AV1/VP9 tốt nhất trên một số nguồn. Cache nguồn cũ được tách để không dùng lại nhầm WebM. Video đã hoàn thành không bị tải lại.

## 3.4.5 — Sửa mất kết nối và giảm quá tải Render

Tự lấy phiên mới khi máy chủ khởi động lại, không tải lại trang và không mất nội dung đang nhập. Các yêu cầu cập nhật tiến độ không chạy chồng lên nhau; lỗi mạng có thời gian chờ và tự thử lại. Chỉ tự gửi lại thao tác khi máy chủ đã xác nhận từ chối vì phiên cũ; không tự gửi lại POST khi mất mạng để tránh chạy hai lần. Bản web chỉ xử lý 1 video/lượt, tối đa 2 đoạn tải song song và dùng cấu hình mã hóa ít bộ đệm RAM; Windows vẫn 1–3 video/lượt. Khi máy chủ bị gián đoạn, các dòng dừng cần nhấn Tiếp tục. Không bảo đảm Render Free đủ RAM cho mọi video độ phân giải cao; file tạm có thể mất khi Render thay máy.
