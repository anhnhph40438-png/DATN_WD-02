import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiScissors,
  FiCalendar,
  FiSettings,
  FiBarChart2,
  FiCreditCard,
  FiTag,
  FiClock,
  FiUser,
  FiLogOut,
  FiX,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ role, isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Admin navigation links
  const adminLinks = [
    { to: '/admin', icon: FiHome, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: FiUsers, label: 'Người dùng' },
    { to: '/admin/barbers', icon: FiScissors, label: 'Thợ cắt tóc' },
    { to: '/admin/services', icon: FiTag, label: 'Dịch vụ' },
    { to: '/admin/appointments', icon: FiCalendar, label: 'Lịch hẹn' },
    { to: '/admin/promotions', icon: FiTag, label: 'Khuyến mãi' },
    { to: '/admin/transactions', icon: FiCreditCard, label: 'Giao dịch' },
    { to: '/admin/statistics', icon: FiBarChart2, label: 'Thống kê' },
    { to: '/admin/settings', icon: FiSettings, label: 'Cài đặt' },
  ];

  // Barber navigation links
  const barberLinks = [
    { to: '/barber', icon: FiHome, label: 'Dashboard', end: true },
    { to: '/barber/appointments', icon: FiCalendar, label: 'Lịch hẹn' },
    { to: '/barber/statistics', icon: FiBarChart2, label: 'Thống kê' },
    { to: '/barber/profile', icon: FiUser, label: 'Hồ sơ' },
  ];

  const links = role === 'admin' ? adminLinks : barberLinks;
  const roleLabel = role === 'admin' ? 'Quản trị viên' : 'Thợ cắt tóc';

  const NavItem = ({ to, icon: Icon, label, end }) => (
    <NavLink
      to={to}
      end={end}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 transition-colors relative ${
          isActive
            ? 'text-white bg-dark-900 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary-500'
            : 'text-gray-400 hover:text-white hover:bg-dark-900'
        }`
      }
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="font-medium">{label}</span>
    </NavLink>
  );

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-dark-950 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-dark-900">
            <div className="flex items-center space-x-3">
              <div className="flex flex-col">
                <span className="text-xl font-display font-bold text-white">Haircut</span>
                <div className="h-0.5 w-12 bg-primary-500 mt-0.5"></div>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              className="lg:hidden p-2 text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Role Badge */}
          <div className="px-4 py-3">
            <div className="inline-flex items-center px-3 py-1 border border-primary-500 text-xs font-medium text-primary-500">
              {roleLabel}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
            {links.map((link) => (
              <NavItem
                key={link.to}
                to={link.to}
                icon={link.icon}
                label={link.label}
                end={link.end}
              />
            ))}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-dark-900">
            <div className="flex items-center space-x-3 mb-4 px-2">
              <div className="w-10 h-10 bg-primary-500 flex items-center justify-center text-white font-medium border border-primary-600">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email || 'user@email.com'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-2.5 text-gray-400 hover:text-white hover:bg-red-900 border border-transparent hover:border-red-800 transition-colors"
            >
              <FiLogOut className="w-5 h-5" />
              <span className="font-medium">Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
