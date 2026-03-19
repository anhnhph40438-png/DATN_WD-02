import { useState, useEffect } from 'react';
import {
  FiSearch,
  FiFilter,
  FiEye,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiCreditCard,
  FiAlertCircle,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiHash
} from 'react-icons/fi';
import { adminService } from '../../services';
import { formatDate, formatDateTime, formatCurrency, formatPhoneNumber } from '../../utils/formatters';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const itemsPerPage = 10;
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [transactionToRefund, setTransactionToRefund] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, search, startDate, endDate, statusFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: search || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      };
      const response = await adminService.getAllTransactions(params);
      const data = response.data || response;
      setTransactions(data.transactions || []);
      setTotalPages(data.pagination?.totalPages || Math.ceil((data.pagination?.total || 0) / itemsPerPage));
      setTotalTransactions(data.pagination?.total || data.transactions?.length || 0);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Không thể tải danh sách giao dịch');
      setTransactions(getMockTransactions());
      setTotalTransactions(20);
      setTotalPages(2);
    } finally {
      setLoading(false);
    }
  };

  const getMockTransactions = () => [
    {
      _id: 'TXN001',
      transactionId: 'VNP14234567890',
      customer: { name: 'Nguyễn Văn A', phone: '0901234567', email: 'nguyenvana@email.com' },
      appointment: { _id: 'APT001', date: new Date('2024-06-15'), time: '09:00' },
      amount: 150000,
      status: 'success',
      paymentMethod: 'vnpay',
      vnpayData: {
        vnp_TxnRef: 'VNP14234567890',
        vnp_TransactionNo: '14234567890',
        vnp_BankCode: 'NCB',
        vnp_CardType: 'ATM',
        vnp_ResponseCode: '00',
      },
      createdAt: new Date('2024-06-15T08:30:00'),
    },
    {
      _id: 'TXN002',
      transactionId: 'VNP14234567891',
      customer: { name: 'Lê Thị B', phone: '0912345678', email: 'lethib@email.com' },
      appointment: { _id: 'APT002', date: new Date('2024-06-16'), time: '14:00' },
      amount: 200000,
      status: 'pending',
      paymentMethod: 'vnpay',
      vnpayData: null,
      createdAt: new Date('2024-06-16T13:45:00'),
    },
    {
      _id: 'TXN003',
      transactionId: 'VNP14234567892',
      customer: { name: 'Trần Văn C', phone: '0923456789', email: 'tranvanc@email.com' },
      appointment: { _id: 'APT003', date: new Date('2024-06-14'), time: '10:00' },
      amount: 100000,
      status: 'failed',
      paymentMethod: 'vnpay',
      vnpayData: {
        vnp_TxnRef: 'VNP14234567892',
        vnp_ResponseCode: '24',
        vnp_Message: 'Khách hàng hủy giao dịch',
      },
      createdAt: new Date('2024-06-14T09:30:00'),
    },
    {
      _id: 'TXN004',
      transactionId: 'VNP14234567893',
      customer: { name: 'Phạm Thị D', phone: '0934567890', email: 'phamthid@email.com' },
      appointment: { _id: 'APT004', date: new Date('2024-06-13'), time: '16:00' },
      amount: 250000,
      status: 'refunded',
      paymentMethod: 'vnpay',
      vnpayData: {
        vnp_TxnRef: 'VNP14234567893',
        vnp_TransactionNo: '14234567893',
        vnp_BankCode: 'VIETCOMBANK',
        vnp_CardType: 'ATM',
        vnp_ResponseCode: '00',
      },
      refundReason: 'Khách hàng yêu cầu hủy lịch',
      refundedAt: new Date('2024-06-14T10:00:00'),
      createdAt: new Date('2024-06-13T15:30:00'),
    },
  ];

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleRefund = async () => {
    if (!transactionToRefund || !refundReason.trim()) return;
    try {
      setActionLoading(true);
      await adminService.processRefund(transactionToRefund._id, refundReason);
      setTransactions(transactions.map(t =>
        t._id === transactionToRefund._id
          ? { ...t, status: 'refunded', refundReason, refundedAt: new Date() }
          : t
      ));
      setShowRefundModal(false);
      setTransactionToRefund(null);
      setRefundReason('');
    } catch (err) {
      console.error('Error refunding transaction:', err);
      alert('Không thể hoàn tiền giao dịch');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setShowViewModal(true);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-primary-100 text-primary-700',
      success: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-dark-100 text-dark-700',
    };
    return statusColors[status] || 'bg-dark-100 text-dark-700';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      pending: 'Chờ xử lý',
      success: 'Thành công',
      failed: 'Thất bại',
      refunded: 'Đã hoàn tiền',
    };
    return statusTexts[status] || status;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <FiCheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <FiXCircle className="w-4 h-4 text-red-600" />;
      case 'refunded': return <FiRefreshCw className="w-4 h-4 text-dark-600" />;
      default: return <FiClock className="w-4 h-4 text-primary-600" />;
    }
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalTransactions);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-dark-900">Quản lý giao dịch</h1>
        <p className="text-dark-600 mt-1">Xem lịch sử giao dịch và thanh toán</p>
      </div>

      {error && (
        <div className="mb-6 bg-primary-50 border border-primary-200 text-primary-800 px-4 py-3 rounded-lg flex items-center">
          <FiAlertCircle className="mr-2" />
          {error}
        </div>
      )}

      <div className="bg-white border border-dark-100 rounded-xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã giao dịch, tên khách hàng..."
              value={search}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FiCalendar className="text-dark-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
            />
            <span className="text-dark-400">đến</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <FiFilter className="text-dark-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ xử lý</option>
              <option value="success">Thành công</option>
              <option value="failed">Thất bại</option>
              <option value="refunded">Đã hoàn tiền</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-dark-100 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-dark-100">
                <thead className="bg-dark-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Mã giao dịch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Lịch hẹn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Số tiền
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Phương thức
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-dark-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-dark-100">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="hover:bg-dark-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <FiHash className="h-5 w-5 text-primary-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-dark-900 font-mono">
                              {transaction.transactionId?.slice(0, 12) || transaction._id.slice(-8).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-dark-900">
                          {transaction.customer?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-dark-500">
                          {formatPhoneNumber(transaction.customer?.phone)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark-900">
                          #{transaction.appointment?._id?.slice(-6).toUpperCase() || 'N/A'}
                        </div>
                        <div className="text-sm text-dark-500">
                          {transaction.appointment?.date && formatDate(transaction.appointment.date, { month: '2-digit', day: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-dark-900">
                          {formatCurrency(transaction.amount || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(transaction.status)}`}>
                          {getStatusIcon(transaction.status)}
                          <span className="ml-1">{getStatusText(transaction.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-dark-900">
                          <FiCreditCard className="mr-2 text-dark-400" />
                          {transaction.paymentMethod === 'vnpay' ? 'VNPay' : 'Tiền mặt'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark-900">
                          {formatDate(transaction.createdAt, { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </div>
                        <div className="text-sm text-dark-500">
                          {new Date(transaction.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewTransaction(transaction)}
                            className="p-2 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          {transaction.status === 'success' && (
                            <button
                              onClick={() => { setTransactionToRefund(transaction); setShowRefundModal(true); }}
                              className="p-2 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Hoàn tiền"
                            >
                              <FiRefreshCw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-dark-500">
                        Không tìm thấy giao dịch nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-dark-100 flex items-center justify-between">
                <div className="text-sm text-dark-700">
                  Hiển thị <span className="font-medium">{startIndex}</span> đến{' '}
                  <span className="font-medium">{endIndex}</span> trong{' '}
                  <span className="font-medium">{totalTransactions}</span> giao dịch
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-dark-200 rounded-lg text-sm font-medium text-dark-700 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                    Math.max(0, currentPage - 3),
                    Math.min(totalPages, currentPage + 2)
                  ).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                        currentPage === page
                          ? 'bg-dark-900 text-white border-dark-900'
                          : 'border-dark-200 text-dark-700 hover:bg-dark-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-dark-200 rounded-lg text-sm font-medium text-dark-700 hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showViewModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowViewModal(false)} />
          <div className="relative bg-white border border-dark-200 rounded-xl max-w-2xl w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-display font-semibold text-dark-900">
                Chi tiết giao dịch
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 text-dark-400 hover:text-dark-600 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-center mb-6">
              <div className={`flex items-center px-4 py-2 rounded-full ${getStatusBadge(selectedTransaction.status)}`}>
                {getStatusIcon(selectedTransaction.status)}
                <span className="ml-2 font-medium">{getStatusText(selectedTransaction.status)}</span>
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-dark-900">
                {formatCurrency(selectedTransaction.amount)}
              </div>
              <div className="text-sm text-dark-500 mt-1">
                {formatDateTime(selectedTransaction.createdAt)}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-dark-50 rounded-lg p-4">
                <h4 className="font-medium text-dark-900 mb-3 flex items-center">
                  <FiHash className="mr-2" /> Thông tin giao dịch
                </h4>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-dark-500">Mã giao dịch:</span>{' '}
                    <span className="font-mono">{selectedTransaction.transactionId || selectedTransaction._id}</span>
                  </p>
                  <p>
                    <span className="text-dark-500">Phương thức:</span>{' '}
                    {selectedTransaction.paymentMethod === 'vnpay' ? 'VNPay' : 'Tiền mặt'}
                  </p>
                  <p>
                    <span className="text-dark-500">Lịch hẹn:</span>{' '}
                    #{selectedTransaction.appointment?._id?.slice(-6).toUpperCase() || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="bg-dark-50 rounded-lg p-4">
                <h4 className="font-medium text-dark-900 mb-3 flex items-center">
                  <FiUser className="mr-2" /> Khách hàng
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-dark-500">Tên:</span> {selectedTransaction.customer?.name}</p>
                  <p><span className="text-dark-500">SĐT:</span> {formatPhoneNumber(selectedTransaction.customer?.phone)}</p>
                  <p><span className="text-dark-500">Email:</span> {selectedTransaction.customer?.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            {selectedTransaction.vnpayData && (
              <div className="mt-6 bg-primary-50 rounded-lg p-4">
                <h4 className="font-medium text-dark-900 mb-3 flex items-center">
                  <FiCreditCard className="mr-2" /> VNPay Response
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedTransaction.vnpayData.vnp_TxnRef && (
                    <p><span className="text-dark-500">TxnRef:</span> {selectedTransaction.vnpayData.vnp_TxnRef}</p>
                  )}
                  {selectedTransaction.vnpayData.vnp_TransactionNo && (
                    <p><span className="text-dark-500">TransactionNo:</span> {selectedTransaction.vnpayData.vnp_TransactionNo}</p>
                  )}
                  {selectedTransaction.vnpayData.vnp_BankCode && (
                    <p><span className="text-dark-500">Bank:</span> {selectedTransaction.vnpayData.vnp_BankCode}</p>
                  )}
                  {selectedTransaction.vnpayData.vnp_CardType && (
                    <p><span className="text-dark-500">Card Type:</span> {selectedTransaction.vnpayData.vnp_CardType}</p>
                  )}
                  {selectedTransaction.vnpayData.vnp_ResponseCode && (
                    <p><span className="text-dark-500">Response Code:</span> {selectedTransaction.vnpayData.vnp_ResponseCode}</p>
                  )}
                  {selectedTransaction.vnpayData.vnp_Message && (
                    <p className="col-span-2"><span className="text-dark-500">Message:</span> {selectedTransaction.vnpayData.vnp_Message}</p>
                  )}
                </div>
              </div>
            )}

            {selectedTransaction.status === 'refunded' && (
              <div className="mt-6 bg-primary-50 rounded-lg p-4">
                <h4 className="font-medium text-dark-900 mb-3 flex items-center">
                  <FiRefreshCw className="mr-2" /> Thông tin hoàn tiền
                </h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-dark-500">Lý do:</span> {selectedTransaction.refundReason}</p>
                  {selectedTransaction.refundedAt && (
                    <p><span className="text-dark-500">Thời gian:</span> {formatDateTime(selectedTransaction.refundedAt)}</p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              {selectedTransaction.status === 'success' && (
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setTransactionToRefund(selectedTransaction);
                    setShowRefundModal(true);
                  }}
                  className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
                >
                  Hoàn tiền
                </button>
              )}
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-dark-100 text-dark-700 rounded-lg hover:bg-dark-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {showRefundModal && transactionToRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowRefundModal(false)} />
          <div className="relative bg-white border border-dark-200 rounded-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <FiRefreshCw className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-display font-semibold text-dark-900 mb-2">Xác nhận hoàn tiền</h3>
              <p className="text-dark-600 mb-2">
                Bạn có chắc chắn muốn hoàn tiền cho giao dịch này?
              </p>
              <p className="text-xl font-bold text-dark-900 mb-4">
                {formatCurrency(transactionToRefund.amount)}
              </p>
              <div className="mb-6 text-left">
                <label className="block text-sm font-medium text-dark-700 mb-2">
                  Lý do hoàn tiền *
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Nhập lý do hoàn tiền..."
                  className="w-full px-4 py-2 border border-dark-200 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => { setShowRefundModal(false); setRefundReason(''); }}
                  className="px-4 py-2 bg-dark-100 text-dark-700 rounded-lg hover:bg-dark-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleRefund}
                  disabled={actionLoading || !refundReason.trim()}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Đang xử lý...' : 'Xác nhận hoàn tiền'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;
