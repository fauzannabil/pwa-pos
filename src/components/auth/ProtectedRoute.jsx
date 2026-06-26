import { Link, Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import {
  validatePosContext
} from '../../utils/saasContext';
import {
  getBackendBaseUrl
} from '../../config/apiConfig';
import {
  canUsePwaPos,
  canUseManagerTools,
  getUserRoles,
  hasAnyPermission,
  isBackofficeOnlyUser
} from '../../utils/authz';

export default function ProtectedRoute({
  children,
  requirePosContext = true,
  requireManagerTools = false,
  permissions = [],
}) {

  const backendUrl =
    getBackendBaseUrl();

  const token =
    useAuthStore(
      (state) => state.token
    );

  const user =
    useAuthStore(
      (state) => state.user
    );

  const tenant =
    useAuthStore(
      (state) => state.tenant
    );

  const store =
    useAuthStore(
      (state) => state.store
    );

  const terminal =
    useAuthStore(
      (state) => state.terminal
    );

  const subscription =
    useAuthStore(
      (state) => state.subscription
    );

  if (!token) {

    return <Navigate to="/login" />;

  }

  if (
    isBackofficeOnlyUser(user) ||
    !canUsePwaPos(user)
  ) {

    const roles =
      getUserRoles(user);

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
        <section className="w-full max-w-lg rounded-2xl border border-blue-200 bg-white p-6 shadow-xl shadow-slate-200/70">
          <div className="mb-3 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
            Dashboard backoffice
          </div>
          <h1 className="text-2xl font-bold text-slate-950">
            Akun ini bukan akun kasir POS
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Role aktif:
            {' '}
            {roles.length > 0 ? roles.join(', ') : '-'}
            . Gunakan dashboard backend untuk mengelola tenant, toko, billing, produk global, dan karyawan.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-900"
            >
              Login akun POS
            </Link>
            <a
              href={`${backendUrl}/dashboard`}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              Buka Dashboard
            </a>
          </div>
        </section>
      </main>
    );

  }

  if (
    requireManagerTools &&
    !canUseManagerTools(user)
  ) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
        <section className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-xl shadow-slate-200/70">
          <div className="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
            Akses manager diperlukan
          </div>
          <h1 className="text-2xl font-bold text-slate-950">
            Halaman ini untuk manager toko
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Akun kasir tetap dapat memakai POS, riwayat transaksi, detail transaksi, dan Sync Dashboard.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              Kembali ke POS
            </Link>
            <Link
              to="/sync-dashboard"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Sync Dashboard
            </Link>
          </div>
        </section>
      </main>
    );

  }

  if (
    permissions.length > 0 &&
    !hasAnyPermission(user, permissions)
  ) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
        <section className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-6 shadow-xl shadow-slate-200/70">
          <div className="mb-3 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
            Akses ditolak
          </div>
          <h1 className="text-2xl font-bold text-slate-950">
            Hak akses belum diberikan
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Akun ini belum memiliki permission untuk membuka halaman tersebut. Hubungi Admin Tenant untuk menyesuaikan role atau akses group.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              Kembali ke POS
            </Link>
            <a
              href={`${backendUrl}/dashboard/roles`}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Atur Akses Group
            </a>
          </div>
        </section>
      </main>
    );

  }

  if (requirePosContext) {

    const validation =
      validatePosContext({
        tenant,
        store,
        terminal,
        subscription,
      });

    if (!validation.ok) {

      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
          <section className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-xl shadow-slate-200/70">
            <div className="mb-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              POS belum siap
            </div>
            <h1 className="text-2xl font-bold text-slate-950">
              Akses POS tertahan
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {validation.reason}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Pastikan akun ini memiliki tenant, toko, terminal aktif, dan subscription yang masih berlaku.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/login"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
              >
                Login ulang
              </Link>
              <a
                href={`${backendUrl}/dashboard`}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Buka Dashboard
              </a>
            </div>
          </section>
        </main>
      );

    }

  }

  return children;

}
