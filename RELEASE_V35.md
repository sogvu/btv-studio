# Nội Dung Tổng Hợp 3.5.0 — Tách module và quy tắc phát triển

- Tách server thành cấu hình, state, runner, downloader, media processor, queue, output, preview, input, cookies, security và HTTP routes.
- Tách giao diện thành điều phối, bảng video và quản lý file; giữ kết nối và lưu file riêng.
- AGENTS.md quy định mục tiêu, phạm vi, ranh giới, tính năng phải giữ, tài nguyên, kiểm thử và phát hành.
- Có tài liệu kiến trúc, rà soát và kiểm chứng.
- Giữ hành vi 3.4.5: MP4 ưu tiên từ nguồn, không mã hóa lại file đã chuẩn, không chèn credit/đánh số đầu tên, giữ khung hình, retry/dừng/tiếp tục, Windows 1–3 lượt và web 1 lượt, cookies Douyin thử nghiệm.
- Không đổi API/mode/cache hoặc yêu cầu dependency runtime.
