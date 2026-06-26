import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import CustomerShell from '../../components/customer/CustomerShell';
import { loginCustomer } from '../../services/customerShopService';
import useCustomerAuthStore from '../../stores/customerAuthStore';

export default function CustomerLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const authLogin = useCustomerAuthStore((state) => state.login);
  const [form, setForm] = useState({ login: '', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const redirectTo = location.state?.from || '/customer/cart';

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await loginCustomer(form);
      authLogin(response.token, response.customer);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CustomerShell title="Login Customer" subtitle="Masuk sebelum checkout">
      <section className="px-4 py-6">
        <form onSubmit={submit} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black">Masuk</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Gunakan email atau nomor WhatsApp yang sudah terverifikasi.
          </p>

          <div className="mt-5 space-y-3">
            <input
              required
              value={form.login}
              onChange={(event) => setForm((prev) => ({ ...prev, login: event.target.value }))}
              placeholder="Email atau nomor WhatsApp"
              className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <input
              required
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Password"
              className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 h-[52px] w-full rounded-2xl bg-blue-600 text-base font-black text-white shadow-lg shadow-blue-600/25 disabled:bg-slate-300"
          >
            {submitting ? 'Memproses...' : 'Login'}
          </button>

          <p className="mt-5 text-center text-sm font-semibold text-slate-500">
            Belum punya akun?{' '}
            <Link to="/customer/register" className="font-black text-blue-600">
              Daftar
            </Link>
          </p>
        </form>
      </section>
    </CustomerShell>
  );
}
