import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { FiMenu, FiBell, FiSearch } from 'react-icons/fi';
import Sidebar from '../components/common/Sidebar';
import { useAuth } from '../context/AuthContext';

const BarberLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex bg-dark-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        role={user?.role || 'barber'}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Top header */}
        <header className="bg-white border-b border-dark-100 sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-md text-dark-900/60 hover:bg-dark-50"
              onClick={() => setSidebarOpen(true)}
            >
              <FiMenu className="w-6 h-6" />
            </button>

            {/* Search bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-900/40 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-full pl-10 pr-4 py-2 border border-dark-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-dark-900/60 hover:bg-dark-50 rounded-full">
                <FiBell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User info */}
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0)?.toUpperCase() || 'B'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-dark-900">{user?.name || 'Barber'}</p>
                  <p className="text-xs text-dark-900/60">{user?.role === 'admin' ? 'Quản trị viên' : 'Thợ cắt tóc'}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default BarberLayout;
