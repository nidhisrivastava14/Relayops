'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClientInstance } from '@/lib/supabase/browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserClientInstance();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMsg('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center text-[#F8FAFC] relative overflow-hidden font-sans p-6 md:p-12"
      style={{
        background: 'radial-gradient(circle at 15% 0%, #1a1030 0%, #0a0a14 45%, #060609 100%)'
      }}
    >
      {/* Fixed Full-Bleed Glowing Background Orbs */}
      <div 
        className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(124, 92, 255, 0.18) 0%, transparent 70%)'
        }}
      />
      <div 
        className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(80, 60, 200, 0.12) 0%, transparent 70%)'
        }}
      />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        
        {/* Left Side: Branding & Features */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-8 pr-0 lg:pr-8 relative -mt-12 lg:-mt-24">
          
          {/* Scattered Star Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden -m-10">
            {[
              { top: '10%', left: '15%', size: '3px', opacity: 0.25 },
              { top: '15%', left: '75%', size: '2px', opacity: 0.15 },
              { top: '25%', left: '45%', size: '3px', opacity: 0.3 },
              { top: '35%', left: '85%', size: '2px', opacity: 0.2 },
              { top: '40%', left: '10%', size: '3px', opacity: 0.25 },
              { top: '55%', left: '60%', size: '2px', opacity: 0.15 },
              { top: '65%', left: '30%', size: '3px', opacity: 0.3 },
              { top: '70%', left: '80%', size: '2px', opacity: 0.2 },
              { top: '80%', left: '20%', size: '3px', opacity: 0.25 },
              { top: '90%', left: '50%', size: '2px', opacity: 0.15 },
              { top: '5%', left: '50%', size: '2px', opacity: 0.2 },
              { top: '48%', left: '25%', size: '3px', opacity: 0.18 },
              { top: '78%', left: '70%', size: '2px', opacity: 0.25 },
              { top: '28%', left: '90%', size: '3px', opacity: 0.15 },
              { top: '62%', left: '5%', size: '2px', opacity: 0.3 },
            ].map((star, i) => (
              <div
                key={i}
                className="absolute bg-white rounded-full"
                style={{
                  top: star.top,
                  left: star.left,
                  width: star.size,
                  height: star.size,
                  opacity: star.opacity,
                }}
              />
            ))}
          </div>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">RelayOps</span>
          </div>

          {/* Tagline */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Modern Incident Management
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Resolve Incidents.<br />
              <span className="bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">Together.</span>
            </h1>
            <p className="text-[#94A3B8] text-base sm:text-lg max-w-lg leading-relaxed">
              A modern dashboard to report, track and resolve incidents across your Discord servers.
            </p>
          </div>

          {/* Feature Lists */}
          <div className="space-y-4 max-w-md">
            {[
              {
                title: 'Lightning Fast',
                desc: 'Report incidents in seconds with slash commands.',
                icon: (
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
              {
                title: 'Real-time Updates',
                desc: 'Get instant updates and track progress live.',
                icon: (
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              },
              {
                title: 'Smart & Secure',
                desc: 'AI-powered summaries with enterprise-grade security.',
                icon: (
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )
              }
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>


        </div>

        {/* Right Side: Form Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div 
            className="w-full max-w-md p-8 rounded-[24px] transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 0 60px rgba(139, 108, 255, 0.15)'
            }}
          >
            <div className="flex flex-col items-center text-center mb-8">
              {/* Lightning Logo */}
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-[#8b6cff]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Welcome back</h2>
              <p className="text-[#94A3B8] text-xs mt-1">
                Sign in to manage incidents and monitor your servers
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-800/30 text-red-400 text-xs flex items-center gap-2">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-[14px] bg-[#070B18]/60 border border-white/5 text-sm text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition duration-200"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                    Password
                  </label>
                  <a href="#" className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <svg className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-11 py-3.5 rounded-[14px] bg-[#070B18]/60 border border-white/5 text-sm text-[#F8FAFC] placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition duration-200"
                    placeholder="••••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-white/5 bg-[#070B18] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 focus:ring-offset-transparent cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs text-[#94A3B8] cursor-pointer selection:bg-transparent">
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-[14px] text-white font-semibold text-sm transition duration-200 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, #8b6cff, #5b4fd6)',
                  boxShadow: '0 0 24px rgba(139, 108, 255, 0.35)'
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-semibold">
                <span className="bg-[#0D1326] px-2 text-[#94A3B8]">Or</span>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-3 rounded-[14px] border border-white/5 hover:bg-white/[0.02] text-xs font-semibold text-slate-300 transition duration-150 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 1-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Continue with Discord
            </button>

            <div className="mt-8 text-center">
              <span className="text-[10px] text-[#94A3B8]">
                Don&apos;t have an account?{' '}
                <a href="#" className="text-indigo-400 hover:underline">
                  Contact your administrator
                </a>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
