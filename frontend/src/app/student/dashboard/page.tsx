'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getUserSession, logout } from '@/lib/auth';
import { QRCodeSVG } from 'qrcode.react';
import {
  Ticket,
  LogOut,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Car,
  User,
} from 'lucide-react';

interface StudentData {
  student: {
    id: string;
    fullName: string;
    regNumber: string;
    phone: string;
  };
  ticket: {
    id: string;
    ticketNumber: string;
    status: string;
    totalRides: number;
    usedRides: number;
    remainingRides: number;
    createdAt: string;
    qrPayload: string;
    qrDataUrl?: string;
  } | null;
  recentRides: Array<{
    id: string;
    transactionNumber: string;
    timestamp: string;
    validationMethod: string;
    driver?: { fullName: string; driverCode: string };
    vehicle?: { kekeNumber: string; plateNumber: string };
  }>;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await api.get('/student/dashboard');
      setData(res.data);
    } catch (err: any) {
      if (err.statusCode === 401 || err.statusCode === 403) {
        logout();
      } else {
        setError(err.message || 'Failed to load ticket details.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const session = getUserSession();
    if (!session || session.role !== 'STUDENT') {
      router.push('/login');
      return;
    }
    fetchDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading your ticket...</p>
      </div>
    );
  }

  const ticket = data?.ticket;
  const isExhausted = ticket?.remainingRides === 0 || ticket?.status === 'EXHAUSTED';

  return (
    <div className="min-h-screen bg-slate-100/60 pb-12">
      {/* Top Mobile-First Header */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200/80 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Federal College of Education (Technical) Bichi Logo"
              className="w-9 h-9 object-contain bg-white rounded-xl p-0.5 shadow-sm shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-black text-slate-900 leading-tight">CAMPUS KEKE</h1>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                  Student
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500">
                FCE(T) Bichi &bull; {data?.student.regNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDashboard(true)}
              disabled={refreshing}
              title="Refresh Balance"
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors active:scale-95"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {error}
          </div>
        )}

        {/* Student Welcome Pill */}
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
              {data?.student.fullName.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">{data?.student.fullName}</p>
              <p className="text-[11px] text-slate-500 font-medium">{data?.student.phone}</p>
            </div>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            Student
          </span>
        </div>

        {ticket ? (
          <>
            {/* Primary Pass / Ticket Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
                    Official Student Pass
                  </span>
                  <p className="text-base font-black tracking-wider font-mono">
                    {ticket.ticketNumber}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isExhausted
                        ? 'bg-amber-400 text-amber-950'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>
              </div>

              {/* QR Code Presentation Box */}
              <div className="p-6 flex flex-col items-center text-center bg-white">
                <p className="text-xs font-semibold text-slate-500 mb-3">
                  Present this QR code to the driver upon boarding
                </p>

                <div className={`p-4 rounded-3xl bg-white border-2 shadow-inner transition-all ${
                  isExhausted ? 'border-amber-300 opacity-60' : 'border-emerald-500/40 shadow-emerald-500/10'
                }`}>
                  <QRCodeSVG
                    value={ticket.qrPayload}
                    size={210}
                    level="H"
                    includeMargin={false}
                    className="rounded-xl"
                  />
                </div>

                {isExhausted && (
                  <div className="mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 text-left">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                    <span>
                      <strong>0 Rides Remaining:</strong> Please visit campus transport admin desk to refill your pass.
                    </span>
                  </div>
                )}
              </div>

              {/* Rides Counters */}
              <div className="grid grid-cols-3 border-t border-slate-100 bg-slate-50/70 divide-x divide-slate-100 text-center py-4 px-2">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining</p>
                  <p className={`text-2xl font-black ${isExhausted ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {ticket.remainingRides}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Used</p>
                  <p className="text-2xl font-black text-slate-800">
                    {ticket.usedRides}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                  <p className="text-2xl font-black text-slate-800">
                    {ticket.totalRides}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Trips Section */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Recent Trips
                </h3>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {data?.recentRides.length || 0} rides recorded
                </span>
              </div>

              {data?.recentRides && data.recentRides.length > 0 ? (
                <div className="space-y-2.5">
                  {data.recentRides.map((ride) => (
                    <div
                      key={ride.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Car className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {ride.vehicle?.kekeNumber || 'Campus Keke'}
                            {ride.driver && (
                              <span className="font-normal text-slate-500 ml-1">
                                • {ride.driver.fullName}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(ride.timestamp).toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </p>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-emerald-600 shrink-0">
                        -1 ride
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No trips recorded yet. Ready for your first ride!
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">No Active Ticket Found</h3>
            <p className="text-xs text-slate-500 mb-4">
              Please contact the campus transportation admin desk to get a valid ticket assigned to your registration number.
            </p>
          </div>
        )}
      </main>

      {/* Powered by TechspaceNG Footer */}
      <footer className="max-w-md mx-auto px-4 pt-6 pb-2 text-center text-xs text-slate-500 space-y-1">
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
    </div>
  );
}
