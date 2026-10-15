'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setTokens } from '@/lib/api';
import { saveUserSession } from '@/lib/auth';
import {
  Ticket,
  User,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [regNumber, setRegNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [ticketId, setTicketId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!ticketId.trim()) {
      setError('Ticket ID is required to register. Purchase your ticket from an admin first.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await api.post('/auth/register', {
        regNumber: regNumber.trim().toUpperCase(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        ticketId: ticketId.trim().toUpperCase(),
        password,
      });

      const { user, student, accessToken, refreshToken } = res.data;
      setTokens(accessToken, refreshToken);
      saveUserSession({
        id: user.id,
        username: user.username,
        role: 'STUDENT',
        student,
      });

      router.push('/student/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your Ticket ID and details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-1.5 mb-3 group">
            <img
              src="/logo.png"
              alt="Federal College of Education (Technical) Bichi Logo"
              className="w-18 h-18 object-contain mx-auto drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 bg-slate-100/95 border border-slate-300/80 px-3.5 py-1 rounded-full mt-1 shadow-xs">
              Federal College of Education (Technical) Bichi
            </span>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Claim Your Ticket
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Activate your admin-issued ticket & create student profile
          </p>
        </div>

        {/* Notice on Ticket Requirement */}
        <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs leading-relaxed flex items-start gap-2.5 shadow-sm">
          <HelpCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
          <div>
            <span className="font-bold">Required Ticket Notice:</span> You must have purchased an official Campus Keke ticket from an admin desk before creating an account. Self-registration without a valid ticket is not permitted.
          </div>
        </div>

        {/* Form Card */}
        <div className="mt-4 bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-3xl sm:px-10">
          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Ticket ID */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Admin Ticket ID *
                </label>
              </div>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Ticket className="h-4 h-4 text-emerald-600" />
                </div>
                <input
                  type="text"
                  required
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  placeholder="e.g. CKK-2026-A1B2-C3D4"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm uppercase font-semibold"
                />
              </div>
            </div>

            {/* Registration Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Student Reg. Number *
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="e.g. REG/2024/00123"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium uppercase"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Chukwuma Obi"
                className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number *
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Create Password *
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 transition-all duration-150"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Activate Ticket & Register</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Existing account link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Already claimed your ticket?{' '}
              <Link
                href="/login"
                className="font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">
            Federal College of Education (Technical) Bichi &bull; Campus Keke Service &copy; {new Date().getFullYear()}
          </p>
          <p className="text-[11px] text-slate-500">
            Powered by <strong className="text-slate-800">TechspaceNG</strong> &bull; Email:{' '}
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
    </div>
  );
}
