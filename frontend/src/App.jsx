import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Layouts
import { MainLayout, AdminLayout, BarberLayout } from './layouts';

// Common Components
import { ProtectedRoute } from './components/common';

// Auth Pages
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from './pages/auth';

// Customer Pages
import {
  HomePage,
  ServicesPage,
  BarbersPage,
  BarberDetailPage,
  BookingPage,
  MyAppointmentsPage,
  ProfilePage,
  PaymentPage,
  PaymentResultPage,
  RescheduleConfirmPage,
} from './pages/customer';

// Barber Pages
import {
  BarberDashboard,
  BarberAppointments,
  BarberStatistics,
  BarberProfile,
} from './pages/barber';

// Admin Pages
import {
  AdminDashboard,
  AdminUsers,
  AdminBarbers,
  AdminServices,
  AdminAppointments,
  AdminPromotions,
  AdminTransactions,
  AdminStatistics,
  AdminSettings,
  AdminWalkInBooking,
} from './pages/admin';

// Other Pages
import { NotFoundPage } from './pages';

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a1a',
              color: '#fff',
              borderRadius: '8px',
              fontSize: '14px',
              fontFamily: 'DM Sans, system-ui, sans-serif',
            },
            success: {
              style: {
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
              },
              iconTheme: {
                primary: '#e8a317',
                secondary: '#fff',
              },
            },
            error: {
              style: {
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        <Routes>
          {/* Public routes with MainLayout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/barbers" element={<BarbersPage />} />
            <Route path="/barbers/:id" element={<BarberDetailPage />} />
          </Route>

          {/* Auth routes (no layout) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/reschedule-confirm/:token" element={<RescheduleConfirmPage />} />

          {/* Customer protected routes */}
          <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
            <Route element={<MainLayout />}>
              <Route path="/booking" element={<BookingPage />} />
              <Route path="/my-appointments" element={<MyAppointmentsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/payment/:appointmentId" element={<PaymentPage />} />
              <Route path="/payment/result" element={<PaymentResultPage />} />
            </Route>
          </Route>

          {/* Barber protected routes */}
          <Route element={<ProtectedRoute allowedRoles={['barber', 'admin']} />}>
            <Route element={<BarberLayout />}>
              <Route path="/barber" element={<BarberDashboard />} />
              <Route path="/barber/appointments" element={<BarberAppointments />} />
              <Route path="/barber/statistics" element={<BarberStatistics />} />
              <Route path="/barber/profile" element={<BarberProfile />} />
            </Route>
          </Route>

          {/* Admin protected routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'barber']} />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/barbers" element={<AdminBarbers />} />
              <Route path="/admin/services" element={<AdminServices />} />
              <Route path="/admin/appointments" element={<AdminAppointments />} />
              <Route path="/admin/promotions" element={<AdminPromotions />} />
              <Route path="/admin/transactions" element={<AdminTransactions />} />
              <Route path="/admin/statistics" element={<AdminStatistics />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/walk-in-booking" element={<AdminWalkInBooking />} />
            </Route>
          </Route>

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
