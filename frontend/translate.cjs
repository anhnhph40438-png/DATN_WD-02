const fs = require('fs');
const path = require('path');

const directoryToSearch = path.join(__dirname, 'src');

const dictionary = {
  // Navigation & Headers
  "Trang chu": "Trang chủ",
  "Dich vu": "Dịch vụ",
  "Dat lich": "Đặt lịch",
  "Lich hen cua toi": "Lịch hẹn của tôi",
  "Ho so": "Hồ sơ",
  "Dang xuat": "Đăng xuất",
  "Dang nhap": "Đăng nhập",
  "Dang ky": "Đăng ký",
  "Quen mat khau": "Quên mật khẩu",
  "Nguoi dung": "Người dùng",
  "Khuyen mai": "Khuyến mãi",
  "Giao dich": "Giao dịch",
  "Thong ke": "Thống kê",
  "Cai dat": "Cài đặt",
  "Quan tri vien": "Quản trị viên",
  "Tho cat toc": "Thợ cắt tóc",
  "Lich lam viec": "Lịch làm việc",
  "Lich hen": "Lịch hẹn",
  "Danh gia": "Đánh giá",
  "Thanh toan": "Thanh toán",

  // Actions
  "Them moi": "Thêm mới",
  "Chinh sua": "Chỉnh sửa",
  "Chi tiet": "Chi tiết",
  "Thong tin": "Thông hiện",
  "Thong tin": "Thông tin",
  "Tat ca": "Tất cả",
  "Trang thai": "Trạng thái",
  "Ngay tao": "Ngày tạo",
  "Thao tac": "Thao tác",
  "Xac nhan": "Xác nhận",
  "Tro ve": "Trở về",
  "Hoan thanh": "Hoàn thành",
  "Huy": "Hủy",
  "Luu": "Lưu",
  "Xoa": "Xóa",
  "Sua": "Sửa",

  // Statuses
  "Cho xac nhan": "Chờ xác nhận",
  "Da huy": "Đã hủy",
  "Da xac nhan": "Đã xác nhận",
  "Dang thuc hien": "Đang thực hiện",

  // Dashboard & Statistics
  "Lich hen hom nay": "Lịch hẹn hôm nay",
  "Lich hen tuan nay": "Lịch hẹn tuần này",
  "Khach thang nay": "Khách tháng này",
  "Doanh thu thang": "Doanh thu tháng",
  "Khach hang": "Khách hàng",
  "Cap nhat thanh cong": "Cập nhật thành công",
  "Danh gia gan day": "Đánh giá gần đây",
  "Chua co danh gia nao": "Chưa có đánh giá nào",
  "Tong quan hieu suat": "Tổng quan hiệu suất",
  "Ban da phuc vu": "Bạn đã phục vụ",
  "khach hang trong thang nay": "khách hàng trong tháng này",
  "Xem chi tiet": "Xem chi tiết",
  "Chao mung quay tro lai": "Chào mừng quay trở lại",

  // New additions
  "Cap nhat thong tin thanh cong!": "Cập nhật thông tin thành công!",
  "Doi mat khau thanh cong!": "Đổi mật khẩu thành công!",
  "Ap dung ma khuyen mai thanh cong!": "Áp dụng mã khuyến mãi thành công!",
  "Đặt lịch thanh cong! Vui long thanh toan tai cua hang.": "Đặt lịch thành công! Vui lòng thanh toán tại cửa hàng.",
  "Da ap dung ma khuyen mai thanh cong!": "Đã áp dụng mã khuyến mãi thành công!",
  "Thanh toán thanh cong!": "Thanh toán thành công!",
  "Thanh toán that bai": "Thanh toán thất bại",
  "Đã hủy lich hen thanh cong": "Đã hủy lịch hẹn thành công",
  "Đặt lịch thanh cong!": "Đặt lịch thành công!",
  "Mật khẩu da duoc dat lai thanh cong!": "Mật khẩu đã được đặt lại thành công!",
  "Đăng ký thanh cong!": "Đăng ký thành công!",
  "Lưu lich lam viec thanh cong!": "Lưu lịch làm việc thành công!",
  "Đăng nhập thanh cong!": "Đăng nhập thành công!",
  "Cap nhat ho so barber thanh cong!": "Cập nhật hồ sơ barber thành công!",
  "Quan ly thong tin ca nhan va cai dat tai khoan": "Quản lý thông tin cá nhân và cài đặt tài khoản",
  "Tao tai khoan": "Tạo tài khoản",
  "Da co tai khoan?": "Đã có tài khoản?",
  "Chua co tai khoan?": "Chưa có tài khoản?",
  "Khong the doi mat khau": "Không thể đổi mật khẩu",
  "Doi mat khau": "Đổi mật khẩu",
  "Nhap mat khau hien tai": "Nhập mật khẩu hiện tại",
  "Nhap mat khau moi (it nhat 6 ky tu)": "Nhập mật khẩu mới (ít nhất 6 ký tự)",
  "Xác nhận mat khau moi": "Xác nhận mật khẩu mới",
  "Nhap lai mat khau moi": "Nhập lại mật khẩu mới",
  "Yeu cau mat khau:": "Yêu cầu mật khẩu:",
  "Xác nhận mat khau la bat buoc": "Xác nhận mật khẩu là bắt buộc",
  "Khong the dat lai mat khau. Vui lòng thử lại.": "Không thể đặt lại mật khẩu. Vui lòng thử lại.",
  "Lien ket dat lai mat khau da het han hoac khong hop le. Vui long": "Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng",
  "Dat lai mat khau thanh cong!": "Đặt lại mật khẩu thành công!",
  "Dat lai mat khau": "Đặt lại mật khẩu",
  "Nhap mat khau moi cua ban": "Nhập mật khẩu mới của bạn",
  "Nho mat khau?": "Nhớ mật khẩu?",
  "Xác nhận mat khau": "Xác nhận mật khẩu",
  "Nhap lai mat khau": "Nhập lại mật khẩu",
  "Nhap mat khau (it nhat 6 ky tu)": "Nhập mật khẩu (ít nhất 6 ký tự)",
  "Nhap mat khau": "Nhập mật khẩu",
  "Email khoi phuc mat khau da duoc gui!": "Email khôi phục mật khẩu đã được gửi!",
  "Nhap email de lay lai mat khau": "Nhập email để lấy lại mật khẩu",
  "Chung toi da gui huong dan khoi phuc mat khau den": "Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến",
  "Vui long dang nhap de dat lich": "Vui lòng đăng nhập để đặt lịch",
  "Quay lai dang nhap": "Quay lại đăng nhập",
  "trang dang nhap trong giay lat...": "trang đăng nhập trong giây lát...",
  "Ghi nho dang nhap": "Ghi nhớ đăng nhập",
  "Đăng ký that bai. Vui lòng thử lại.": "Đăng ký thất bại. Vui lòng thử lại.",
  "Đăng nhập that bai. Vui lòng thử lại.": "Đăng nhập thất bại. Vui lòng thử lại.",
  "truc tuyen": "trực tuyến",
  "khong hop le": "không hợp lệ",

  "Khong the tai du lieu": "Không thể tải dữ liệu",
  "Khong the cap nhat trang thai": "Không thể cập nhật trạng thái",
  "Da xac nhan lich hen": "Đã xác nhận lịch hẹn",
  "Da bat dau dich vu": "Đã bắt đầu dịch vụ",
  "Da hoan thanh dich vu": "Đã hoàn thành dịch vụ",
  "vui long thu lai sau": "vui lòng thử lại sau",
  "Vui long thu lai": "Vui lòng thử lại",

  // HomePage Long texts
  "Dat lich cat toc online": "Đặt lịch cắt tóc online",
  "He thong dat lich cat toc truc tuyen hang dau. Chon barber yeu thich, dat lich nhanh chong chi voi vai thao tac.": "Hệ thống đặt lịch cắt tóc trực tuyến hàng đầu. Chọn barber yêu thích, đặt lịch nhanh chóng chỉ với vài thao tác.",
  "Tai sao chon Barberly?": "Tại sao chọn Barberly?",
  "Chung toi mang den trai nghiem dat lich cat toc tot nhat voi nhieu tien ich huu ich.": "Chúng tôi mang đến trải nghiệm đặt lịch cắt tóc tốt nhất với nhiều tiện ích hữu ích.",
  "Dat lich de dang": "Đặt lịch dễ dàng",
  "Dat lich chi voi vai click, chon thoi gian phu hop nhat.": "Đặt lịch chỉ với vài click, chọn thời gian phù hợp nhất.",
  "Chon barber yeu thich": "Chọn barber yêu thích",
  "Lua chon barber phu hop voi phong cach cua ban.": "Lựa chọn barber phù hợp với phong cách của bạn.",
  "Thanh toan tien loi": "Thanh toán tiện lợi",
  "Ho tro nhieu hinh thuc thanh toan: tien mat, VNPay.": "Hỗ trợ nhiều hình thức thanh toán: tiền mặt, VNPay.",
  "Danh gia & nhan xet": "Đánh giá & nhận xét",
  "Doc review tu khach hang khac de chon dich vu tot nhat.": "Đọc review từ khách hàng khác để chọn dịch vụ tốt nhất.",
  "Dich vu noi bat": "Dịch vụ nổi bật",
  "Kham pha cac dich vu cat toc chuyen nghiep cua chung toi.": "Khám phá các dịch vụ cắt tóc chuyên nghiệp của chúng tôi.",
  "Xem tat ca": "Xem tất cả",
  "Chua co dich vu nao.": "Chưa có dịch vụ nào.",
  "Xem tat ca dich vu": "Xem tất cả dịch vụ",
  "Doi ngu Barbers": "Đội ngũ Barbers",
  "Gap go nhung barber tai nang va chuyen nghiep.": "Gặp gỡ những barber tài năng và chuyên nghiệp.",
  "Chua co barber nao.": "Chưa có barber nào.",
  "Xem tat ca barbers": "Xem tất cả barbers",
  "San sang dat lich?": "Sẵn sàng đặt lịch?",
  "Tham gia cung hang nghin khach hang hai long. Dat lich ngay de trai nghiem dich vu tot nhat.": "Tham gia cùng hàng nghìn khách hàng hài lòng. Đặt lịch ngay để trải nghiệm dịch vụ tốt nhất.",
  "Dat lich ngay": "Đặt lịch ngay",
  "Xem dich vu": "Xem dịch vụ",

  // Very specific long error logs & toasts
  "Chua co lich hen hoan thanh": "Chưa có lịch hẹn hoàn thành",
  "Chua co anh portfolio nao.": "Chưa có ảnh portfolio nào.",
  "Chua co ngay nghi nao": "Chưa có ngày nghỉ nào",
  "Chua co lich hen nao duoc dat": "Chưa có lịch hẹn nào được đặt",
  "Khong the tai danh sach dich vu": "Không thể tải danh sách dịch vụ",
  "Khong the cap nhat thong tin": "Không thể cập nhật thông tin",
  "Email khong the thay doi": "Email không thể thay đổi",
  "Khong the tai thong tin lich hen": "Không thể tải thông tin lịch hẹn",
  "Khong the tao lien ket thanh toan": "Không thể tạo liên kết thanh toán",
  "Khong the tai danh sach lich hen": "Không thể tải danh sách lịch hẹn",
  "Khong the huy lich hen": "Không thể hủy lịch hẹn",
  "Khong the gui danh gia": "Không thể gửi đánh giá",
  "Ban co chac chan muon huy lich hen nay khong? Hanh dong nay khong the hoan tac.": "Bạn có chắc chắn muốn hủy lịch hẹn này không? Hành động này không thể hoàn tác.",
  "Khong the dat lich. Vui lòng thử lại.": "Không thể đặt lịch. Vui lòng thử lại.",
  "Khong the tai danh sach barbers": "Không thể tải danh sách barbers",
  "Khong the tai thong tin barber": "Không thể tải thông tin barber",
  "Khong the tai thong ke": "Không thể tải thống kê",
  "Khong the tai lich lam viec": "Không thể tải lịch làm việc",
  "Khong the luu lich lam viec": "Không thể lưu lịch làm việc",
  "Khong the chon ngay trong qua khu": "Không thể chọn ngày trong quá khứ",
  "Khong the them ngay nghi": "Không thể thêm ngày nghỉ",
  "Khong the xoa ngay nghi": "Không thể xóa ngày nghỉ",
  "Khách hàng khong the dat lich vao ngay ban nghi": "Khách hàng không thể đặt lịch vào ngày bạn nghỉ",
  "Khong the tai thong tin ho so": "Không thể tải thông tin hồ sơ",
  "Khong the xoa anh": "Không thể xóa ảnh",
  "Khong the cap nhat ho so": "Không thể cập nhật hồ sơ",
  "Khong the gui email khoi phuc. Vui lòng thử lại.": "Không thể gửi email khôi phục. Vui lòng thử lại.",
  "Vui long nhap ten": "Vui lòng nhập tên",
  "Vui long dien day du thong tin": "Vui lòng điền đầy đủ thông tin",
  "Neu ban can ho tro, vui long lien he voi chung toi qua so dien thoai hotline hoac email.": "Nếu bạn cần hỗ trợ, vui lòng liên hệ với chúng tôi qua số điện thoại hotline hoặc email.",
  "Vui long nhap ma khuyen mai": "Vui lòng nhập mã khuyến mãi",
  "Vui long chon ngay": "Vui lòng chọn ngày",
  "Vui long thanh toan tai cua hang.": "Vui lòng thanh toán tại cửa hàng.",
  "Da het han cho thanh toan. Xin quy khach vui long thuc hien lai giao dich.": "Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.",

  "Tru tien thanh cong. Giao dịch bi nghi ngo (lien quan toi lua dao, giao dich bat thuong).": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
  "Giao dịch khong thanh cong do: The/Tai khoan cua khach hang chua dang ky dich vu InternetBanking tai ngan hang.": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.",
  "Giao dịch khong thanh cong do: Khách hàng xac thuc thong tin the/tai khoan khong dung qua 3 lan.": "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.",
  "Giao dịch khong thanh cong do: Da het han cho thanh toan. Xin quy khach vui long thuc hien lai giao dich.": "Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.",
  "Giao dịch khong thanh cong do: The/Tai khoan cua khach hang bi khoa.": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.",
  "Giao dịch khong thanh cong do: Quy khach nhap sai mat khau xac thuc giao dich (OTP).": "Giao dịch không thành công do: Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).",
  "Giao dịch khong thanh cong do: Khách hàng huy giao dich.": "Giao dịch không thành công do: Khách hàng hủy giao dịch.",
  "Giao dịch khong thanh cong do: Tai khoan cua quy khach khong du so du de thuc hien giao dich.": "Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.",
  "Giao dịch khong thanh cong do: Tai khoan cua Quy khach da vuot qua han muc giao dich trong ngay.": "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.",
  "Giao dịch khong thanh cong do: KH nhap sai mat khau thanh toan qua so lan quy dinh.": "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.",

  // Others
  "Khong hoat dong": "Không hoạt động",
  "Hoat dong": "Hoạt động",
  "phut": "phút",
  "Tong tien": "Tổng tiền",
  "Mat khau": "Mật khẩu",
  "So dien thoai": "Số điện thoại",
  "Dia chi": "Địa chỉ",
  "Hinh anh": "Hình ảnh",
  "Mo ta": "Mô tả",

  "Giao dịch khong thanh cong": "Giao dịch không thành công",
  "Tai khoan": "Tài khoản",
  "thanh cong": "thành công",
  "that bai": "thất bại",
  "Dang thuc hien": "Đang thực hiện",
  "Cho xac nhan": "Chờ xác nhận",

  // New additions from user request
  "Ho ten la bat buoc": "Họ tên là bắt buộc",
  "Email la bat buoc": "Email là bắt buộc",
  "Số điện thoại la bat buoc": "Số điện thoại là bắt buộc",
  "Mật khẩu la bat buoc": "Mật khẩu là bắt buộc",
  "Hoan tat thanh toan cho lich hen cua ban": "Hoàn tất thanh toán cho lịch hẹn của bạn",
  "Quan ly va theo doi cac lich hen cat toc cua ban": "Quản lý và theo dõi các lịch hẹn cắt tóc của bạn",
  "Chia se trai nghiem cua ban...": "Chia sẻ trải nghiệm của bạn...",
  "Lua chon barber phu hop voi phong cach cua ban.": "Lựa chọn barber phù hợp với phong cách của bạn.",
  "Xem thong ke hieu suat lam viec cua ban": "Xem thống kê hiệu suất làm việc của bạn",
  "Thiet lap lich lam viec hang tuan cua ban": "Thiết lập lịch làm việc hàng tuần của bạn",
  "Cac khung gio co the dat lich dua tren lich lam viec cua ban": "Các khung giờ có thể đặt lịch dựa trên lịch làm việc của bạn",
  "Quan ly thong tin ca nhan cua ban": "Quản lý thông tin cá nhân của bạn",
  "Mật khẩu cua ban da duoc cap nhat. Ban se duoc chuyen huong den": "Mật khẩu của bạn đã được cập nhật. Bạn sẽ được chuyển hướng đến",
  "Nhap ho ten cua ban": "Nhập họ tên của bạn",
  "Nhap email cua ban": "Nhập email của bạn",
  "Kiem tra email cua ban": "Kiểm tra email của bạn",
  "long kiem tra hop thu cua ban.": "lòng kiểm tra hộp thư của bạn.",
  "Dang xu ly...": "Đang xử lý...",
  "Co loi xay ra khi xu ly thanh toan": "Có lỗi xảy ra khi xử lý thanh toán",
  "Bat dau dich vu": "Bắt đầu dịch vụ",
  "Tu choi": "Từ chối"
};

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      const ext = path.extname(file);
      if (ext === '.jsx' || ext === '.js' || ext === '.html') {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(directoryToSearch);

let totalReplaced = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Sort keys by length descending to replace longer phrases first
  const keys = Object.keys(dictionary).sort((a, b) => b.length - a.length);

  keys.forEach(key => {
    // Only replace whole words or inside HTML text / quotes.
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    content = content.replace(regex, dictionary[key]);
  });

  // Because some text might be like `Vui long nhap gio lam viec cho $\{day.label\}`
  // Let's also do a fallback exact string replacement for any variables if not caught by word boundary.
  // Actually word boundary \b works well with Vui long.

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    totalReplaced++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Finished updating ${totalReplaced} files.`);
