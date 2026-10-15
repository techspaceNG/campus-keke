'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setTokens } from '@/lib/api';
import { saveUserSession } from '@/lib/auth';
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your identifier and password');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await api.post('/auth/login', {
        identifier: identifier.trim(),
        password,
      });

      const { user, student, driver, accessToken, refreshToken } = res.data;
      setTokens(accessToken, refreshToken);
      saveUserSession({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        student,
        driver,
      });

      // Role-based redirect
      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (user.role === 'DRIVER') {
        router.push('/driver/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-1.5 mb-3 group">
            <img
              src="/logo.png"
              alt="Federal College of Education (Technical) Bichi Logo"
              className="w-20 h-20 object-contain mx-auto drop-shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 bg-slate-100/95 border border-slate-300/80 px-3.5 py-1 rounded-full mt-1 shadow-xs">
              Federal College of Education (Technical) Bichi
            </span>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Campus Keke Service
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 font-medium">
            Student &bull; Driver &bull; Admin Sign In
          </p>
        </div>

        {/* Card */}
        <div className="mt-8 bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-3xl sm:px-10">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Reg No. / Driver Code / Username
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. ADMIN or your Reg No."
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-5 h-5" /> : <Eye className="h-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-60 transition-all duration-150"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Purchased your first ticket from an admin?{' '}
              <Link
                href="/register"
                className="font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 inline-flex items-center gap-0.5"
              >
                Register here
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
