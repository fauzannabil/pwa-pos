import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import CustomerShell from '../../components/customer/CustomerShell';
import { registerCustomer } from '../../services/customerShopService';

export default function CustomerRegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await registerCustomer(form);
      navigate('/customer/verify-otp', {
        state: {
          phone: form.phone,
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const update = (key) => (event) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  return (
    <CustomerShell title="Daftar Customer" subtitle="Aktivasi via OTP WhatsApp">
      <section className="px-4 py-6">
        <form onSubmit={submit} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black">Buat Akun</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Nomor WhatsApp wajib aktif karena kode OTP dikirim ke nomor ini.
          </p>

          <div className="mt-5 space-y-3">
            <input required value={form.name} onChange={update('name')} placeholder="Nama lengkap" className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            <input required value={form.phone} onChange={update('phone')} placeholder="Nomor WhatsApp, contoh 6285..." className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            <input required type="email" value={form.email} onChange={update('email')} placeholder="Email untuk reset password" className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            <input required type="password" minLength={8} value={form.password} onChange={update('password')} placeholder="Password minimal 8 karakter" className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            <input required type="password" minLength={8} value={form.password_confirmation} onChange={update('password_confirmation')} placeholder="Ulangi password" className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className="mt-5 h-[52px] w-full rounded-2xl bg-blue-600 text-base font-black text-white shadow-lg shadow-blue-600/25 disabled:bg-slate-300">
            {submitting ? 'Mengirim OTP...' : 'Daftar & Kirim OTP'}
          </button>
        </form>
      </section>
    </CustomerShell>
  );
}
