import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { login } from '../services/authService';

import useAuthStore from '../stores/authStore';

function Icon({
  children,
  className = '',
  size = 20,
}) {

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );

}

function ShoppingCartIcon(props) {

  return (
    <Icon {...props}>
      <circle cx="9" cy="20" r="1" />
      <circle cx="17" cy="20" r="1" />
      <path d="M3 4h2l2.3 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6" />
    </Icon>
  );

}

function MailIcon(props) {

  return (
    <Icon {...props}>
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </Icon>
  );

}

function LockIcon(props) {

  return (
    <Icon {...props}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Icon>
  );

}

function EyeIcon(props) {

  return (
    <Icon {...props}>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );

}

function EyeOffIcon(props) {

  return (
    <Icon {...props}>
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 13.4 13.4" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.7 3.7" />
      <path d="M6.6 6.6C3.7 8.3 2 12 2 12s3.5 7 10 7a10.8 10.8 0 0 0 4.1-.8" />
    </Icon>
  );

}

function LoaderIcon(props) {

  return (
    <Icon {...props}>
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="m4.9 4.9 2.8 2.8" />
      <path d="m16.3 16.3 2.8 2.8" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
      <path d="m4.9 19.1 2.8-2.8" />
      <path d="m16.3 7.7 2.8-2.8" />
    </Icon>
  );

}

export default function LoginPage() {

  const navigate = useNavigate();

  const authLogin =
    useAuthStore((state) => state.login);

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [remember, setRemember] =
    useState(true);

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  async function handleLogin(e) {

    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {

      const response =
        await login(email, password);

      await authLogin(
        response.token,
        response.user,
        response.tenant,
        response.store,
        response.terminal,
        response.subscription,
        response.active_cashier_shift
      );

      navigate('/');

    } catch (error) {

      setErrorMessage(
        error?.response?.data?.message ||
          'Login gagal. Periksa email dan password Anda.'
      );

    } finally {

      setLoading(false);

    }

  }

  return (

    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_32%),linear-gradient(135deg,#eff6ff_0%,#f8fafc_45%,#eef2ff_100%)] p-4 text-slate-900 sm:p-6">

      <div className="flex w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-2xl shadow-blue-900/15">

      <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:px-14">

        <div className="w-full max-w-md">

          <div className="mb-8">
            <Link
              to="/login"
              className="mb-6 inline-flex items-center gap-3"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/25">
                <ShoppingCartIcon size={24} />
              </span>
              <span className="text-2xl font-bold text-slate-900">
                UNTAN PoS
              </span>
            </Link>

            <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
              Offline First POS
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              Masuk ke POS
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Akses transaksi toko, shift kasir, sinkronisasi offline, dan riwayat penjualan.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>

              <div className="relative">
                <MailIcon
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="nama@email.com"
                  autoComplete="email"
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <LockIcon
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/15"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    <EyeOffIcon size={20} />
                  ) : (
                    <EyeIcon size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) =>
                    setRemember(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600">
                  Ingat saya
                </span>
              </label>

              <span className="text-sm font-medium text-blue-600">
                Offline First POS
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderIcon
                    size={20}
                    className="animate-spin"
                  />
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>

          </form>

        </div>

      </section>

      <section className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-800 via-blue-600 to-sky-500 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/15" />
        <div className="absolute -bottom-20 left-8 h-52 w-52 rounded-full bg-sky-300/20" />
        <div className="relative max-w-md text-center">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 shadow-xl shadow-blue-950/20">
            <ShoppingCartIcon size={48} />
          </div>
          <h2 className="mb-4 text-4xl font-black tracking-tight">
            POS mobile untuk kasir modern
          </h2>
          <p className="text-lg leading-relaxed text-white/90">
            Sistem Point of Sale modern yang membantu transaksi kasir,
            inventori toko, dan sinkronisasi offline-first tetap berjalan rapi.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              'Transaksi Cepat',
              'Offline First',
              'Multi Toko',
            ].map((feature) => (
              <span
                key={feature}
                className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </section>

      </div>

    </main>

  );

}
