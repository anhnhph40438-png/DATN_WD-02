const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Shop = require('../models/Shop');
const Service = require('../models/Service');
const Barber = require('../models/Barber');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const Transaction = require('../models/Transaction');
const Promotion = require('../models/Promotion');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/haircut';

// ============================================================
// DATA TIẾNG VIỆT CÓ Ý NGHĨA
// ============================================================

const shopData = {
  name: 'Haircut - Tiệm cắt tóc nam',
  address: 'Đường Trịnh Văn Bô',
  phone: '0236 3846 999',
  email: 'contact@haircut.vn',
  description:
    'Haircut là tiệm cắt tóc nam chuyên nghiệp tại Đà Nẵng. Với đội ngũ thợ lành nghề, không gian hiện đại và phong cách phục vụ tận tâm, chúng tôi cam kết mang đến cho bạn trải nghiệm cắt tóc tốt nhất.',
  openingHours: {
    monday: { open: '08:00', close: '20:00', isClosed: false },
    tuesday: { open: '08:00', close: '20:00', isClosed: false },
    wednesday: { open: '08:00', close: '20:00', isClosed: false },
    thursday: { open: '08:00', close: '20:00', isClosed: false },
    friday: { open: '08:00', close: '20:00', isClosed: false },
    saturday: { open: '08:00', close: '21:00', isClosed: false },
    sunday: { open: '09:00', close: '17:00', isClosed: false }
  }
};

const adminData = {
  name: 'Nguyễn Quản Trị',
  email: 'admin@haircut.vn',
  phone: '0901000001',
  password: 'admin123',
  role: 'admin'
};

const servicesData = [
  {
    name: 'Cắt tóc nam cơ bản',
    description:
      'Cắt tóc nam theo yêu cầu, bao gồm tư vấn kiểu tóc phù hợp khuôn mặt. Thợ sẽ cắt, tỉa và tạo form chuẩn.',
    price: 50000,
    duration: 30,
    category: 'haircut'
  },
  {
    name: 'Cắt tóc Fade',
    description:
      'Cắt tóc kiểu Fade chuyên nghiệp (Low Fade, Mid Fade, High Fade). Đường nét sắc sảo, chuyển màu mượt mà.',
    price: 70000,
    duration: 40,
    category: 'haircut'
  },
  {
    name: 'Cắt tóc Undercut',
    description:
      'Kiểu tóc Undercut hiện đại, phù hợp với nhiều phong cách. Bao gồm tư vấn và tạo kiểu sau cắt.',
    price: 70000,
    duration: 40,
    category: 'haircut'
  },
  {
    name: 'Cạo râu truyền thống',
    description:
      'Cạo râu bằng dao cạo truyền thống kết hợp khăn nóng. Mang lại cảm giác sạch sẽ, thư giãn.',
    price: 30000,
    duration: 20,
    category: 'shave'
  },
  {
    name: 'Gội đầu massage',
    description:
      'Gội đầu kết hợp massage đầu vai cổ bằng tinh dầu thiên nhiên. Giúp thư giãn và giảm căng thẳng.',
    price: 40000,
    duration: 25,
    category: 'other'
  },
  {
    name: 'Uốn tóc nam',
    description:
      'Uốn tóc tạo độ phồng tự nhiên hoặc xoăn theo yêu cầu. Sử dụng thuốc uốn chất lượng, không gây hại tóc.',
    price: 200000,
    duration: 90,
    category: 'styling'
  },
  {
    name: 'Nhuộm tóc nam',
    description:
      'Nhuộm tóc với nhiều tông màu thời trang. Sử dụng thuốc nhuộm chính hãng, bảo vệ da đầu.',
    price: 180000,
    duration: 75,
    category: 'styling'
  },
  {
    name: 'Combo Cắt + Gội + Massage',
    description:
      'Gói combo tiết kiệm bao gồm cắt tóc theo yêu cầu, gội đầu sạch sẽ và massage đầu vai cổ thư giãn.',
    price: 80000,
    duration: 50,
    category: 'combo'
  },
  {
    name: 'Combo VIP',
    description:
      'Gói dịch vụ cao cấp: Cắt tóc + Gội đầu + Cạo râu + Massage đầu vai cổ + Đắp mặt nạ dưỡng da.',
    price: 150000,
    duration: 75,
    category: 'combo'
  },
  {
    name: 'Wax tạo kiểu tóc',
    description:
      'Tạo kiểu tóc bằng sáp (wax/pomade) chuyên dụng. Giữ nếp cả ngày dài, dễ dàng gội sạch.',
    price: 20000,
    duration: 10,
    category: 'styling'
  }
];

const barbersData = [
  {
    user: {
      name: 'Trần Minh Đức',
      email: 'duc.tran@haircut.vn',
      phone: '0901000010',
      password: 'barber123',
      role: 'barber'
    },
    profile: {
      bio: 'Thợ cắt tóc với 7 năm kinh nghiệm. Chuyên về các kiểu tóc Fade, Undercut và tạo kiểu hiện đại. Từng học tập và làm việc tại Sài Gòn trước khi về Đà Nẵng.',
      skills: ['Fade', 'Undercut', 'Tạo kiểu', 'Nhuộm tóc', 'Uốn tóc'],
      workingHours: {
        monday: { start: '08:00', end: '18:00', isOff: false },
        tuesday: { start: '08:00', end: '18:00', isOff: false },
        wednesday: { start: '08:00', end: '18:00', isOff: false },
        thursday: { start: '08:00', end: '18:00', isOff: false },
        friday: { start: '08:00', end: '18:00', isOff: false },
        saturday: { start: '08:00', end: '20:00', isOff: false },
        sunday: { start: '09:00', end: '17:00', isOff: false }
      }
    }
  },
  {
    user: {
      name: 'Lê Văn Hoàng',
      email: 'hoang.le@haircut.vn',
      phone: '0901000020',
      password: 'barber123',
      role: 'barber'
    },
    profile: {
      bio: '10 năm trong nghề, chuyên về cạo râu truyền thống và các kiểu tóc cổ điển. Phong cách phục vụ tỉ mỉ, cẩn thận từng chi tiết.',
      skills: ['Cạo râu', 'Kiểu tóc cổ điển', 'Pompadour', 'Side Part', 'Massage'],
      workingHours: {
        monday: { start: '10:00', end: '20:00', isOff: false },
        tuesday: { start: '10:00', end: '20:00', isOff: false },
        wednesday: { start: '00:00', end: '00:00', isOff: true },
        thursday: { start: '10:00', end: '20:00', isOff: false },
        friday: { start: '10:00', end: '20:00', isOff: false },
        saturday: { start: '09:00', end: '21:00', isOff: false },
        sunday: { start: '09:00', end: '17:00', isOff: false }
      }
    }
  },
  {
    user: {
      name: 'Phạm Quốc Bảo',
      email: 'bao.pham@haircut.vn',
      phone: '0901000030',
      password: 'barber123',
      role: 'barber'
    },
    profile: {
      bio: 'Thợ trẻ năng động với 4 năm kinh nghiệm. Luôn cập nhật xu hướng tóc mới nhất từ Hàn Quốc và Nhật Bản. Đam mê sáng tạo kiểu tóc độc đáo.',
      skills: ['Korean Style', 'Japanese Style', 'Nhuộm tóc', 'Highlight', 'Fade'],
      workingHours: {
        monday: { start: '08:00', end: '18:00', isOff: false },
        tuesday: { start: '08:00', end: '18:00', isOff: false },
        wednesday: { start: '08:00', end: '18:00', isOff: false },
        thursday: { start: '08:00', end: '18:00', isOff: false },
        friday: { start: '08:00', end: '18:00', isOff: false },
        saturday: { start: '09:00', end: '20:00', isOff: false },
        sunday: { start: '09:00', end: '17:00', isOff: false }
      }
    }
  }
];

const customersData = [
  {
    name: 'Nguyễn Thanh Tùng',
    email: 'tung.nguyen@gmail.com',
    phone: '0912345001',
    password: 'customer123',
    role: 'customer'
  },
  {
    name: 'Võ Hoàng Nam',
    email: 'nam.vo@gmail.com',
    phone: '0912345002',
    password: 'customer123',
    role: 'customer'
  },
  {
    name: 'Đặng Quang Huy',
    email: 'huy.dang@gmail.com',
    phone: '0912345003',
    password: 'customer123',
    role: 'customer'
  },
  {
    name: 'Bùi Đức Anh',
    email: 'anh.bui@gmail.com',
    phone: '0912345004',
    password: 'customer123',
    role: 'customer'
  },
  {
    name: 'Hồ Sỹ Phong',
    email: 'phong.ho@gmail.com',
    phone: '0912345005',
    password: 'customer123',
    role: 'customer'
  }
];

const promotionsData = [
  {
    code: 'CHAOBAN',
    description: 'Giảm 15% cho khách hàng mới đăng ký lần đầu. Áp dụng cho tất cả dịch vụ.',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 50000,
    maxDiscount: 50000,
    usageLimit: 200,
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  },
  {
    code: 'COMBOGIAM20',
    description: 'Giảm 20% khi sử dụng dịch vụ Combo. Tối đa giảm 80.000đ.',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 80000,
    maxDiscount: 80000,
    usageLimit: 100,
    startDate: new Date(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  },
  {
    code: 'GIAM30K',
    description: 'Giảm trực tiếp 30.000đ cho đơn từ 100.000đ trở lên.',
    discountType: 'fixed',
    discountValue: 30000,
    minOrderAmount: 100000,
    usageLimit: 50,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  {
    code: 'THANHVIEN',
    description: 'Giảm 10% dành cho khách hàng thân thiết (từ lần thứ 3 trở đi).',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscount: 100000,
    usageLimit: 500,
    startDate: new Date(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  }
];

// Các review mẫu có ý nghĩa
const reviewComments = [
  { rating: 5, comment: 'Cắt rất đẹp, đúng ý mình. Thợ tư vấn nhiệt tình, sẽ quay lại!' },
  { rating: 5, comment: 'Kiểu tóc Fade rất chuẩn, đường nét sắc sảo. Rất hài lòng!' },
  { rating: 4, comment: 'Tóc cắt đẹp, không gian thoải mái. Chỉ hơi chờ đợi lâu.' },
  { rating: 5, comment: 'Dịch vụ combo rất đáng tiền. Massage thư giãn, gội đầu sạch sẽ.' },
  { rating: 4, comment: 'Thợ cắt khéo tay, kiểu tóc hợp khuôn mặt. Giá cả hợp lý.' },
  { rating: 5, comment: 'Lần nào cắt cũng ưng ý. Anh Đức tay nghề cao, rất chuyên nghiệp.' },
  { rating: 3, comment: 'Cắt cũng được nhưng hơi khác so với ảnh mẫu mình đưa. Cần cải thiện thêm.' },
  { rating: 5, comment: 'Nhuộm tóc đều màu, lên tông rất đẹp. Thuốc nhuộm không rát da đầu.' },
  { rating: 4, comment: 'Kiểu tóc Hàn Quốc rất hợp trend. Bạn bè khen nhiều.' },
  { rating: 5, comment: 'Cạo râu bằng dao cạo truyền thống rất sướng, sạch sẽ và thư giãn.' },
  { rating: 4, comment: 'Uốn tóc tự nhiên, không bị xơ. Giữ nếp tốt sau 2 tuần.' },
  { rating: 5, comment: 'Combo VIP rất xứng đáng. Từ cắt tóc đến massage đều tuyệt vời.' },
  { rating: 4, comment: 'Nhân viên thân thiện, phục vụ chu đáo. Tóc cắt sạch sẽ, gọn gàng.' },
  { rating: 5, comment: 'Đã đến đây 5 lần rồi, lần nào cũng hài lòng. Giới thiệu cho bạn bè.' },
  { rating: 3, comment: 'Lần này cắt hơi ngắn so với yêu cầu. Nhưng thái độ phục vụ tốt.' }
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Tạo ngày ngẫu nhiên trong khoảng n ngày trước
const randomPastDate = (daysBack) => {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d;
};

// Tạo ngày tương lai trong khoảng n ngày tới
const randomFutureDate = (daysAhead) => {
  const d = new Date();
  d.setDate(d.getDate() + 1 + Math.floor(Math.random() * daysAhead));
  return d;
};

const randomTime = (startHour, endHour) => {
  const hour = startHour + Math.floor(Math.random() * (endHour - startHour));
  const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

const addMinutes = (time, mins) => {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + mins;
  return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
};

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ============================================================
// SEED DATABASE
// ============================================================
const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Đã kết nối MongoDB');

    // Xóa toàn bộ dữ liệu cũ
    console.log('\nĐang xóa dữ liệu cũ...');
    await Promise.all([
      User.deleteMany({}),
      Shop.deleteMany({}),
      Service.deleteMany({}),
      Barber.deleteMany({}),
      Appointment.deleteMany({}),
      Review.deleteMany({}),
      Transaction.deleteMany({}),
      Promotion.deleteMany({})
    ]);
    console.log('Đã xóa toàn bộ dữ liệu cũ.');

    // 1. Tạo Shop
    console.log('\n--- Tạo tiệm ---');
    const shop = await Shop.create(shopData);
    console.log(`Tiệm: ${shop.name}`);

    // 2. Tạo Admin
    console.log('\n--- Tạo tài khoản admin ---');
    const admin = await User.create(adminData);
    console.log(`Admin: ${admin.email}`);

    // 3. Tạo dịch vụ
    console.log('\n--- Tạo dịch vụ ---');
    const services = [];
    for (const s of servicesData) {
      const service = await Service.create(s);
      services.push(service);
      console.log(`  + ${service.name} - ${service.price.toLocaleString('vi-VN')}đ`);
    }

    // 4. Tạo Barber
    console.log('\n--- Tạo thợ cắt tóc ---');
    const barbers = [];
    for (const b of barbersData) {
      const user = await User.create(b.user);
      const barber = await Barber.create({
        user: user._id,
        shop: shop._id,
        ...b.profile
      });
      barbers.push({ user, barber });
      console.log(`  + ${user.name} (${user.email})`);
    }

    // 5. Tạo khách hàng
    console.log('\n--- Tạo khách hàng ---');
    const customers = [];
    for (const c of customersData) {
      const customer = await User.create(c);
      customers.push(customer);
      console.log(`  + ${customer.name} (${customer.email})`);
    }

    // 6. Tạo khuyến mãi
    console.log('\n--- Tạo mã khuyến mãi ---');
    // Gắn applicableServices cho combo
    const comboServices = services.filter((s) => s.category === 'combo');
    promotionsData[1].applicableServices = comboServices.map((s) => s._id);

    for (const p of promotionsData) {
      const promo = await Promotion.create(p);
      console.log(`  + ${promo.code}: ${promo.description}`);
    }

    // 7. Tạo lịch hẹn đã hoàn thành (trong quá khứ) - để có dữ liệu thống kê
    console.log('\n--- Tạo lịch hẹn đã hoàn thành ---');
    const completedAppointments = [];

    for (let i = 0; i < 25; i++) {
      const customer = pickRandom(customers);
      const { user: barberUser, barber } = pickRandom(barbers);
      const selectedServices = [pickRandom(services)];
      // 30% cơ hội chọn thêm 1 dịch vụ
      if (Math.random() < 0.3) {
        const extra = pickRandom(services.filter((s) => s._id !== selectedServices[0]._id));
        selectedServices.push(extra);
      }

      const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
      const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
      const date = randomPastDate(60);
      const startTime = randomTime(8, 17);
      const endTime = addMinutes(startTime, totalDuration);

      const isPaid = Math.random() < 0.6; // 60% thanh toán online

      const appointment = await Appointment.create({
        customer: customer._id,
        barber: barber._id,
        shop: shop._id,
        services: selectedServices.map((s) => s._id),
        date,
        startTime,
        endTime,
        totalPrice,
        totalDuration,
        status: 'completed',
        paymentStatus: isPaid ? 'paid' : 'unpaid',
        paymentMethod: isPaid ? 'vnpay' : 'cash'
      });

      completedAppointments.push({ appointment, customer, barber, barberUser });

      // Tạo transaction cho appointment đã thanh toán online
      if (isPaid) {
        await Transaction.create({
          appointment: appointment._id,
          customer: customer._id,
          amount: totalPrice,
          vnpTxnRef: `${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}${i}`,
          vnpTransactionNo: `VNP${14000000 + i}`,
          vnpResponseCode: '00',
          vnpBankCode: pickRandom(['NCB', 'VCB', 'TCB', 'MB', 'ACB']),
          status: 'success',
          paidAt: date
        });
      }

      const serviceNames = selectedServices.map((s) => s.name).join(', ');
      console.log(
        `  + ${customer.name} → ${barberUser.name} | ${serviceNames} | ${date.toLocaleDateString('vi-VN')} ${startTime}`
      );
    }

    // 8. Tạo review cho các lịch hẹn đã hoàn thành
    console.log('\n--- Tạo đánh giá ---');
    const reviewedAppointments = new Set();
    const reviewedPairs = new Set(); // tránh trùng appointment

    for (let i = 0; i < Math.min(15, completedAppointments.length); i++) {
      const { appointment, customer, barber } = completedAppointments[i];

      if (reviewedAppointments.has(appointment._id.toString())) continue;
      reviewedAppointments.add(appointment._id.toString());

      const { rating, comment } = reviewComments[i % reviewComments.length];

      await Review.create({
        customer: customer._id,
        barber: barber._id,
        appointment: appointment._id,
        rating,
        comment
      });

      console.log(`  + ${customer.name} → ★${rating}: "${comment.substring(0, 50)}..."`);
    }

    // 9. Tạo lịch hẹn đang chờ xác nhận (tương lai)
    console.log('\n--- Tạo lịch hẹn sắp tới ---');
    for (let i = 0; i < 5; i++) {
      const customer = customers[i % customers.length];
      const { user: barberUser, barber } = barbers[i % barbers.length];
      const service = services[i % services.length];
      const date = randomFutureDate(7);
      const startTime = randomTime(9, 16);
      const endTime = addMinutes(startTime, service.duration);

      const statuses = ['pending', 'confirmed', 'pending', 'confirmed', 'pending'];
      await Appointment.create({
        customer: customer._id,
        barber: barber._id,
        shop: shop._id,
        services: [service._id],
        date,
        startTime,
        endTime,
        totalPrice: service.price,
        totalDuration: service.duration,
        status: statuses[i]
      });

      console.log(
        `  + ${customer.name} → ${barberUser.name} | ${service.name} | ${date.toLocaleDateString('vi-VN')} ${startTime} [${statuses[i]}]`
      );
    }

    // 10. Tạo 2 lịch hẹn đã hủy
    console.log('\n--- Tạo lịch hẹn đã hủy ---');
    const cancelReasons = [
      'Bận việc đột xuất, xin hẹn lại lần sau',
      'Thay đổi kế hoạch, sẽ đặt lịch lại'
    ];
    for (let i = 0; i < 2; i++) {
      const customer = customers[i + 3];
      const { user: barberUser, barber } = barbers[i];
      const service = pickRandom(services);
      const date = randomPastDate(14);
      const startTime = randomTime(9, 16);
      const endTime = addMinutes(startTime, service.duration);

      await Appointment.create({
        customer: customer._id,
        barber: barber._id,
        shop: shop._id,
        services: [service._id],
        date,
        startTime,
        endTime,
        totalPrice: service.price,
        totalDuration: service.duration,
        status: 'cancelled',
        cancelReason: cancelReasons[i]
      });

      console.log(`  + ${customer.name}: "${cancelReasons[i]}"`);
    }

    // ============================================================
    // KẾT QUẢ
    // ============================================================
    const totalAppointments = await Appointment.countDocuments();
    const totalReviews = await Review.countDocuments();
    const totalTransactions = await Transaction.countDocuments();

    console.log('\n========================================');
    console.log('  SEED HOÀN TẤT!');
    console.log('========================================');
    console.log(`  Tiệm:          1`);
    console.log(`  Dịch vụ:        ${services.length}`);
    console.log(`  Thợ cắt tóc:    ${barbers.length}`);
    console.log(`  Khách hàng:      ${customers.length}`);
    console.log(`  Lịch hẹn:        ${totalAppointments}`);
    console.log(`  Đánh giá:        ${totalReviews}`);
    console.log(`  Giao dịch:       ${totalTransactions}`);
    console.log(`  Khuyến mãi:      ${promotionsData.length}`);
    console.log('========================================');
    console.log('\n  Tài khoản đăng nhập:');
    console.log('  ─────────────────────────────────────');
    console.log(`  Admin:      admin@haircut.vn / admin123`);
    console.log(`  Thợ cắt:    duc.tran@haircut.vn / barber123`);
    console.log(`  Thợ cắt:    hoang.le@haircut.vn / barber123`);
    console.log(`  Thợ cắt:    bao.pham@haircut.vn / barber123`);
    console.log(`  Khách hàng: tung.nguyen@gmail.com / customer123`);
    console.log('  ─────────────────────────────────────');
    console.log('\n  Mã khuyến mãi:');
    console.log('  ─────────────────────────────────────');
    console.log(`  CHAOBAN      - Giảm 15% cho khách mới`);
    console.log(`  COMBOGIAM20  - Giảm 20% cho dịch vụ Combo`);
    console.log(`  GIAM30K      - Giảm 30.000đ cho đơn từ 100.000đ`);
    console.log(`  THANHVIEN    - Giảm 10% cho khách thân thiết`);
    console.log('========================================\n');
  } catch (error) {
    console.error('Lỗi khi seed dữ liệu:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Đã đóng kết nối MongoDB');
    process.exit(0);
  }
};

seedDatabase();
