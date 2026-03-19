import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiTwitter, FiMapPin, FiPhone, FiMail, FiClock } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { to: '/', label: 'Trang chủ' },
    { to: '/services', label: 'Dịch vụ' },
    { to: '/barbers', label: 'Thợ cắt tóc' },
    { to: '/booking', label: 'Đặt lịch' },
  ];

  const socialLinks = [
    { icon: FiFacebook, href: '#', label: 'Facebook' },
    { icon: FiInstagram, href: '#', label: 'Instagram' },
    { icon: FiTwitter, href: '#', label: 'Twitter' },
  ];

  return (
    <footer className="bg-dark-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <div className="flex flex-col">
                <span className="text-2xl font-display font-bold text-white">Barberly</span>
                <div className="h-0.5 w-16 bg-primary-500 mt-1"></div>
              </div>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Hệ thống đặt lịch cắt tóc chuyên nghiệp. Chúng tôi mang đến cho bạn trải nghiệm
              dịch vụ tốt nhất với đội ngũ thợ cắt tóc lành nghề.
            </p>
            {/* Social Links */}
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 border border-gray-700 flex items-center justify-center hover:border-primary-500 hover:text-primary-500 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-display font-semibold text-lg mb-1">Liên kết nhanh</h3>
            <div className="h-0.5 w-12 bg-primary-500 mb-4"></div>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-gray-400 hover:text-primary-500 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-display font-semibold text-lg mb-1">Liên hệ</h3>
            <div className="h-0.5 w-12 bg-primary-500 mb-4"></div>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <FiMapPin className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-400">
                  54 Nguyễn Lương Bằng, Liên Chiểu, Đà Nẵng
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <FiPhone className="w-5 h-5 text-primary-500 flex-shrink-0" />
                <a
                  href="tel:0901234567"
                  className="text-sm text-gray-400 hover:text-primary-500 transition-colors"
                >
                  0901 234 567
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <FiMail className="w-5 h-5 text-primary-500 flex-shrink-0" />
                <a
                  href="mailto:info@barberly.com"
                  className="text-sm text-gray-400 hover:text-primary-500 transition-colors"
                >
                  info@barberly.com
                </a>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="text-white font-display font-semibold text-lg mb-1">Giờ mở cửa</h3>
            <div className="h-0.5 w-12 bg-primary-500 mb-4"></div>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <FiClock className="w-5 h-5 text-primary-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-gray-400">Thu 2 - Thu 6</p>
                  <p className="text-white">09:00 - 20:00</p>
                </div>
              </li>
              <li className="flex items-center space-x-3">
                <FiClock className="w-5 h-5 text-primary-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-gray-400">Thứ 7 - Chủ nhật</p>
                  <p className="text-white">10:00 - 18:00</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-500">
              &copy; {currentYear} Barberly. Tất cả quyền được bảo lưu.
            </p>
            <div className="flex space-x-6">
              <Link to="#" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">
                Chính sách bảo mật
              </Link>
              <Link to="#" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">
                Điều khoản sử dụng
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
