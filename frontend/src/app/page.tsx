'use client';

import Link from 'next/link';
import { ArrowRight, Ticket, ShieldCheck, QrCode } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-6 bg-gradient-to-b from-emerald-50/50 via-white to-slate-50">
      {/* Top action link (Removed official campus transit badge) */}
      <div className="w-full max-w-md flex justify-end items-center pt-2">
        <Link
          href="/register"
          className="text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-1 group py-1 px-3 rounded-full hover:bg-slate-100"
        >
          <span>Claim Ticket Pass</span>
          <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
        </Link>
      </div>

      {/* Centered Brand Content */}
      <div className="w-full max-w-md my-auto flex flex-col items-center text-center px-4 py-8">
        {/* Official School Crest Logo */}
        <div className="mb-4 relative group">
          <img
            src="/logo.png"
            alt="Federal College of Education (Technical) Bichi Logo"
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain mx-auto drop-shadow-md group-hover:scale-105 transition-transform duration-200"
          />
        </div>

        {/* Animated School Name - Clean academic styling without neon green */}
        <div className="mb-3 animate-school-float">
          <span className="inline-block text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-slate-800 bg-slate-100/95 border border-slate-300/80 px-4 py-1.5 rounded-full shadow-sm hover:border-slate-400 transition-all">
            Federal College of Education (Technical) Bichi
          </span>
        </div>

        {/* Main Service Title */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-1">
          Campus Keke Service
        </h1>

        <p className="text-sm sm:text-base font-medium italic text-slate-600 tracking-wide mb-8">
          Simple. Fast. Campus rides.
        </p>

        {/* Primary Action Button - Interactive & Animated */}
        <div className="w-full space-y-3">
          <Link
            href="/login"
            className="relative group overflow-hidden w-full inline-flex items-center justify-center gap-2.5 py-4 px-6 text-base font-extrabold text-white bg-slate-900 hover:bg-emerald-600 rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] animate-login-pulse"
          >
            {/* Shimmer light sweep reflection */}
            <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none animate-shimmer-sweep" />

            <span className="tracking-wider">LOGIN</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-200" />
          </Link>

          <p className="text-xs font-bold text-slate-500 tracking-wider uppercase pt-1">
            Student &bull; Driver &bull; Admin
          </p>
        </div>

        {/* First time registration note */}
        <div className="mt-8 p-4 w-full bg-white/90 backdrop-blur rounded-2xl border border-slate-200/80 shadow-sm text-left">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                First Time Student?
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Purchase your first ticket at any campus keke terminal to receive your Ticket ID, then claim it to create your account.
              </p>
              <Link
                href="/register"
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Register with Ticket ID &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Powered by TechspaceNG Footer */}
      <footer className="w-full max-w-lg py-5 text-center border-t border-slate-200/60 mt-auto space-y-1.5">
        <p className="text-xs text-slate-500 font-semibold">
          Federal College of Education (Technical) Bichi &bull; Campus Keke Service &copy; {new Date().getFullYear()}
        </p>
        <div className="pt-0.5">
          <p className="text-xs font-bold text-slate-800">
            Powered by <span className="text-emerald-700 font-black tracking-wide">TechspaceNG</span>
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500 mt-1">
            <span>
              Email:{' '}
              <a
                href="mailto:info@techspacen.com.ng"
                className="text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2"
              >
                info@techspacen.com.ng
              </a>
            </span>
            <span>&bull;</span>
            <span>
              Website:{' '}
              <a
                href="https://www.techspacen.com.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-800 font-semibold underline underline-offset-2"
              >
                www.techspacen.com.ng
              </a>
            </span>
          </p>
        </div>
      </footer>
    </main>
  );
}
