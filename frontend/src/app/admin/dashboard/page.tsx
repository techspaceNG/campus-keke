'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserSession, logout } from '@/lib/auth';
import { QRCodeSVG } from 'qrcode.react';
import {
  LayoutDashboard,
  Users,
  Car,
  Ticket,
  RotateCcw,
  Receipt,
  FileText,
  AlertTriangle,
  Plus,
  RefreshCw,
  LogOut,
  Search,
  CheckCircle,
  XCircle,
  DollarSign,
  ShieldAlert,
  Zap,
  Eye,
  X,
  CreditCard,
  Phone,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Printer,
  Edit2,
  Trash2,
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'tickets' | 'refills' | 'students' | 'drivers' | 'transactions' | 'audit'
  >('overview');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [failedScans, setFailedScans] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Tickets & Sales Ledger pagination and search state
  const [ticketSearchInput, setTicketSearchInput] = useState('');
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketLimit, setTicketLimit] = useState(10);
  const [ticketStatusFilter, setTicketStatusFilter] = useState('ALL');
  const [ticketTypeFilter, setTicketTypeFilter] = useState('ALL');
  const [ticketPagination, setTicketPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // Students pagination and search state
  const [studentSearchInput, setStudentSearchInput] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentLimit, setStudentLimit] = useState(10);
  const [studentPagination, setStudentPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Drivers pagination and search state
  const [driverSearchInput, setDriverSearchInput] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState('ALL');
  const [driverPage, setDriverPage] = useState(1);
  const [driverLimit, setDriverLimit] = useState(10);
  const [driverPagination, setDriverPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [driversLoading, setDriversLoading] = useState(false);

  // Transactions pagination and search state
  const [txSearchInput, setTxSearchInput] = useState('');
  const [txSearch, setTxSearch] = useState('');
  const [txMethodFilter, setTxMethodFilter] = useState('ALL');
  const [txSourceFilter, setTxSourceFilter] = useState('ALL');
  const [txPage, setTxPage] = useState(1);
  const [txLimit, setTxLimit] = useState(10);
  const [txPagination, setTxPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [txLoading, setTxLoading] = useState(false);

  // Failed Scans (Abuse Monitor) pagination and search state
  const [scanSearchInput, setScanSearchInput] = useState('');
  const [scanSearch, setScanSearch] = useState('');
  const [scanReasonFilter, setScanReasonFilter] = useState('ALL');
  const [scanPage, setScanPage] = useState(1);
  const [scanLimit, setScanLimit] = useState(10);
  const [scanPagination, setScanPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [scanLoading, setScanLoading] = useState(false);

  // Administrative Audit Logs pagination and search state
  const [auditSearchInput, setAuditSearchInput] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditPage, setAuditPage] = useState(1);
  const [auditLimit, setAuditLimit] = useState(10);
  const [auditPagination, setAuditPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [auditLoading, setAuditLoading] = useState(false);

  // Modals
  const [showCreateSaleModal, setShowCreateSaleModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showCreateDriverModal, setShowCreateDriverModal] = useState(false);
  const [showCreateVehicleModal, setShowCreateVehicleModal] = useState(false);
  const [selectedTicketForQr, setSelectedTicketForQr] = useState<any | null>(null);
  const [ticketToPrint, setTicketToPrint] = useState<{ ticket: any; sale?: any } | null>(null);

  // Edit Driver States
  const [showEditDriverModal, setShowEditDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any | null>(null);
  const [editDriverForm, setEditDriverForm] = useState({
    fullName: '',
    phone: '',
    driverCode: '',
    licenseNumber: '',
    status: 'ACTIVE',
    assignedVehicleId: '',
    password: '',
  });
  const [submittingEditDriver, setSubmittingEditDriver] = useState(false);

  // Edit Student States
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editStudentForm, setEditStudentForm] = useState({
    fullName: '',
    phone: '',
    regNumber: '',
    password: '',
  });
  const [submittingEditStudent, setSubmittingEditStudent] = useState(false);

  // Form inputs
  const [saleForm, setSaleForm] = useState({
    totalRides: 10,
    amount: 1500,
    paymentMethod: 'CASH',
    paymentReference: '',
    buyerName: '',
    buyerRegNumber: '',
    buyerPhone: '',
    notes: '',
  });

  const [refillForm, setRefillForm] = useState({
    ticketId: '',
    ticketNumberSearch: '',
    ridesToAdd: 10,
    amountPaid: 1500,
    paymentMethod: 'CASH',
    paymentReference: '',
    notes: '',
  });

  // Search-based refill states
  const [refillSearchQuery, setRefillSearchQuery] = useState('');
  const [searchingTicket, setSearchingTicket] = useState(false);
  const [searchedTicket, setSearchedTicket] = useState<any | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [submittingRefill, setSubmittingRefill] = useState(false);

  const [driverForm, setDriverForm] = useState({
    driverCode: '',
    fullName: '',
    phone: '',
    licenseNumber: '',
    password: 'password123',
    assignedVehicleId: '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    plateNumber: '',
    kekeNumber: '',
    model: 'Bajaj RE 4S',
    capacity: 4,
  });

  const fetchAllData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [statsRes, studentsRes, driversRes, ticketsRes, txRes, auditRes, scanRes, vehiclesRes] =
        await Promise.all([
          api.get('/admin/stats'),
          api.get(`/admin/students?page=${studentPage}&limit=${studentLimit}${studentSearch ? `&search=${encodeURIComponent(studentSearch)}` : ''}`),
          api.get(`/admin/drivers?page=${driverPage}&limit=${driverLimit}${driverSearch ? `&search=${encodeURIComponent(driverSearch)}` : ''}${driverStatusFilter !== 'ALL' ? `&status=${driverStatusFilter}` : ''}`),
          api.get(`/admin/tickets?page=${ticketPage}&limit=${ticketLimit}${ticketSearch ? `&search=${encodeURIComponent(ticketSearch)}` : ''}${ticketStatusFilter !== 'ALL' ? `&status=${ticketStatusFilter}` : ''}${ticketTypeFilter !== 'ALL' ? `&ticketType=${ticketTypeFilter}` : ''}`),
          api.get(`/admin/transactions?page=${txPage}&limit=${txLimit}${txSearch ? `&search=${encodeURIComponent(txSearch)}` : ''}${txMethodFilter !== 'ALL' ? `&validationMethod=${txMethodFilter}` : ''}${txSourceFilter !== 'ALL' ? `&rideSource=${txSourceFilter}` : ''}`),
          api.get(`/admin/audit-logs?page=${auditPage}&limit=${auditLimit}${auditSearch ? `&search=${encodeURIComponent(auditSearch)}` : ''}${auditActionFilter !== 'ALL' ? `&action=${auditActionFilter}` : ''}`),
          api.get(`/admin/failed-scans?page=${scanPage}&limit=${scanLimit}${scanSearch ? `&search=${encodeURIComponent(scanSearch)}` : ''}${scanReasonFilter !== 'ALL' ? `&reason=${scanReasonFilter}` : ''}`),
          api.get('/admin/vehicles').catch(() => ({ data: [] })),
        ]);

      setStats(statsRes.data.overview);
      if (vehiclesRes?.data) {
        setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : (vehiclesRes.data.data || []));
      }
      if (studentsRes.data) {
        setStudents(Array.isArray(studentsRes.data) ? studentsRes.data : (studentsRes.data.data || []));
        if (studentsRes.data.pagination) setStudentPagination(studentsRes.data.pagination);
      }
      if (driversRes.data) {
        setDrivers(Array.isArray(driversRes.data) ? driversRes.data : (driversRes.data.data || []));
        if (driversRes.data.pagination) setDriverPagination(driversRes.data.pagination);
      }
      if (ticketsRes.data) {
        setTickets(Array.isArray(ticketsRes.data) ? ticketsRes.data : (ticketsRes.data.data || []));
        if (ticketsRes.data.pagination) setTicketPagination(ticketsRes.data.pagination);
      }
      if (txRes.data) {
        setTransactions(Array.isArray(txRes.data) ? txRes.data : (txRes.data.data || []));
        if (txRes.data.pagination) setTxPagination(txRes.data.pagination);
      }
      if (auditRes.data) {
        setAuditLogs(Array.isArray(auditRes.data) ? auditRes.data : (auditRes.data.data || []));
        if (auditRes.data.pagination) setAuditPagination(auditRes.data.pagination);
      }
      if (scanRes.data) {
        setFailedScans(Array.isArray(scanRes.data) ? scanRes.data : (scanRes.data.data || []));
        if (scanRes.data.pagination) setScanPagination(scanRes.data.pagination);
      }
    } catch (err: any) {
      if (err.statusCode === 401 || err.statusCode === 403) {
        logout();
      } else {
        setError(err.message || 'Failed to load dashboard data.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Tickets & Sales Ledger dedicated fetch and pagination
  const fetchTicketsList = async (
    targetPage = ticketPage,
    targetSearch = ticketSearch,
    targetStatus = ticketStatusFilter,
    targetType = ticketTypeFilter,
    targetLimit = ticketLimit
  ) => {
    try {
      setTicketsLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('limit', String(targetLimit));
      if (targetSearch && targetSearch.trim()) params.set('search', targetSearch.trim());
      if (targetStatus && targetStatus !== 'ALL') params.set('status', targetStatus);
      if (targetType && targetType !== 'ALL') params.set('ticketType', targetType);

      const res = await api.get(`/admin/tickets?${params.toString()}`);
      if (res.data) {
        setTickets(Array.isArray(res.data) ? res.data : (res.data.data || []));
        if (res.data.pagination) {
          setTicketPagination(res.data.pagination);
          setTicketPage(res.data.pagination.page);
        }
      }
    } catch (err: any) {
      console.error('Failed to load tickets ledger:', err);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleTicketSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = ticketSearchInput.trim();
    setTicketSearch(query);
    setTicketPage(1);
    fetchTicketsList(1, query, ticketStatusFilter, ticketTypeFilter, ticketLimit);
  };

  const handleTicketFilterChange = (key: 'status' | 'type' | 'limit', value: string) => {
    let newStatus = ticketStatusFilter;
    let newType = ticketTypeFilter;
    let newLimit = ticketLimit;
    const newPage = 1;

    if (key === 'status') {
      newStatus = value;
      setTicketStatusFilter(value);
    } else if (key === 'type') {
      newType = value;
      setTicketTypeFilter(value);
    } else if (key === 'limit') {
      newLimit = Number(value);
      setTicketLimit(newLimit);
    }

    setTicketPage(newPage);
    fetchTicketsList(newPage, ticketSearch, newStatus, newType, newLimit);
  };

  const handleTicketPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > ticketPagination.pages || newPage === ticketPage) return;
    setTicketPage(newPage);
    fetchTicketsList(newPage, ticketSearch, ticketStatusFilter, ticketTypeFilter, ticketLimit);
  };

  const resetTicketFilters = () => {
    setTicketSearchInput('');
    setTicketSearch('');
    setTicketStatusFilter('ALL');
    setTicketTypeFilter('ALL');
    setTicketPage(1);
    fetchTicketsList(1, '', 'ALL', 'ALL', ticketLimit);
  };

  // Students dedicated fetch and pagination
  const fetchStudentsList = async (
    targetPage = studentPage,
    targetSearch = studentSearch,
    targetLimit = studentLimit
  ) => {
    try {
      setStudentsLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('limit', String(targetLimit));
      if (targetSearch && targetSearch.trim()) params.set('search', targetSearch.trim());

      const res = await api.get(`/admin/students?${params.toString()}`);
      if (res.data) {
        setStudents(Array.isArray(res.data) ? res.data : (res.data.data || []));
        if (res.data.pagination) {
          setStudentPagination(res.data.pagination);
          setStudentPage(res.data.pagination.page);
        }
      }
    } catch (err: any) {
      console.error('Failed to load students:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleStudentSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = studentSearchInput.trim();
    setStudentSearch(query);
    setStudentPage(1);
    fetchStudentsList(1, query, studentLimit);
  };

  const handleStudentLimitChange = (value: string) => {
    const newLimit = Number(value);
    setStudentLimit(newLimit);
    setStudentPage(1);
    fetchStudentsList(1, studentSearch, newLimit);
  };

  const handleStudentPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > studentPagination.pages || newPage === studentPage) return;
    setStudentPage(newPage);
    fetchStudentsList(newPage, studentSearch, studentLimit);
  };

  const resetStudentFilters = () => {
    setStudentSearchInput('');
    setStudentSearch('');
    setStudentPage(1);
    fetchStudentsList(1, '', studentLimit);
  };

  // Drivers dedicated fetch and pagination
  const fetchDriversList = async (
    targetPage = driverPage,
    targetSearch = driverSearch,
    targetStatus = driverStatusFilter,
    targetLimit = driverLimit
  ) => {
    try {
      setDriversLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('limit', String(targetLimit));
      if (targetSearch && targetSearch.trim()) params.set('search', targetSearch.trim());
      if (targetStatus && targetStatus !== 'ALL') params.set('status', targetStatus);

      const res = await api.get(`/admin/drivers?${params.toString()}`);
      if (res.data) {
        setDrivers(Array.isArray(res.data) ? res.data : (res.data.data || []));
        if (res.data.pagination) {
          setDriverPagination(res.data.pagination);
          setDriverPage(res.data.pagination.page);
        }
      }
    } catch (err: any) {
      console.error('Failed to load drivers:', err);
    } finally {
      setDriversLoading(false);
    }
  };

  const handleDriverSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = driverSearchInput.trim();
    setDriverSearch(query);
    setDriverPage(1);
    fetchDriversList(1, query, driverStatusFilter, driverLimit);
  };

  const handleDriverFilterChange = (key: 'status' | 'limit', value: string) => {
    let newStatus = driverStatusFilter;
    let newLimit = driverLimit;
    const newPage = 1;

    if (key === 'status') {
      newStatus = value;
      setDriverStatusFilter(value);
    } else if (key === 'limit') {
      newLimit = Number(value);
      setDriverLimit(newLimit);
    }

    setDriverPage(newPage);
    fetchDriversList(newPage, driverSearch, newStatus, newLimit);
  };

  const handleDriverPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > driverPagination.pages || newPage === driverPage) return;
    setDriverPage(newPage);
    fetchDriversList(newPage, driverSearch, driverStatusFilter, driverLimit);
  };

  const resetDriverFilters = () => {
    setDriverSearchInput('');
    setDriverSearch('');
    setDriverStatusFilter('ALL');
    setDriverPage(1);
    fetchDriversList(1, '', 'ALL', driverLimit);
  };

  // Transactions dedicated fetch and pagination
  const fetchTransactionsList = async (
    targetPage = txPage,
    targetSearch = txSearch,
    targetMethod = txMethodFilter,
    targetSource = txSourceFilter,
    targetLimit = txLimit
  ) => {
    try {
      setTxLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('limit', String(targetLimit));
      if (targetSearch && targetSearch.trim()) params.set('search', targetSearch.trim());
      if (targetMethod && targetMethod !== 'ALL') params.set('validationMethod', targetMethod);
      if (targetSource && targetSource !== 'ALL') params.set('rideSource', targetSource);

      const res = await api.get(`/admin/transactions?${params.toString()}`);
      if (res.data) {
        setTransactions(Array.isArray(res.data) ? res.data : (res.data.data || []));
        if (res.data.pagination) {
          setTxPagination(res.data.pagination);
          setTxPage(res.data.pagination.page);
        }
      }
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
    } finally {
      setTxLoading(false);
    }
  };

  const handleTxSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = txSearchInput.trim();
    setTxSearch(query);
    setTxPage(1);
    fetchTransactionsList(1, query, txMethodFilter, txSourceFilter, txLimit);
  };

  const handleTxFilterChange = (key: 'method' | 'source' | 'limit', value: string) => {
    let newMethod = txMethodFilter;
    let newSource = txSourceFilter;
    let newLimit = txLimit;
    const newPage = 1;

    if (key === 'method') {
      newMethod = value;
      setTxMethodFilter(value);
    } else if (key === 'source') {
      newSource = value;
      setTxSourceFilter(value);
    } else if (key === 'limit') {
      newLimit = Number(value);
      setTxLimit(newLimit);
    }

    setTxPage(newPage);
    fetchTransactionsList(newPage, txSearch, newMethod, newSource, newLimit);
  };

  const handleTxPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > txPagination.pages || newPage === txPage) return;
    setTxPage(newPage);
    fetchTransactionsList(newPage, txSearch, txMethodFilter, txSourceFilter, txLimit);
  };

  const resetTxFilters = () => {
    setTxSearchInput('');
    setTxSearch('');
    setTxMethodFilter('ALL');
    setTxSourceFilter('ALL');
    setTxPage(1);
    fetchTransactionsList(1, '', 'ALL', 'ALL', txLimit);
  };

  // Failed Scans (Abuse Monitor) dedicated fetch and pagination
  const fetchFailedScansList = async (
    targetPage = scanPage,
    targetSearch = scanSearch,
    targetReason = scanReasonFilter,
    targetLimit = scanLimit
  ) => {
    try {
      setScanLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('limit', String(targetLimit));
      if (targetSearch && targetSearch.trim()) params.set('search', targetSearch.trim());
      if (targetReason && targetReason !== 'ALL') params.set('reason', targetReason);

      const res = await api.get(`/admin/failed-scans?${params.toString()}`);
      if (res.data) {
        setFailedScans(Array.isArray(res.data) ? res.data : (res.data.data || []));
        if (res.data.pagination) {
          setScanPagination(res.data.pagination);
          setScanPage(res.data.pagination.page);
        }
      }
    } catch (err: any) {
      console.error('Failed to load failed scans:', err);
    } finally {
      setScanLoading(false);
    }
  };

  const handleScanSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = scanSearchInput.trim();
    setScanSearch(query);
    setScanPage(1);
    fetchFailedScansList(1, query, scanReasonFilter, scanLimit);
  };

  const handleScanFilterChange = (key: 'reason' | 'limit', value: string) => {
    let newReason = scanReasonFilter;
    let newLimit = scanLimit;
    const newPage = 1;

    if (key === 'reason') {
      newReason = value;
      setScanReasonFilter(value);
    } else if (key === 'limit') {
      newLimit = Number(value);
      setScanLimit(newLimit);
    }

    setScanPage(newPage);
    fetchFailedScansList(newPage, scanSearch, newReason, newLimit);
  };

  const handleScanPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > scanPagination.pages || newPage === scanPage) return;
    setScanPage(newPage);
    fetchFailedScansList(newPage, scanSearch, scanReasonFilter, scanLimit);
  };

  const resetScanFilters = () => {
    setScanSearchInput('');
    setScanSearch('');
    setScanReasonFilter('ALL');
    setScanPage(1);
    fetchFailedScansList(1, '', 'ALL', scanLimit);
  };

  // Administrative Audit Logs dedicated fetch and pagination
  const fetchAuditLogsList = async (
    targetPage = auditPage,
    targetSearch = auditSearch,
    targetAction = auditActionFilter,
    targetLimit = auditLimit
  ) => {
    try {
      setAuditLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(targetPage));
      params.set('limit', String(targetLimit));
      if (targetSearch && targetSearch.trim()) params.set('search', targetSearch.trim());
      if (targetAction && targetAction !== 'ALL') params.set('action', targetAction);

      const res = await api.get(`/admin/audit-logs?${params.toString()}`);
      if (res.data) {
        setAuditLogs(Array.isArray(res.data) ? res.data : (res.data.data || []));
        if (res.data.pagination) {
          setAuditPagination(res.data.pagination);
          setAuditPage(res.data.pagination.page);
        }
      }
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleAuditSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = auditSearchInput.trim();
    setAuditSearch(query);
    setAuditPage(1);
    fetchAuditLogsList(1, query, auditActionFilter, auditLimit);
  };

  const handleAuditFilterChange = (key: 'action' | 'limit', value: string) => {
    let newAction = auditActionFilter;
    let newLimit = auditLimit;
    const newPage = 1;

    if (key === 'action') {
      newAction = value;
      setAuditActionFilter(value);
    } else if (key === 'limit') {
      newLimit = Number(value);
      setAuditLimit(newLimit);
    }

    setAuditPage(newPage);
    fetchAuditLogsList(newPage, auditSearch, newAction, newLimit);
  };

  const handleAuditPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > auditPagination.pages || newPage === auditPage) return;
    setAuditPage(newPage);
    fetchAuditLogsList(newPage, auditSearch, auditActionFilter, auditLimit);
  };

  const resetAuditFilters = () => {
    setAuditSearchInput('');
    setAuditSearch('');
    setAuditActionFilter('ALL');
    setAuditPage(1);
    fetchAuditLogsList(1, '', 'ALL', auditLimit);
  };

  useEffect(() => {
    const session = getUserSession();
    if (!session || session.role !== 'ADMIN') {
      router.push('/login');
      return;
    }
    fetchAllData();
  }, [router]);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // 1. Submit Ticket Sale
  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/tickets/sell', saleForm);
      showNotification(`Ticket ${res.data.ticket.ticketNumber} sold successfully!`);
      setShowCreateSaleModal(false);
      setTicketToPrint({
        ticket: res.data.ticket,
        sale: res.data.sale || {
          amount: saleForm.amount,
          paymentMethod: saleForm.paymentMethod,
          buyerName: saleForm.buyerName,
          buyerRegNumber: saleForm.buyerRegNumber,
          buyerPhone: saleForm.buyerPhone,
          soldAt: new Date().toISOString(),
        },
      });
      setSaleForm({
        totalRides: 10,
        amount: 1500,
        paymentMethod: 'CASH',
        paymentReference: '',
        buyerName: '',
        buyerRegNumber: '',
        buyerPhone: '',
        notes: '',
      });
      fetchAllData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to record ticket sale');
    }
  };

  // Refill helper: Lookup ticket by ID or number and show person details
  const lookupTicketForRefill = async (query: string) => {
    const trimmed = query.trim().toUpperCase();
    if (!trimmed) {
      setSearchedTicket(null);
      setSearchError('Please enter a Ticket ID or Driver Code to search');
      return;
    }
    setSearchingTicket(true);
    setSearchError(null);
    try {
      const res = await api.get(`/tickets/${encodeURIComponent(trimmed)}`);
      if (res.data) {
        setSearchedTicket(res.data);
        setRefillForm((prev) => ({
          ...prev,
          ticketId: res.data.id,
          ticketNumberSearch: res.data.ticketNumber,
          notes: res.data.ticketType === 'DRIVER_EMERGENCY' ? 'Driver emergency float credit refill' : prev.notes,
        }));
      } else {
        setSearchedTicket(null);
        setSearchError(`Ticket "${trimmed}" not found. Verify the Ticket ID.`);
      }
    } catch (err: any) {
      // Fallback 1: check locally cached tickets list
      const localMatch = tickets.find(
        (t) =>
          t.ticketNumber?.toUpperCase() === trimmed ||
          t.id === trimmed ||
          t.student?.regNumber?.toUpperCase() === trimmed ||
          t.driver?.driverCode?.toUpperCase() === trimmed
      );
      if (localMatch) {
        setSearchedTicket(localMatch);
        setRefillForm((prev) => ({
          ...prev,
          ticketId: localMatch.id,
          ticketNumberSearch: localMatch.ticketNumber,
          notes: localMatch.ticketType === 'DRIVER_EMERGENCY' ? 'Driver emergency float credit refill' : prev.notes,
        }));
        return;
      }

      // Fallback 2: check drivers list for emergency ticket matching driver code or query
      const driverMatch = drivers.find(
        (d) =>
          d.driverCode?.toUpperCase() === trimmed ||
          d.fullName?.toUpperCase().includes(trimmed) ||
          d.phone === trimmed ||
          d.emergencyTickets?.some((et: any) => et.ticketNumber?.toUpperCase() === trimmed || et.id === trimmed)
      );

      const driverEt = driverMatch?.emergencyTickets?.[0];
      if (driverEt) {
        setSearchedTicket({
          ...driverEt,
          driver: driverMatch,
        });
        setRefillForm((prev) => ({
          ...prev,
          ticketId: driverEt.id,
          ticketNumberSearch: driverEt.ticketNumber,
          notes: 'Driver emergency float credit refill',
        }));
        return;
      }

      setSearchedTicket(null);
      setSearchError(err.message || `No ticket found for "${trimmed}". Check Ticket ID, Student Reg No, or Driver Code.`);
    } finally {
      setSearchingTicket(false);
    }
  };

  const openRefillModalForTicket = (ticket: any) => {
    // If ticket has driverId, ensure driver details are present
    let populatedTicket = ticket;
    if (ticket.driverId && !ticket.driver) {
      const d = drivers.find((drv) => drv.id === ticket.driverId);
      if (d) populatedTicket = { ...ticket, driver: d };
    }
    setSearchedTicket(populatedTicket);
    setRefillSearchQuery(ticket.ticketNumber);
    setSearchError(null);
    const isDriverEmergency = populatedTicket.ticketType === 'DRIVER_EMERGENCY';
    setRefillForm({
      ticketId: ticket.id,
      ticketNumberSearch: ticket.ticketNumber,
      ridesToAdd: isDriverEmergency ? 20 : 10,
      amountPaid: isDriverEmergency ? 0 : 1500,
      paymentMethod: 'CASH',
      paymentReference: isDriverEmergency ? 'DEPT-EMERGENCY-FLOAT' : '',
      notes: isDriverEmergency ? 'Driver emergency float credit refill' : '',
    });
    setShowRefillModal(true);
  };

  const openBlankRefillModal = () => {
    setSearchedTicket(null);
    setRefillSearchQuery('');
    setSearchError(null);
    setRefillForm({
      ticketId: '',
      ticketNumberSearch: '',
      ridesToAdd: 10,
      amountPaid: 1500,
      paymentMethod: 'CASH',
      paymentReference: '',
      notes: '',
    });
    setShowRefillModal(true);
  };

  // 2. Submit Refill
  const handleRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refillForm.ticketId || !searchedTicket) {
      alert('Please search and verify a valid ticket first before refilling');
      return;
    }
    setSubmittingRefill(true);
    try {
      const res = await api.post('/tickets/refill', {
        ticketId: refillForm.ticketId,
        ridesToAdd: Number(refillForm.ridesToAdd),
        amountPaid: Number(refillForm.amountPaid),
        paymentMethod: refillForm.paymentMethod,
        paymentReference: refillForm.paymentReference,
        notes: refillForm.notes,
      });
      const studentLabel = searchedTicket.student?.fullName
        ? ` for ${searchedTicket.student.fullName} (${searchedTicket.student.regNumber})`
        : '';
      showNotification(
        `Ticket ${searchedTicket.ticketNumber}${studentLabel} refilled successfully! New balance: ${res.data.ticket.remainingRides} rides`
      );
      setShowRefillModal(false);
      setSearchedTicket(null);
      setRefillSearchQuery('');
      setSearchError(null);
      setRefillForm({
        ticketId: '',
        ticketNumberSearch: '',
        ridesToAdd: 10,
        amountPaid: 1500,
        paymentMethod: 'CASH',
        paymentReference: '',
        notes: '',
      });
      fetchAllData(true);
    } catch (err: any) {
      alert(err.message || 'Refill failed');
    } finally {
      setSubmittingRefill(false);
    }
  };

  // 3. Create Driver
  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/drivers', {
        ...driverForm,
        assignedVehicleId: driverForm.assignedVehicleId || undefined,
      });
      showNotification(`Driver account ${driverForm.driverCode} created successfully with default emergency float pass!`);
      setShowCreateDriverModal(false);
      setDriverForm({
        driverCode: '',
        fullName: '',
        phone: '',
        licenseNumber: '',
        password: 'password123',
        assignedVehicleId: '',
      });
      fetchAllData(true);
    } catch (err: any) {
      alert(err.message || 'Driver creation failed');
    }
  };

  // 3b. Issue Emergency Float Pass for Driver
  const issueDriverEmergencyPass = async (driverId: string, driverCode: string) => {
    try {
      await api.post(`/admin/drivers/${driverId}/emergency-ticket`, { initialRides: 20 });
      showNotification(`Emergency float pass provisioned for driver ${driverCode}!`);
      fetchAllData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to issue emergency float pass');
    }
  };

  // 4. Create Vehicle
  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/vehicles', vehicleForm);
      showNotification(`Vehicle ${vehicleForm.kekeNumber} registered!`);
      setShowCreateVehicleModal(false);
      setVehicleForm({
        plateNumber: '',
        kekeNumber: '',
        model: 'Bajaj RE 4S',
        capacity: 4,
      });
      fetchAllData(true);
    } catch (err: any) {
      alert(err.message || 'Vehicle registration failed');
    }
  };

  // 5. Toggle Driver Status
  const toggleDriverStatus = async (driverId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.patch(`/admin/drivers/${driverId}/status`, { status: newStatus });
      showNotification(`Driver status updated to ${newStatus}`);
      fetchAllData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to update driver status');
    }
  };

  // Edit Driver Handlers
  const openEditDriverModal = (driver: any) => {
    setEditingDriver(driver);
    setEditDriverForm({
      fullName: driver.fullName || '',
      phone: driver.phone || '',
      driverCode: driver.driverCode || '',
      licenseNumber: driver.licenseNumber || '',
      status: driver.status || 'ACTIVE',
      assignedVehicleId: driver.assignedVehicleId || '',
      password: '',
    });
    setShowEditDriverModal(true);
  };

  const handleEditDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;
    try {
      setSubmittingEditDriver(true);
      const payload: any = {
        fullName: editDriverForm.fullName.trim(),
        phone: editDriverForm.phone.trim(),
        driverCode: editDriverForm.driverCode.trim().toUpperCase(),
        licenseNumber: editDriverForm.licenseNumber.trim(),
        status: editDriverForm.status,
        assignedVehicleId: editDriverForm.assignedVehicleId || null,
      };
      if (editDriverForm.password && editDriverForm.password.trim().length >= 6) {
        payload.password = editDriverForm.password.trim();
      }
      await api.patch(`/admin/drivers/${editingDriver.id}`, payload);
      showNotification(`Driver "${payload.driverCode}" updated successfully!`);
      setShowEditDriverModal(false);
      setEditingDriver(null);
      fetchAllData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to update driver');
    } finally {
      setSubmittingEditDriver(false);
    }
  };

  const handleDeleteDriver = async (driverId: string, driverCode: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Driver "${driverCode}"?\n\nThis will permanently delete the driver account, license records, and unassign any vehicle.`
    );
    if (!confirmed) return;
    try {
      await api.delete(`/admin/drivers/${driverId}`);
      showNotification(`Driver "${driverCode}" deleted successfully.`);
      fetchAllData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to delete driver');
    }
  };

  // Edit Student Handlers
  const openEditStudentModal = (student: any) => {
    setEditingStudent(student);
    setEditStudentForm({
      fullName: student.fullName || '',
      phone: student.phone || '',
      regNumber: student.regNumber || '',
      password: '',
    });
    setShowEditStudentModal(true);
  };

  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      setSubmittingEditStudent(true);
      const payload: any = {
        fullName: editStudentForm.fullName.trim(),
        phone: editStudentForm.phone.trim(),
        regNumber: editStudentForm.regNumber.trim().toUpperCase(),
      };
      if (editStudentForm.password && editStudentForm.password.trim().length >= 6) {
        payload.password = editStudentForm.password.trim();
      }
      await api.patch(`/admin/students/${editingStudent.id}`, payload);
      showNotification(`Student "${payload.regNumber}" updated successfully!`);
      setShowEditStudentModal(false);
      setEditingStudent(null);
      fetchAllData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to update student');
    } finally {
      setSubmittingEditStudent(false);
    }
  };

  const handleDeleteStudent = async (studentId: string, regNumber: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete Student "${regNumber}"?\n\nThis will remove their student account profile and unassign active tickets.`
    );
    if (!confirmed) return;
    try {
      await api.delete(`/admin/students/${studentId}`);
      showNotification(`Student "${regNumber}" deleted successfully.`);
      fetchAllData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to delete student');
    }
  };

  const handleDeleteVehicle = async (vehicleId: string, kekeNumber: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove Keke "${kekeNumber}" from the campus fleet?`
    );
    if (!confirmed) return;
    try {
      await api.delete(`/admin/vehicles/${vehicleId}`);
      showNotification(`Vehicle "${kekeNumber}" removed from fleet.`);
      fetchAllData(true);
    } catch (err: any) {
      alert(err.message || 'Failed to delete vehicle');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading admin operations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Admin Navbar */}
      <header className="sticky top-0 z-20 bg-slate-900 text-white border-b border-slate-800 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Federal College of Education (Technical) Bichi Logo"
              className="w-10 h-10 object-contain bg-white rounded-xl p-0.5 shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm sm:text-base font-black tracking-wide text-white">CAMPUS KEKE SERVICE</h1>
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin Hub
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">Federal College of Education (Technical) Bichi</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAllData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 bg-white rounded-3xl p-3 border border-slate-200 shadow-sm self-start">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview & Stats</span>
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
                activeTab === 'tickets'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Ticket Sales & Passes</span>
            </button>

            <button
              onClick={() => setActiveTab('refills')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
                activeTab === 'refills'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ticket Refills</span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
                activeTab === 'students'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Student Records</span>
            </button>

            <button
              onClick={() => setActiveTab('drivers')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
                activeTab === 'drivers'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Drivers & Vehicles</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Ride Transactions</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-colors ${
                activeTab === 'audit'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Audit & Security Logs</span>
            </button>
          </nav>

          {/* Quick Actions in Sidebar */}
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
            <button
              onClick={() => setShowCreateSaleModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors border border-emerald-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Sell New Ticket</span>
            </button>
            <button
              onClick={openBlankRefillModal}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refill Ticket</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 space-y-6">
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 shadow-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. OVERVIEW & ANALYTICS TAB */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* Top Metrics Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Active Students
                  </p>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {stats.activeStudents}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                    Registered & Verified
                  </p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Active Drivers
                  </p>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {stats.activeDrivers}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                    On Campus Routes
                  </p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Today's Rides
                  </p>
                  <p className="text-3xl font-black text-emerald-600 mt-1">
                    {stats.todayRides}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">
                    Total: {stats.totalRides} all-time
                  </p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Today's Total Revenue
                  </p>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    ₦{stats.todayRevenue.toLocaleString()}
                  </p>
                  <div className="text-[10px] text-slate-500 font-medium mt-1 space-y-0.5">
                    <p>
                      Sales: ₦{(stats.todaySalesRevenue ?? 0).toLocaleString()} • Refills: ₦{(stats.todayRefillRevenue ?? 0).toLocaleString()}
                    </p>
                    <p className="text-slate-400">Total: ₦{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Secondary Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Active Passes</p>
                    <p className="text-xl font-bold text-slate-900">{stats.activeTickets}</p>
                  </div>
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-xs">OK</span>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Exhausted Passes</p>
                    <p className="text-xl font-bold text-amber-600">{stats.exhaustedTickets}</p>
                  </div>
                  <span className="p-2 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs">Refillable</span>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Unclaimed Passes</p>
                    <p className="text-xl font-bold text-slate-800">{stats.unassignedTickets}</p>
                  </div>
                  <span className="p-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs">Ready</span>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Suspicious / Failed Scans</p>
                    <p className={`text-xl font-bold ${stats.failedScansToday > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                      {stats.failedScansToday}
                    </p>
                  </div>
                  <span className={`p-2 rounded-xl font-bold text-xs ${stats.failedScansToday > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-500'}`}>
                    Audit
                  </span>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                  Quick Administration Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setShowCreateSaleModal(true)}
                    className="p-4 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/50 flex flex-col items-center text-center transition-all group"
                  >
                    <Ticket className="w-6 h-6 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-900">Sell / Issue Student Ticket</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">Cash, Bank Transfer, or POS</span>
                  </button>

                  <button
                    onClick={openBlankRefillModal}
                    className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50 flex flex-col items-center text-center transition-all group"
                  >
                    <RotateCcw className="w-6 h-6 text-slate-700 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-900">Refill Exhausted Ticket</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">Top-up rides & restore pass</span>
                  </button>

                  <button
                    onClick={() => setShowCreateDriverModal(true)}
                    className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50 flex flex-col items-center text-center transition-all group"
                  >
                    <Car className="w-6 h-6 text-slate-700 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-900">Add New Driver / Keke</span>
                    <span className="text-[11px] text-slate-500 mt-0.5">Register driver & assign keke</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. TICKETS TAB */}
          {activeTab === 'tickets' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Tickets & Sales Ledger</h2>
                  <p className="text-xs text-slate-500">Every ticket ever issued, active balances, sales receipts, and owners</p>
                </div>
                <button
                  onClick={() => setShowCreateSaleModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Sell New Ticket</span>
                </button>
              </div>

              {/* Search, Filter & Per-Page Controls */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pt-1">
                <form
                  onSubmit={handleTicketSearchSubmit}
                  className="flex-1 flex items-center gap-2"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search Ticket ID, Student name / Reg No, Driver code..."
                      value={ticketSearchInput}
                      onChange={(e) => setTicketSearchInput(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    {ticketSearchInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setTicketSearchInput('');
                          setTicketSearch('');
                          setTicketPage(1);
                          fetchTicketsList(1, '', ticketStatusFilter, ticketTypeFilter, ticketLimit);
                        }}
                        className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={ticketsLoading}
                    className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-sm shrink-0 flex items-center gap-1.5"
                  >
                    {ticketsLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>Search</span>
                  </button>
                </form>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <select
                      value={ticketStatusFilter}
                      onChange={(e) => handleTicketFilterChange('status', e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="ACTIVE">Active Pass</option>
                      <option value="EXHAUSTED">Exhausted (0 Rides)</option>
                      <option value="UNASSIGNED">Unassigned (Available)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
                    <select
                      value={ticketTypeFilter}
                      onChange={(e) => handleTicketFilterChange('type', e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="ALL">All Pass Types</option>
                      <option value="STUDENT">Student Pass</option>
                      <option value="DRIVER_EMERGENCY">Driver Float</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Rows:</span>
                    <select
                      value={ticketLimit}
                      onChange={(e) => handleTicketFilterChange('limit', e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  {(ticketSearch || ticketStatusFilter !== 'ALL' || ticketTypeFilter !== 'ALL') && (
                    <button
                      onClick={resetTicketFilters}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Range & Status Summary */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
                <span>
                  Showing <strong className="text-slate-800">
                    {ticketPagination.total === 0 ? 0 : (ticketPagination.page - 1) * ticketPagination.limit + 1}
                  </strong> – <strong className="text-slate-800">
                    {Math.min(ticketPagination.page * ticketPagination.limit, ticketPagination.total)}
                  </strong> of <strong className="text-slate-800">{ticketPagination.total}</strong> tickets
                  {ticketSearch && <span> matching "<strong className="text-slate-900">{ticketSearch}</strong>"</span>}
                </span>

                {ticketsLoading && (
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Updating list...
                  </span>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-100">
                    <tr>
                      <th className="py-3 px-3">Ticket ID</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Owner / Passenger</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Balance</th>
                      <th className="py-3 px-3">Sales / Ledger</th>
                      <th className="py-3 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {t.ticketNumber}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              t.ticketType === 'DRIVER_EMERGENCY'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {t.ticketType === 'DRIVER_EMERGENCY' ? 'Driver Float' : t.ticketType}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {t.student ? (
                            <div>
                              <p className="font-bold text-slate-900">{t.student.fullName}</p>
                              <p className="text-[10px] text-slate-400">{t.student.regNumber}</p>
                            </div>
                          ) : t.driver ? (
                            <div>
                              <p className="text-amber-800 font-bold">Driver: {t.driver.fullName}</p>
                              <p className="text-[10px] text-amber-600 font-mono">({t.driver.driverCode})</p>
                            </div>
                          ) : (
                            <span className="text-blue-600 font-semibold">Unassigned (Available)</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              t.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700'
                                : t.status === 'EXHAUSTED'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {t.remainingRides === 0 ? 'EXHAUSTED' : t.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-emerald-600">{t.remainingRides}</span>
                          <span className="text-slate-400 text-[11px]"> / {t.totalRides} rides</span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full ${
                                t.remainingRides === 0
                                  ? 'bg-rose-500'
                                  : t.remainingRides < 5
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.round((t.remainingRides / (t.totalRides || 1)) * 100))}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {t.sales && t.sales[0] ? (
                            <div>
                              <p className="font-bold text-slate-900">
                                ₦{t.sales[0].amount?.toLocaleString()}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {t.sales[0].paymentMethod} • {new Date(t.sales[0].soldAt || t.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ) : t.ticketType === 'DRIVER_EMERGENCY' ? (
                            <div>
                              <p className="font-bold text-amber-700">Float Credit</p>
                              <p className="text-[10px] text-slate-400">
                                Issued: {new Date(t.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-semibold text-slate-400 italic">Unsold</p>
                              <p className="text-[10px] text-slate-400">
                                {new Date(t.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 flex items-center gap-2">
                          <button
                            onClick={() => setSelectedTicketForQr(t)}
                            title="View QR Code"
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setTicketToPrint({ ticket: t, sale: t.sales?.[0] })}
                            title="Print Ticket Slip / Receipt"
                            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {(t.status === 'EXHAUSTED' || t.remainingRides === 0 || t.ticketType === 'DRIVER_EMERGENCY') && (
                            <button
                              onClick={() => openRefillModalForTicket(t)}
                              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-[10px] font-bold transition-colors"
                            >
                              Refill
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {tickets.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center">
                          <Ticket className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700">No tickets match your query</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {ticketSearch || ticketStatusFilter !== 'ALL' || ticketTypeFilter !== 'ALL'
                              ? 'Try searching with a different term or clearing your filters.'
                              : 'No tickets generated in the system yet.'}
                          </p>
                          {(ticketSearch || ticketStatusFilter !== 'ALL' || ticketTypeFilter !== 'ALL') && (
                            <button
                              onClick={resetTicketFilters}
                              className="mt-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                            >
                              Reset Filters
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {ticketPagination.pages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">
                    Page <strong className="text-slate-900">{ticketPagination.page}</strong> of{' '}
                    <strong className="text-slate-900">{ticketPagination.pages}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTicketPageChange(ticketPage - 1)}
                      disabled={ticketPage <= 1 || ticketsLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, ticketPagination.pages) }, (_, i) => {
                        let p = i + 1;
                        if (ticketPagination.pages > 5) {
                          if (ticketPage > 3) {
                            p = ticketPage - 2 + i;
                          }
                          if (p + (4 - i) > ticketPagination.pages) {
                            p = ticketPagination.pages - 4 + i;
                          }
                        }
                        if (p < 1 || p > ticketPagination.pages) return null;

                        return (
                          <button
                            key={p}
                            onClick={() => handleTicketPageChange(p)}
                            disabled={ticketsLoading}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                              p === ticketPage
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handleTicketPageChange(ticketPage + 1)}
                      disabled={ticketPage >= ticketPagination.pages || ticketsLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. REFILLS TAB */}
          {activeTab === 'refills' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Ticket Refill Desk</h2>
                  <p className="text-xs text-slate-500">
                    Add ride credits to exhausted tickets while preserving Ticket ID, QR code, and student account
                  </p>
                </div>
                <button
                  onClick={openBlankRefillModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Refill a Ticket</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-900">How Refilling Works:</span> When a student's ticket reaches 0 rides (EXHAUSTED), they bring their Ticket ID to this desk. The admin searches the Ticket ID to inspect student details, records the payment (Cash, POS, Transfer), and adds ride credits. The ticket is immediately reactivated, preserving their existing QR code.
              </div>

              {/* Tickets needing refill */}
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pt-2">
                Tickets Currently Exhausted (0 Rides)
              </h3>
              <div className="space-y-2">
                {tickets.filter((t) => t.status === 'EXHAUSTED' || t.remainingRides === 0).length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No exhausted tickets at this moment.</p>
                ) : (
                  tickets
                    .filter((t) => t.status === 'EXHAUSTED' || t.remainingRides === 0)
                    .map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-bold text-xs text-slate-900">{t.ticketNumber}</p>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                t.ticketType === 'DRIVER_EMERGENCY'
                                  ? 'bg-amber-200 text-amber-900 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              }`}
                            >
                              {t.ticketType === 'DRIVER_EMERGENCY' ? 'Driver Emergency Pass' : 'Student Ticket'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            {t.student ? (
                              <span>Owner: {t.student.fullName} ({t.student.regNumber})</span>
                            ) : t.driver ? (
                              <span className="font-semibold text-amber-900">
                                Driver: {t.driver.fullName} ({t.driver.driverCode})
                              </span>
                            ) : (
                              <span className="text-slate-400">Unassigned Ticket</span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => openRefillModalForTicket(t)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm"
                        >
                          Refill Pass
                        </button>
                      </div>
                    ))
                )}
              </div>

              {/* Driver Emergency Float Tickets Section */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-emerald-600" />
                    <span>Driver Emergency Credit & Float Passes</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Emergency ticket credits allocated to drivers to fund rides when students lack an active pass
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {drivers.flatMap((d) =>
                    (d.emergencyTickets || []).map((et: any) => (
                      <div
                        key={et.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-between hover:border-emerald-300 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">{et.ticketNumber}</span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                et.remainingRides === 0
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : et.remainingRides < 5
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {et.remainingRides} rides left
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-700 mt-1">
                            Driver: <span className="font-bold text-slate-900">{d.fullName}</span> ({d.driverCode})
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Vehicle: {d.assignedVehicle?.kekeNumber || 'Unassigned'} • Total: {et.totalRides} rides
                          </p>
                        </div>
                        <button
                          onClick={() => openRefillModalForTicket({ ...et, driver: d })}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-colors"
                        >
                          Top-Up
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 4. STUDENTS TAB */}
          {activeTab === 'students' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              {/* Header and Controls */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Student Directory</h2>
                  <p className="text-xs text-slate-500">
                    All registered students, their active tickets, and ride history
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Form */}
                  <form onSubmit={handleStudentSearchSubmit} className="relative flex items-center min-w-[260px] sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search name, reg #, phone, ticket..."
                      value={studentSearchInput}
                      onChange={(e) => setStudentSearchInput(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-slate-50/50"
                    />
                    {studentSearchInput && (
                      <button
                        type="button"
                        onClick={resetStudentFilters}
                        className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </form>

                  {/* Rows Per Page */}
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Rows:</span>
                    <select
                      value={studentLimit}
                      onChange={(e) => handleStudentLimitChange(e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  {studentSearch && (
                    <button
                      onClick={resetStudentFilters}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                    >
                      Reset Search
                    </button>
                  )}
                </div>
              </div>

              {/* Range & Status Summary */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
                <span>
                  Showing <strong className="text-slate-800">
                    {studentPagination.total === 0 ? 0 : (studentPagination.page - 1) * studentPagination.limit + 1}
                  </strong> – <strong className="text-slate-800">
                    {Math.min(studentPagination.page * studentPagination.limit, studentPagination.total)}
                  </strong> of <strong className="text-slate-800">{studentPagination.total}</strong> students
                  {studentSearch && <span> matching "<strong className="text-slate-900">{studentSearch}</strong>"</span>}
                </span>

                {studentsLoading && (
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Updating list...
                  </span>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-100">
                    <tr>
                      <th className="py-3 px-3">Student Name</th>
                      <th className="py-3 px-3">Reg. Number</th>
                      <th className="py-3 px-3">Phone</th>
                      <th className="py-3 px-3">Primary Ticket</th>
                      <th className="py-3 px-3">Balance</th>
                      <th className="py-3 px-3">Total Rides Taken</th>
                      <th className="py-3 px-3">Registered On</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((s) => {
                      const activeTicket = s.tickets && s.tickets[0];
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-bold text-slate-900">{s.fullName}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">{s.regNumber}</td>
                          <td className="py-3 px-3 text-slate-500">{s.phone}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {activeTicket?.ticketNumber || 'None'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-emerald-600">
                              {activeTicket ? `${activeTicket.remainingRides} rides` : '0'}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-700">{s._count?.rides || 0}</td>
                          <td className="py-3 px-3 text-slate-400">
                            {new Date(s.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditStudentModal(s)}
                                title="Edit Student"
                                className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(s.id, s.regNumber)}
                                title="Delete Student"
                                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {students.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center">
                          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700">No students match your query</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {studentSearch
                              ? 'Try searching with a different name, reg number, or phone.'
                              : 'No students registered in the system yet.'}
                          </p>
                          {studentSearch && (
                            <button
                              onClick={resetStudentFilters}
                              className="mt-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                            >
                              Reset Search
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {studentPagination.pages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">
                    Page <strong className="text-slate-900">{studentPagination.page}</strong> of{' '}
                    <strong className="text-slate-900">{studentPagination.pages}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStudentPageChange(studentPage - 1)}
                      disabled={studentPage <= 1 || studentsLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, studentPagination.pages) }, (_, i) => {
                        let p = i + 1;
                        if (studentPagination.pages > 5) {
                          if (studentPage > 3) {
                            p = studentPage - 2 + i;
                          }
                          if (p + (4 - i) > studentPagination.pages) {
                            p = studentPagination.pages - 4 + i;
                          }
                        }
                        if (p < 1 || p > studentPagination.pages) return null;

                        return (
                          <button
                            key={p}
                            onClick={() => handleStudentPageChange(p)}
                            disabled={studentsLoading}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                              p === studentPage
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handleStudentPageChange(studentPage + 1)}
                      disabled={studentPage >= studentPagination.pages || studentsLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. DRIVERS & VEHICLES TAB */}
          {activeTab === 'drivers' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Driver Workforce</h2>
                    <p className="text-xs text-slate-500">Authorized drivers, status, and assigned vehicles</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCreateVehicleModal(true)}
                      className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                    >
                      + Add Keke
                    </button>
                    <button
                      onClick={() => setShowCreateDriverModal(true)}
                      className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      + Add Driver
                    </button>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search Form */}
                    <form onSubmit={handleDriverSearchSubmit} className="relative flex items-center min-w-[260px] sm:w-72">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search driver name, code, phone, vehicle..."
                        value={driverSearchInput}
                        onChange={(e) => setDriverSearchInput(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-slate-50/50"
                      />
                      {driverSearchInput && (
                        <button
                          type="button"
                          onClick={resetDriverFilters}
                          className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </form>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={driverStatusFilter}
                        onChange={(e) => handleDriverFilterChange('status', e.target.value)}
                        className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>

                    {/* Rows Per Page */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Rows:</span>
                      <select
                        value={driverLimit}
                        onChange={(e) => handleDriverFilterChange('limit', e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>

                    {(driverSearch || driverStatusFilter !== 'ALL') && (
                      <button
                        onClick={resetDriverFilters}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Range & Status Summary */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
                  <span>
                    Showing <strong className="text-slate-800">
                      {driverPagination.total === 0 ? 0 : (driverPagination.page - 1) * driverPagination.limit + 1}
                    </strong> – <strong className="text-slate-800">
                      {Math.min(driverPagination.page * driverPagination.limit, driverPagination.total)}
                    </strong> of <strong className="text-slate-800">{driverPagination.total}</strong> drivers
                    {driverSearch && <span> matching "<strong className="text-slate-900">{driverSearch}</strong>"</span>}
                  </span>

                  {driversLoading && (
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Updating list...
                    </span>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-100">
                      <tr>
                        <th className="py-3 px-3">Driver Code</th>
                        <th className="py-3 px-3">Full Name</th>
                        <th className="py-3 px-3">Phone</th>
                        <th className="py-3 px-3">License</th>
                        <th className="py-3 px-3">Assigned Vehicle</th>
                        <th className="py-3 px-3">Emergency Float Pass</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Total Rides</th>
                        <th className="py-3 px-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {drivers.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{d.driverCode}</td>
                          <td className="py-3 px-3 font-bold text-slate-900">{d.fullName}</td>
                          <td className="py-3 px-3 text-slate-500">{d.phone}</td>
                          <td className="py-3 px-3 font-mono text-slate-600">{d.licenseNumber}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {d.assignedVehicle ? (
                              <span>
                                {d.assignedVehicle.kekeNumber} ({d.assignedVehicle.plateNumber})
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">None</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {d.emergencyTickets && d.emergencyTickets.length > 0 ? (
                              <div className="space-y-1">
                                {d.emergencyTickets.map((et: any) => (
                                  <div key={et.id} className="flex items-center gap-2">
                                    <div>
                                      <span className="font-mono font-bold text-slate-900 block">{et.ticketNumber}</span>
                                      <span
                                        className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                                          et.remainingRides === 0
                                            ? 'bg-rose-100 text-rose-800'
                                            : et.remainingRides < 5
                                            ? 'bg-amber-100 text-amber-800'
                                            : 'bg-emerald-100 text-emerald-800'
                                        }`}
                                      >
                                        {et.remainingRides} rides left
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => openRefillModalForTicket({ ...et, driver: d })}
                                      className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors shadow-sm"
                                    >
                                      Top-Up
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <button
                                onClick={() => issueDriverEmergencyPass(d.id, d.driverCode)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition-colors shadow-sm"
                              >
                                + Issue Float Pass
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                d.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {d.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-800">{d._count?.rides || 0}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => toggleDriverStatus(d.id, d.status)}
                                className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-colors ${
                                  d.status === 'ACTIVE'
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                }`}
                              >
                                {d.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                              </button>
                              <button
                                onClick={() => openEditDriverModal(d)}
                                title="Edit Driver Details"
                                className="p-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDriver(d.id, d.driverCode)}
                                title="Delete Driver Account"
                                className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {drivers.length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-12 text-center">
                            <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-700">No drivers match your query</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {driverSearch || driverStatusFilter !== 'ALL'
                                ? 'Try searching with a different term or clearing your filters.'
                                : 'No drivers registered in the system yet.'}
                            </p>
                            {(driverSearch || driverStatusFilter !== 'ALL') && (
                              <button
                                onClick={resetDriverFilters}
                                className="mt-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                              >
                                Reset Filters
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {driverPagination.pages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500 font-medium">
                      Page <strong className="text-slate-900">{driverPagination.page}</strong> of{' '}
                      <strong className="text-slate-900">{driverPagination.pages}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDriverPageChange(driverPage - 1)}
                        disabled={driverPage <= 1 || driversLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, driverPagination.pages) }, (_, i) => {
                          let p = i + 1;
                          if (driverPagination.pages > 5) {
                            if (driverPage > 3) {
                              p = driverPage - 2 + i;
                            }
                            if (p + (4 - i) > driverPagination.pages) {
                              p = driverPagination.pages - 4 + i;
                            }
                          }
                          if (p < 1 || p > driverPagination.pages) return null;

                          return (
                            <button
                              key={p}
                              onClick={() => handleDriverPageChange(p)}
                              disabled={driversLoading}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                                p === driverPage
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handleDriverPageChange(driverPage + 1)}
                        disabled={driverPage >= driverPagination.pages || driversLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Fleet Vehicles Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Campus Fleet Vehicles</h2>
                    <p className="text-xs text-slate-500">Registered Keke tricycles, plate numbers, and assigned drivers</p>
                  </div>
                  <button
                    onClick={() => setShowCreateVehicleModal(true)}
                    className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                  >
                    + Register New Keke
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-100">
                      <tr>
                        <th className="py-3 px-3">Keke #</th>
                        <th className="py-3 px-3">Plate Number</th>
                        <th className="py-3 px-3">Model</th>
                        <th className="py-3 px-3">Capacity</th>
                        <th className="py-3 px-3">Assigned Driver</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vehicles.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{v.kekeNumber}</td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">{v.plateNumber}</td>
                          <td className="py-3 px-3 text-slate-600">{v.model || 'Bajaj RE 4S'}</td>
                          <td className="py-3 px-3 text-slate-600">{v.capacity || 4} Passengers</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">
                            {v.drivers && v.drivers.length > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Car className="w-3 h-3" />
                                {v.drivers.map((d: any) => `${d.driverCode} - ${d.fullName}`).join(', ')}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned (Available)</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => handleDeleteVehicle(v.id, v.kekeNumber)}
                              title="Remove Keke from Fleet"
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}

                      {vehicles.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No keke vehicles registered yet. Click "+ Register New Keke" above to add vehicles to your campus fleet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. TRANSACTIONS TAB */}
          {activeTab === 'transactions' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Ride Transaction Audit</h2>
                  <p className="text-xs text-slate-500">Immutable ledger of validated passenger trips</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Form */}
                  <form onSubmit={handleTxSearchSubmit} className="relative flex items-center min-w-[260px] sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search txn #, student, driver, keke #..."
                      value={txSearchInput}
                      onChange={(e) => setTxSearchInput(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-slate-50/50"
                    />
                    {txSearchInput && (
                      <button
                        type="button"
                        onClick={resetTxFilters}
                        className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </form>

                  {/* Validation Method Filter */}
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={txMethodFilter}
                      onChange={(e) => handleTxFilterChange('method', e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="ALL">All Methods</option>
                      <option value="QR_SCAN">QR Scan</option>
                      <option value="MANUAL_ENTRY">Manual Entry</option>
                      <option value="SYSTEM_OVERRIDE">System Override</option>
                    </select>
                  </div>

                  {/* Ride Source Filter */}
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
                    <select
                      value={txSourceFilter}
                      onChange={(e) => handleTxFilterChange('source', e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="ALL">All Sources</option>
                      <option value="STUDENT_TICKET">Student Ticket</option>
                      <option value="DRIVER_EMERGENCY_TICKET">Driver Float</option>
                    </select>
                  </div>

                  {/* Rows Per Page */}
                  <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Rows:</span>
                    <select
                      value={txLimit}
                      onChange={(e) => handleTxFilterChange('limit', e.target.value)}
                      className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  {(txSearch || txMethodFilter !== 'ALL' || txSourceFilter !== 'ALL') && (
                    <button
                      onClick={resetTxFilters}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Range & Status Summary */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
                <span>
                  Showing <strong className="text-slate-800">
                    {txPagination.total === 0 ? 0 : (txPagination.page - 1) * txPagination.limit + 1}
                  </strong> – <strong className="text-slate-800">
                    {Math.min(txPagination.page * txPagination.limit, txPagination.total)}
                  </strong> of <strong className="text-slate-800">{txPagination.total}</strong> transactions
                  {txSearch && <span> matching "<strong className="text-slate-900">{txSearch}</strong>"</span>}
                </span>

                {txLoading && (
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Updating list...
                  </span>
                )}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-100">
                    <tr>
                      <th className="py-3 px-3">Txn #</th>
                      <th className="py-3 px-3">Timestamp</th>
                      <th className="py-3 px-3">Student</th>
                      <th className="py-3 px-3">Driver</th>
                      <th className="py-3 px-3">Vehicle</th>
                      <th className="py-3 px-3">Method</th>
                      <th className="py-3 px-3">Funding Source</th>
                      <th className="py-3 px-3">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{tx.transactionNumber}</td>
                        <td className="py-3 px-3 text-slate-500">
                          {new Date(tx.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3 px-3">
                          {tx.student ? (
                            <div>
                              <p className="font-bold text-slate-900">{tx.student.fullName}</p>
                              <p className="text-[10px] text-slate-400">{tx.student.regNumber}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Emergency Rider</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">
                          {tx.driver?.fullName} ({tx.driver?.driverCode})
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {tx.vehicle?.kekeNumber || 'Keke'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {tx.validationMethod}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.rideSource === 'STUDENT_TICKET'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {tx.rideSource}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          {tx.remainingRidesAfter} rides
                        </td>
                      </tr>
                    ))}

                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center">
                          <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700">No transactions match your query</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {txSearch || txMethodFilter !== 'ALL' || txSourceFilter !== 'ALL'
                              ? 'Try searching with a different term or clearing your filters.'
                              : 'No ride transactions recorded yet.'}
                          </p>
                          {(txSearch || txMethodFilter !== 'ALL' || txSourceFilter !== 'ALL') && (
                            <button
                              onClick={resetTxFilters}
                              className="mt-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                            >
                              Reset Filters
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {txPagination.pages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">
                    Page <strong className="text-slate-900">{txPagination.page}</strong> of{' '}
                    <strong className="text-slate-900">{txPagination.pages}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTxPageChange(txPage - 1)}
                      disabled={txPage <= 1 || txLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, txPagination.pages) }, (_, i) => {
                        let p = i + 1;
                        if (txPagination.pages > 5) {
                          if (txPage > 3) {
                            p = txPage - 2 + i;
                          }
                          if (p + (4 - i) > txPagination.pages) {
                            p = txPagination.pages - 4 + i;
                          }
                        }
                        if (p < 1 || p > txPagination.pages) return null;

                        return (
                          <button
                            key={p}
                            onClick={() => handleTxPageChange(p)}
                            disabled={txLoading}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                              p === txPage
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {p}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handleTxPageChange(txPage + 1)}
                      disabled={txPage >= txPagination.pages || txLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 7. AUDIT & SECURITY LOGS TAB */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              {/* Failed Scans / Suspicious activity */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Failed Ticket Scans & Abuse Monitor</h2>
                      <p className="text-xs text-slate-500">Detects counterfeit QR attempts and enumeration scans</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Scan Search Form */}
                    <form onSubmit={handleScanSearchSubmit} className="relative flex items-center min-w-[240px] sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search ticket, driver, IP..."
                        value={scanSearchInput}
                        onChange={(e) => setScanSearchInput(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-slate-50/50"
                      />
                      {scanSearchInput && (
                        <button
                          type="button"
                          onClick={resetScanFilters}
                          className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </form>

                    {/* Reason Filter */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={scanReasonFilter}
                        onChange={(e) => handleScanFilterChange('reason', e.target.value)}
                        className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                      >
                        <option value="ALL">All Reasons</option>
                        <option value="INVALID_SIGNATURE">Invalid Signature</option>
                        <option value="TICKET_NOT_FOUND">Ticket Not Found</option>
                        <option value="EXHAUSTED_RIDES">Exhausted Rides</option>
                        <option value="EXPIRED_TICKET">Expired Ticket</option>
                        <option value="MALFORMED_PAYLOAD">Malformed Payload</option>
                      </select>
                    </div>

                    {/* Rows Per Page */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Rows:</span>
                      <select
                        value={scanLimit}
                        onChange={(e) => handleScanFilterChange('limit', e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>

                    {(scanSearch || scanReasonFilter !== 'ALL') && (
                      <button
                        onClick={resetScanFilters}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Range & Status Summary */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
                  <span>
                    Showing <strong className="text-slate-800">
                      {scanPagination.total === 0 ? 0 : (scanPagination.page - 1) * scanPagination.limit + 1}
                    </strong> – <strong className="text-slate-800">
                      {Math.min(scanPagination.page * scanPagination.limit, scanPagination.total)}
                    </strong> of <strong className="text-slate-800">{scanPagination.total}</strong> events
                    {scanSearch && <span> matching "<strong className="text-slate-900">{scanSearch}</strong>"</span>}
                  </span>

                  {scanLoading && (
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Updating list...
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-100">
                      <tr>
                        <th className="py-3 px-3">Time</th>
                        <th className="py-3 px-3">Driver</th>
                        <th className="py-3 px-3">Attempted Ticket</th>
                        <th className="py-3 px-3">Failure Reason</th>
                        <th className="py-3 px-3">Client IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {failedScans.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center">
                            <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-700">No failed scans recorded</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {scanSearch || scanReasonFilter !== 'ALL'
                                ? 'No failed scan events match your current filter parameters.'
                                : 'System is operating securely with zero recent scan anomalies.'}
                            </p>
                            {(scanSearch || scanReasonFilter !== 'ALL') && (
                              <button
                                onClick={resetScanFilters}
                                className="mt-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                              >
                                Reset Filters
                              </button>
                            )}
                          </td>
                        </tr>
                      ) : (
                        failedScans.map((fs) => (
                          <tr key={fs.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3 text-slate-500">
                              {new Date(fs.createdAt).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              {fs.driver ? `${fs.driver.fullName} (${fs.driver.driverCode})` : 'Unknown'}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-rose-700">
                              {fs.attemptedTicket}
                            </td>
                            <td className="py-3 px-3 font-semibold text-rose-600">{fs.reason}</td>
                            <td className="py-3 px-3 text-slate-400 font-mono">{fs.ipAddress || '127.0.0.1'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Scan Pagination Controls */}
                {scanPagination.pages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500 font-medium">
                      Page <strong className="text-slate-900">{scanPagination.page}</strong> of{' '}
                      <strong className="text-slate-900">{scanPagination.pages}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleScanPageChange(scanPage - 1)}
                        disabled={scanPage <= 1 || scanLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, scanPagination.pages) }, (_, i) => {
                          let p = i + 1;
                          if (scanPagination.pages > 5) {
                            if (scanPage > 3) {
                              p = scanPage - 2 + i;
                            }
                            if (p + (4 - i) > scanPagination.pages) {
                              p = scanPagination.pages - 4 + i;
                            }
                          }
                          if (p < 1 || p > scanPagination.pages) return null;

                          return (
                            <button
                              key={p}
                              onClick={() => handleScanPageChange(p)}
                              disabled={scanLoading}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                                p === scanPage
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handleScanPageChange(scanPage + 1)}
                        disabled={scanPage >= scanPagination.pages || scanLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Administrative Audit Trail */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Administrative Audit Trail</h2>
                    <p className="text-xs text-slate-500">Tamper-evident logs of ticket sales, refills, and account actions</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Audit Search Form */}
                    <form onSubmit={handleAuditSearchSubmit} className="relative flex items-center min-w-[240px] sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search action, user, entity..."
                        value={auditSearchInput}
                        onChange={(e) => setAuditSearchInput(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-slate-50/50"
                      />
                      {auditSearchInput && (
                        <button
                          type="button"
                          onClick={resetAuditFilters}
                          className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </form>

                    {/* Action Filter */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={auditActionFilter}
                        onChange={(e) => handleAuditFilterChange('action', e.target.value)}
                        className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                      >
                        <option value="ALL">All Actions</option>
                        <option value="TICKET_CREATED">Ticket Created</option>
                        <option value="TICKET_REFILLED">Ticket Refilled</option>
                        <option value="DRIVER_CREATED">Driver Created</option>
                        <option value="DRIVER_STATUS_UPDATED">Driver Status</option>
                        <option value="DRIVER_VEHICLE_ASSIGNED">Vehicle Assigned</option>
                        <option value="VEHICLE_CREATED">Vehicle Created</option>
                      </select>
                    </div>

                    {/* Rows Per Page */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Rows:</span>
                      <select
                        value={auditLimit}
                        onChange={(e) => handleAuditFilterChange('limit', e.target.value)}
                        className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>

                    {(auditSearch || auditActionFilter !== 'ALL') && (
                      <button
                        onClick={resetAuditFilters}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Range & Status Summary */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
                  <span>
                    Showing <strong className="text-slate-800">
                      {auditPagination.total === 0 ? 0 : (auditPagination.page - 1) * auditPagination.limit + 1}
                    </strong> – <strong className="text-slate-800">
                      {Math.min(auditPagination.page * auditPagination.limit, auditPagination.total)}
                    </strong> of <strong className="text-slate-800">{auditPagination.total}</strong> records
                    {auditSearch && <span> matching "<strong className="text-slate-900">{auditSearch}</strong>"</span>}
                  </span>

                  {auditLoading && (
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Updating list...
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-y border-slate-100">
                      <tr>
                        <th className="py-3 px-3">Timestamp</th>
                        <th className="py-3 px-3">Action</th>
                        <th className="py-3 px-3">Entity Type</th>
                        <th className="py-3 px-3">Admin / Actor</th>
                        <th className="py-3 px-3">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 text-slate-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 font-mono">
                            {log.action}
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-semibold">{log.entityType}</td>
                          <td className="py-3 px-3 font-medium text-slate-800">
                            {log.user ? `${log.user.username} (${log.user.role})` : 'System'}
                          </td>
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px] max-w-xs truncate">
                            {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                          </td>
                        </tr>
                      ))}

                      {auditLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center">
                            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-700">No audit logs found</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {auditSearch || auditActionFilter !== 'ALL'
                                ? 'No audit records match your current filter parameters.'
                                : 'No administrative actions recorded yet.'}
                            </p>
                            {(auditSearch || auditActionFilter !== 'ALL') && (
                              <button
                                onClick={resetAuditFilters}
                                className="mt-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                              >
                                Reset Filters
                              </button>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Audit Pagination Controls */}
                {auditPagination.pages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500 font-medium">
                      Page <strong className="text-slate-900">{auditPagination.page}</strong> of{' '}
                      <strong className="text-slate-900">{auditPagination.pages}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAuditPageChange(auditPage - 1)}
                        disabled={auditPage <= 1 || auditLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, auditPagination.pages) }, (_, i) => {
                          let p = i + 1;
                          if (auditPagination.pages > 5) {
                            if (auditPage > 3) {
                              p = auditPage - 2 + i;
                            }
                            if (p + (4 - i) > auditPagination.pages) {
                              p = auditPagination.pages - 4 + i;
                            }
                          }
                          if (p < 1 || p > auditPagination.pages) return null;

                          return (
                            <button
                              key={p}
                              onClick={() => handleAuditPageChange(p)}
                              disabled={auditLoading}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors ${
                                p === auditPage
                                  ? 'bg-slate-900 text-white shadow-sm'
                                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handleAuditPageChange(auditPage + 1)}
                        disabled={auditPage >= auditPagination.pages || auditLoading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Powered by TechspaceNG Footer */}
      <footer className="w-full py-5 px-6 text-center text-xs text-slate-500 border-t border-slate-200 mt-auto bg-white/80">
        <p className="font-semibold text-slate-700">
          Federal College of Education (Technical) Bichi &bull; Campus Keke Service &copy; {new Date().getFullYear()}
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Powered by <strong className="text-slate-800 font-bold">TechspaceNG</strong> &bull; Email:{' '}
          <a href="mailto:info@techspacen.com.ng" className="text-emerald-700 hover:underline font-semibold">
            info@techspacen.com.ng
          </a>{' '}
          &bull; Website:{' '}
          <a
            href="https://www.techspacen.com.ng"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 hover:underline font-semibold"
          >
            www.techspacen.com.ng
          </a>
        </p>
      </footer>

      {/* MODAL 1: SELL TICKET */}
      {showCreateSaleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Record Offline Ticket Sale</h3>
              <button onClick={() => setShowCreateSaleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Rides</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={saleForm.totalRides}
                    onChange={(e) =>
                      setSaleForm({
                        ...saleForm,
                        totalRides: Number(e.target.value),
                        amount: Number(e.target.value) * 150,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount (₦)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={saleForm.amount}
                    onChange={(e) => setSaleForm({ ...saleForm, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                <select
                  value={saleForm.paymentMethod}
                  onChange={(e) => setSaleForm({ ...saleForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-semibold"
                >
                  <option value="CASH">Cash (Hand-to-Hand)</option>
                  <option value="POS">POS Terminal Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Buyer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Ade"
                  value={saleForm.buyerName}
                  onChange={(e) => setSaleForm({ ...saleForm, buyerName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Buyer Reg No.</label>
                  <input
                    type="text"
                    placeholder="REG/2024/..."
                    value={saleForm.buyerRegNumber}
                    onChange={(e) => setSaleForm({ ...saleForm, buyerRegNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Buyer Phone</label>
                  <input
                    type="tel"
                    placeholder="080..."
                    value={saleForm.buyerPhone}
                    onChange={(e) => setSaleForm({ ...saleForm, buyerPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Receipt / Payment Ref</label>
                <input
                  type="text"
                  placeholder="e.g. POS-AUTH-9921 or Cash receipt #"
                  value={saleForm.paymentReference}
                  onChange={(e) => setSaleForm({ ...saleForm, paymentReference: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateSaleModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700"
                >
                  Confirm Sale & Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REFILL TICKET (SEARCH-BASED WITH PERSON DETAILS) */}
      {showRefillModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Refill Ticket Balance</h3>
                <p className="text-xs text-slate-500">Search student ticket or driver code to view details and add rides</p>
              </div>
              <button
                onClick={() => {
                  setShowRefillModal(false);
                  setSearchedTicket(null);
                  setSearchError(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRefillSubmit} className="space-y-4">
              {/* 1. Ticket Search Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Search Ticket ID / Driver Code *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="e.g. CKK-2026-EXH-001 or DRV-101"
                      value={refillSearchQuery}
                      onChange={(e) => {
                        setRefillSearchQuery(e.target.value);
                        if (searchedTicket && searchedTicket.ticketNumber !== e.target.value.trim().toUpperCase()) {
                          setSearchedTicket(null);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          lookupTicketForRefill(refillSearchQuery);
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm font-mono uppercase font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => lookupTicketForRefill(refillSearchQuery)}
                    disabled={searchingTicket || !refillSearchQuery.trim()}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                  >
                    {searchingTicket ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Find Ticket</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Driver Emergency Float Quick Select Chips */}
                {drivers.some((d) => d.emergencyTickets && d.emergencyTickets.length > 0) && (
                  <div className="mt-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Quick-Select Driver Float Pass:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {drivers.flatMap((d) =>
                        (d.emergencyTickets || []).map((et: any) => (
                          <button
                            key={et.id}
                            type="button"
                            onClick={() => openRefillModalForTicket({ ...et, driver: d })}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors"
                          >
                            <span className="font-mono font-bold text-slate-900">{d.driverCode}</span>
                            <span className="text-[10px] text-slate-500">({d.fullName})</span>
                            <span className={`text-[10px] font-bold ${et.remainingRides === 0 ? 'text-rose-600' : et.remainingRides < 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                              [{et.remainingRides} rides]
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {searchError && (
                  <p className="mt-2 text-xs font-semibold text-rose-600 flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{searchError}</span>
                  </p>
                )}
              </div>

              {/* 2. Person & Ticket Details Card */}
              {searchedTicket ? (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Verified Ticket Pass
                      </span>
                      <p className="font-mono font-black text-sm text-slate-900">
                        {searchedTicket.ticketNumber}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        searchedTicket.status === 'EXHAUSTED' || searchedTicket.remainingRides === 0
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : searchedTicket.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {searchedTicket.remainingRides === 0 ? 'EXHAUSTED (0 RIDES)' : searchedTicket.status}
                    </span>
                  </div>

                  {/* Person Details */}
                  <div className="pt-2 border-t border-emerald-200/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Passenger / Owner Information
                    </p>
                    {searchedTicket.student ? (
                      <div className="grid grid-cols-2 gap-2 text-xs bg-white/70 p-3 rounded-xl border border-emerald-100">
                        <div>
                          <p className="text-[10px] text-slate-500">Student Name</p>
                          <p className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{searchedTicket.student.fullName}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">Reg Number</p>
                          <p className="font-mono font-bold text-slate-800 mt-0.5">
                            {searchedTicket.student.regNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">Phone</p>
                          <p className="text-slate-700 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{searchedTicket.student.phone || 'N/A'}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500">Current Balance</p>
                          <p className="font-black text-emerald-700 mt-0.5">
                            {searchedTicket.remainingRides} rides left ({searchedTicket.usedRides} used)
                          </p>
                        </div>
                      </div>
                    ) : searchedTicket.driver ? (
                      <div className="text-xs bg-white/70 p-3 rounded-xl border border-emerald-100">
                        <p className="text-[10px] text-slate-500">Authorized Driver Pass</p>
                        <p className="font-bold text-slate-900">
                          {searchedTicket.driver.fullName} ({searchedTicket.driver.driverCode})
                        </p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Emergency Credit Source • {searchedTicket.remainingRides} rides left
                        </p>
                      </div>
                    ) : (
                      <div className="text-xs text-blue-800 bg-blue-50/80 p-3 rounded-xl border border-blue-200">
                        <p className="font-bold">Unassigned Ticket</p>
                        <p className="text-[11px] text-blue-700 mt-0.5">
                          This ticket has not yet been assigned to a student account. Current rides: {searchedTicket.remainingRides}.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                  <p className="text-xs text-slate-500">
                    Enter the Ticket ID or Driver Code above and click <span className="font-bold text-slate-700">Find Ticket</span> to view details and add rides.
                  </p>
                </div>
              )}

              {/* 3. Refill Fields (Active once ticket is found) */}
              <div className={`space-y-4 pt-1 transition-opacity ${searchedTicket ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Rides to Add *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      required
                      disabled={!searchedTicket}
                      value={refillForm.ridesToAdd}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setRefillForm({
                          ...refillForm,
                          ridesToAdd: val,
                          amountPaid: val * 150,
                        });
                      }}
                      className="w-full px-3 py-2 border rounded-xl text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    {searchedTicket && (
                      <p className="text-[10px] text-slate-500 mt-1">
                        New balance: <span className="font-bold text-slate-900">{searchedTicket.remainingRides + Number(refillForm.ridesToAdd || 0)} rides</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Amount Paid (₦) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      disabled={!searchedTicket}
                      value={refillForm.amountPaid}
                      onChange={(e) => setRefillForm({ ...refillForm, amountPaid: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">₦150 per standard ride</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Method</label>
                    <select
                      disabled={!searchedTicket}
                      value={refillForm.paymentMethod}
                      onChange={(e) => setRefillForm({ ...refillForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="CASH">Cash (Hand-to-Hand)</option>
                      <option value="POS">POS Terminal Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Payment Reference</label>
                    <input
                      type="text"
                      disabled={!searchedTicket}
                      placeholder="Receipt / POS Ref"
                      value={refillForm.paymentReference}
                      onChange={(e) => setRefillForm({ ...refillForm, paymentReference: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Description</label>
                  <input
                    type="text"
                    disabled={!searchedTicket}
                    placeholder="e.g. In-person desk top-up"
                    value={refillForm.notes}
                    onChange={(e) => setRefillForm({ ...refillForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* 4. Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefillModal(false);
                    setSearchedTicket(null);
                    setSearchError(null);
                  }}
                  className="w-1/2 py-2.5 rounded-xl border text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!searchedTicket || submittingRefill}
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  {submittingRefill ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Confirm Refill & Reactivate</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREATE DRIVER */}
      {showCreateDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Add New Campus Driver</h3>
              <button onClick={() => setShowCreateDriverModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDriverSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Driver Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DRV-103"
                    value={driverForm.driverCode}
                    onChange={(e) => setDriverForm({ ...driverForm, driverCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Yakubu Danladi"
                    value={driverForm.fullName}
                    onChange={(e) => setDriverForm({ ...driverForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="080..."
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">License Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="LIC-..."
                    value={driverForm.licenseNumber}
                    onChange={(e) => setDriverForm({ ...driverForm, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Assign Keke Vehicle</label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateDriverModal(false);
                      setShowCreateVehicleModal(true);
                    }}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 underline"
                  >
                    + Register New Keke
                  </button>
                </div>
                <select
                  value={driverForm.assignedVehicleId}
                  onChange={(e) => setDriverForm({ ...driverForm, assignedVehicleId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                >
                  <option value="">-- Assign Later --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.kekeNumber} ({v.plateNumber}) {v.drivers?.length ? `• Assigned to ${v.drivers[0].driverCode}` : '• Available'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Default Password</label>
                <input
                  type="text"
                  required
                  value={driverForm.password}
                  onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateDriverModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700"
                >
                  Create Driver Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREATE VEHICLE */}
      {showCreateVehicleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Register New Keke</h3>
              <button onClick={() => setShowCreateVehicleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVehicleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Keke Unit Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KEKE-03"
                  value={vehicleForm.kekeNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, kekeNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Plate Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KKE-03-EF"
                  value={vehicleForm.plateNumber}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, plateNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-mono uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Model</label>
                <input
                  type="text"
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateVehicleModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md hover:bg-emerald-700"
                >
                  Register Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: VIEW / PRINT QR CODE */}
      {selectedTicketForQr && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Official Ticket Pass
              </span>
              <button
                onClick={() => setSelectedTicketForQr(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-lg font-black font-mono text-slate-900 mb-1">
              {selectedTicketForQr.ticketNumber}
            </p>
            <p className="text-xs text-slate-500 mb-4">
              {selectedTicketForQr.remainingRides} rides remaining • {selectedTicketForQr.status}
            </p>

            <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 inline-block shadow-inner mb-4">
              <QRCodeSVG
                value={selectedTicketForQr.qrPayload}
                size={220}
                level="H"
                includeMargin={false}
              />
            </div>

            {selectedTicketForQr.student && (
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 mb-4 text-left">
                <p>
                  <strong>Owner:</strong> {selectedTicketForQr.student.fullName}
                </p>
                <p>
                  <strong>Reg No:</strong> {selectedTicketForQr.student.regNumber}
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedTicketForQr(null)}
              className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DRIVER */}
      {showEditDriverModal && editingDriver && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Driver Details</h3>
                <p className="text-xs text-slate-500">Update profile for {editingDriver.driverCode}</p>
              </div>
              <button
                onClick={() => {
                  setShowEditDriverModal(false);
                  setEditingDriver(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditDriverSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Driver Code *</label>
                  <input
                    type="text"
                    required
                    value={editDriverForm.driverCode}
                    onChange={(e) => setEditDriverForm({ ...editDriverForm, driverCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editDriverForm.fullName}
                    onChange={(e) => setEditDriverForm({ ...editDriverForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editDriverForm.phone}
                    onChange={(e) => setEditDriverForm({ ...editDriverForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">License Number *</label>
                  <input
                    type="text"
                    required
                    value={editDriverForm.licenseNumber}
                    onChange={(e) => setEditDriverForm({ ...editDriverForm, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={editDriverForm.status}
                    onChange={(e) => setEditDriverForm({ ...editDriverForm, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Assigned Keke</label>
                  <select
                    value={editDriverForm.assignedVehicleId}
                    onChange={(e) => setEditDriverForm({ ...editDriverForm, assignedVehicleId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  >
                    <option value="">-- No Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.kekeNumber} ({v.plateNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reset Password <span className="text-slate-400 font-normal lowercase">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter new password (optional)"
                  value={editDriverForm.password}
                  onChange={(e) => setEditDriverForm({ ...editDriverForm, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditDriverModal(false);
                    setEditingDriver(null);
                  }}
                  className="w-1/2 py-2.5 rounded-xl border text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEditDriver}
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {submittingEditDriver ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STUDENT */}
      {showEditStudentModal && editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Student Details</h3>
                <p className="text-xs text-slate-500">Update registration for {editingStudent.regNumber}</p>
              </div>
              <button
                onClick={() => {
                  setShowEditStudentModal(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Registration / Matric Number *</label>
                <input
                  type="text"
                  required
                  value={editStudentForm.regNumber}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, regNumber: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editStudentForm.fullName}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={editStudentForm.phone}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reset Password <span className="text-slate-400 font-normal lowercase">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter new password (optional)"
                  value={editStudentForm.password}
                  onChange={(e) => setEditStudentForm({ ...editStudentForm, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditStudentModal(false);
                    setEditingStudent(null);
                  }}
                  className="w-1/2 py-2.5 rounded-xl border text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEditStudent}
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {submittingEditStudent ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRINT TICKET SLIP / RECEIPT */}
      {ticketToPrint && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 my-8">
            {/* Modal Controls (Hidden during print) */}
            <div className="no-print flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Print Transit Ticket</h3>
              </div>
              <button
                onClick={() => setTicketToPrint(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Area */}
            <div
              id="printable-ticket"
              className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center text-slate-900"
            >
              {/* Institution Header */}
              <div className="border-b-2 border-dashed border-slate-200 pb-3 mb-3">
                <div className="w-12 h-12 mx-auto mb-1 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-sm">
                  FCET
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Federal College of Education (Tech) Bichi
                </h4>
                <p className="text-[10px] uppercase font-bold text-emerald-700 tracking-wide mt-0.5">
                  Campus Keke Transit Shuttle • Official Pass
                </p>
              </div>

              {/* Ticket Identifier */}
              <div className="mb-3">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Ticket Number</div>
                <div className="text-base font-mono font-black text-slate-900 tracking-wider">
                  {ticketToPrint.ticket.ticketNumber}
                </div>
                <div className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                  {ticketToPrint.ticket.status} • {ticketToPrint.ticket.remainingRides} of {ticketToPrint.ticket.totalRides} Rides Left
                </div>
              </div>

              {/* QR Code */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl inline-block shadow-sm mb-3">
                <QRCodeSVG
                  value={ticketToPrint.ticket.qrPayload || ticketToPrint.ticket.ticketNumber}
                  size={190}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Passenger & Purchase Breakdown */}
              <div className="text-left bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100 mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Passenger:</span>
                  <span className="font-bold text-slate-900">
                    {ticketToPrint.sale?.buyerName || ticketToPrint.ticket.student?.fullName || 'Campus Commuter'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Reg / Matric #:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {ticketToPrint.sale?.buyerRegNumber || ticketToPrint.ticket.student?.regNumber || 'Walk-in'}
                  </span>
                </div>
                {(ticketToPrint.sale?.buyerPhone || ticketToPrint.ticket.student?.phone) && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Phone:</span>
                    <span className="text-slate-700 font-medium">
                      {ticketToPrint.sale?.buyerPhone || ticketToPrint.ticket.student?.phone}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Amount Paid:</span>
                  <span className="font-bold text-emerald-700">
                    ₦{(ticketToPrint.sale?.amount ?? ticketToPrint.ticket.totalRides * 150).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Payment Mode:</span>
                  <span className="font-semibold text-slate-700">
                    {ticketToPrint.sale?.paymentMethod || 'CASH'}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                  <span>Issued Date:</span>
                  <span>
                    {new Date(ticketToPrint.sale?.soldAt || ticketToPrint.ticket.createdAt || Date.now()).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Instructions */}
              <p className="text-[9px] text-slate-400 uppercase font-semibold tracking-wider">
                Present this QR code to the driver upon boarding • Non-transferable
              </p>
            </div>

            {/* Print Action Buttons (Hidden during print) */}
            <div className="no-print flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setTicketToPrint(null)}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Print Ticket / Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-ticket,
          #printable-ticket * {
            visibility: visible !important;
          }
          #printable-ticket {
            position: fixed !important;
            left: 50% !important;
            top: 20px !important;
            transform: translateX(-50%) !important;
            width: 320px !important;
            margin: 0 !important;
            padding: 16px !important;
            box-shadow: none !important;
            border: 2px dashed #000 !important;
            background: #fff !important;
            color: #000 !important;
            z-index: 99999 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
