'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserSession, logout } from '@/lib/auth';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Keyboard,
  LogOut,
  RefreshCw,
  Car,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldAlert,
  Zap,
  ArrowRight,
  User,
} from 'lucide-react';

interface DriverData {
  driver: {
    id: string;
    driverCode: string;
    fullName: string;
    phone: string;
    status: string;
  };
  vehicle: {
    id: string;
    plateNumber: string;
    kekeNumber: string;
    model: string;
  } | null;
  emergencyTicket: {
    id: string;
    ticketNumber: string;
    remainingRides: number;
    status: string;
  } | null;
  stats: {
    todayRidesCount: number;
  };
  recentTransactions: Array<{
    id: string;
    transactionNumber: string;
    timestamp: string;
    deductedRides: number;
    remainingRidesAfter: number;
    validationMethod: string;
    rideSource: string;
    student?: { fullName: string; regNumber: string };
    ticket?: { ticketNumber: string };
  }>;
}

export default function DriverDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DriverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Manual entry modal state
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualTicketInput, setManualTicketInput] = useState('');
  const [useEmergencyCredit, setUseEmergencyCredit] = useState(false);
  const [validating, setValidating] = useState(false);

  // Result notification modal
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Sound feedback
  const playSound = (type: 'success' | 'error') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // Audio context might be restricted
    }
  };

  const fetchDashboard = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setActionError(null);

      const res = await api.get('/driver/dashboard');
      setData(res.data);
    } catch (err: any) {
      if (err.statusCode === 401 || err.statusCode === 403) {
        logout();
      } else {
        setActionError(err.message || 'Failed to fetch driver data.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const session = getUserSession();
    if (!session || session.role !== 'DRIVER') {
      router.push('/login');
      return;
    }
    fetchDashboard();
  }, [router]);

  // Core unified validation caller
  const submitValidation = async (ticketInput: string, method: 'QR_SCAN' | 'MANUAL_ENTRY') => {
    try {
      setValidating(true);
      setActionError(null);

      const idempotencyKey = `ride-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const res = await api.post('/driver/validate-ride', {
        ticketInput,
        validationMethod: method,
        idempotencyKey,
        useDriverEmergencyCredit: useEmergencyCredit,
      });

      playSound('success');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      setValidationResult(res.data);
      setIsScannerOpen(false);
      setIsManualOpen(false);
      setManualTicketInput('');
      setUseEmergencyCredit(false);

      // Refresh stats
      fetchDashboard(true);
    } catch (err: any) {
      playSound('error');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(300);
      }
      setActionError(err.message || 'Ride validation failed.');
    } finally {
      setValidating(false);
    }
  };

  // QR Scanner lifecycle
  const startScanner = async () => {
    setIsScannerOpen(true);
    setScannerLoading(true);
    setScannerError(null);

    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode('qr-reader-container');
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            // Stop scanning once detected
            await stopScanner();
            submitValidation(decodedText, 'QR_SCAN');
          },
          () => {
            // Ignore scan parse frame misses
          }
        );
        setScannerLoading(false);
      } catch (err: any) {
        setScannerLoading(false);
        setScannerError(
          'Could not start camera. Please check camera permissions or use manual Ticket ID entry.'
        );
      }
    }, 300);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch {
        // Ignore
      }
      html5QrCodeRef.current = null;
    }
    setIsScannerOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading driver portal...</p>
      </div>
    );
  }

  const driver = data?.driver;
  const vehicle = data?.vehicle;
  const emergencyTicket = data?.emergencyTicket;

  return (
    <div className="min-h-screen bg-slate-100/70 pb-16">
      {/* Driver Header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Federal College of Education (Technical) Bichi Logo"
              className="w-10 h-10 object-contain bg-white rounded-xl p-0.5 shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black text-slate-900 leading-tight">
                  {driver?.driverCode}
                </h1>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                  Campus Keke
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500">
                FCE(T) Bichi &bull; {driver?.fullName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={logout}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Error notification banner */}
        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Validation Error</p>
              <p className="mt-0.5">{actionError}</p>
            </div>
            <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Driver & Assigned Vehicle Information Card */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Vehicle Assignment
              </span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                driver?.status === 'ACTIVE'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              Driver {driver?.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Keke Number
              </p>
              <p className="text-base font-black text-slate-900 font-mono">
                {vehicle?.kekeNumber || 'Unassigned'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Plate Number
              </p>
              <p className="text-sm font-bold text-slate-700 font-mono">
                {vehicle?.plateNumber || 'N/A'}
              </p>
            </div>
          </div>

          {/* Emergency Credit Status */}
          {emergencyTicket && (
            <div className="mt-3.5 p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <p className="text-[11px] font-bold text-amber-900">
                    Emergency Ride Credit
                  </p>
                  <p className="text-[10px] text-amber-700 font-mono">
                    {emergencyTicket.ticketNumber}
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-xl">
                {emergencyTicket.remainingRides} rides left
              </span>
            </div>
          )}
        </div>

        {/* Primary Ride Action Buttons */}
        <div className="space-y-3">
          {/* Prominent Scan Ticket Button */}
          <button
            onClick={startScanner}
            disabled={driver?.status !== 'ACTIVE'}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-3xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-lg shadow-emerald-600/25 font-bold text-base transition-all duration-150 disabled:opacity-50"
          >
            <QrCode className="w-6 h-6" />
            <span>SCAN TICKET</span>
          </button>

          {/* Manual Entry Fallback Button */}
          <button
            onClick={() => setIsManualOpen(true)}
            disabled={driver?.status !== 'ACTIVE'}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-3xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-sm shadow-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
          >
            <Keyboard className="w-4 h-4 text-slate-500" />
            <span>ENTER TICKET ID</span>
          </button>
        </div>

        {/* Today's Rides Counter Summary */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Today's Completed Rides
            </p>
            <p className="text-3xl font-black text-slate-900 mt-0.5">
              {data?.stats.todayRidesCount || 0}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Recent Transactions Feed */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>Recent Validations Today</span>
            <span className="text-[11px] text-slate-400 font-semibold font-mono">
              {data?.recentTransactions.length || 0} entries
            </span>
          </h3>

          {data?.recentTransactions && data.recentTransactions.length > 0 ? (
            <div className="space-y-2.5">
              {data.recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                      OK
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {tx.student?.fullName || 'Student Ride'}
                        {tx.student && (
                          <span className="text-slate-500 font-normal ml-1">
                            ({tx.student.regNumber})
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {tx.transactionNumber} • {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {tx.rideSource === 'DRIVER_EMERGENCY_TICKET' && (
                          <span className="text-amber-600 font-semibold ml-1">
                            [Emergency Credit]
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="font-bold text-emerald-600 shrink-0">
                    -1 ride
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs">
              No rides validated yet today.
            </div>
          )}
        </div>
      </main>

      {/* Powered by TechspaceNG Footer */}
      <footer className="max-w-md mx-auto px-4 pt-8 pb-4 text-center text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">
          Federal College of Education (Technical) Bichi &bull; Campus Keke Service &copy; {new Date().getFullYear()}
        </p>
        <p className="text-[11px] text-slate-500">
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

      {/* QR Scanner Modal Overlay */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                Scan Student QR Code
              </span>
              <button
                onClick={stopScanner}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex flex-col items-center">
              {scannerLoading && (
                <div className="py-12 flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">Starting camera...</p>
                </div>
              )}

              {scannerError && (
                <div className="p-4 my-4 rounded-2xl bg-rose-50 text-rose-800 text-xs text-center border border-rose-200">
                  <p>{scannerError}</p>
                  <button
                    onClick={() => {
                      stopScanner();
                      setIsManualOpen(true);
                    }}
                    className="mt-3 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs"
                  >
                    Use Manual Entry Instead
                  </button>
                </div>
              )}

              <div id="qr-reader-container" className="w-full rounded-2xl overflow-hidden" />

              <p className="text-[11px] text-slate-400 text-center mt-3">
                Align student QR code within the viewfinder
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Ticket ID Fallback Modal */}
      {isManualOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Keyboard className="w-4 h-4 text-emerald-600" />
                Manual Ticket Entry
              </h3>
              <button
                onClick={() => setIsManualOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!manualTicketInput.trim() && !useEmergencyCredit) return;
                submitValidation(manualTicketInput.trim(), 'MANUAL_ENTRY');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Student Ticket ID
                </label>
                <input
                  type="text"
                  value={manualTicketInput}
                  onChange={(e) => setManualTicketInput(e.target.value)}
                  placeholder="e.g. CKK-2026-STUD-001"
                  disabled={useEmergencyCredit}
                  className="block w-full px-3.5 py-3 border border-slate-300 rounded-2xl font-mono text-sm uppercase font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Emergency Driver Ticket Toggle */}
              {emergencyTicket && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useEmergencyCredit}
                      onChange={(e) => setUseEmergencyCredit(e.target.checked)}
                      className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-amber-900 block">
                        Fund via Driver Emergency Credit
                      </span>
                      <span className="text-[11px] text-amber-700 block mt-0.5 leading-tight">
                        Use this if student has no remaining rides. Uses 1 credit from your driver emergency pass ({emergencyTicket.remainingRides} left).
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsManualOpen(false)}
                  className="w-1/2 py-3 rounded-2xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={validating || (!manualTicketInput && !useEmergencyCredit)}
                  className="w-1/2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {validating ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Activate Ride</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ride Confirmation Result Modal */}
      {validationResult && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center border-2 border-emerald-500">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Ride Activated!
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4 font-mono">
              Txn: {validationResult.transaction.transactionNumber}
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 border border-slate-100 text-xs mb-4">
              {validationResult.student && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-bold text-slate-900">
                    {validationResult.student.fullName} ({validationResult.student.regNumber})
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Ticket ID:</span>
                <span className="font-mono font-bold text-slate-900">
                  {validationResult.ticket.ticketNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ride Deducted:</span>
                <span className="font-bold text-emerald-600">-1 Ride</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-2 font-bold">
                <span className="text-slate-700">Remaining Balance:</span>
                <span className="text-emerald-700 font-mono text-sm">
                  {validationResult.ticket.remainingRides} rides
                </span>
              </div>
            </div>

            <button
              onClick={() => setValidationResult(null)}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md transition-colors"
            >
              Done & Ready for Next Passenger
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
