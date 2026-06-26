import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import CustomerShell from '../../components/customer/CustomerShell';
import { resendCustomerOtp, verifyCustomerOtp } from '../../services/customerShopService';
import useCustomerAuthStore from '../../stores/customerAuthStore';

export default function CustomerVerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const authLogin = useCustomerAuthStore((state) => state.login);
  const [phone, setPhone] = useState(location.state?.phone || '');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const response = await verifyCustomerOtp({ phone, otp });
      authLogin(response.token, response.customer);
      navigate('/customer/cart', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setError('');
    setMessage('');

    try {
      const response = await resendCustomerOtp(phone);
      setMessage(response.message || 'OTP baru dikirim.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <CustomerShell title="Verifikasi OTP" subtitle="Aktivasi akun customer">
      <section className="px-4 py-6">
        <form onSubmit={submit} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-black">Masukkan OTP</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Kode OTP dikirim ke WhatsApp yang Anda daftarkan.
          </p>

          <div className="mt-5 space-y-3">
            <input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Nomor WhatsApp" className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
            <input required inputMode="numeric" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6 digit OTP" className="h-[64px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center text-2xl font-black tracking-[0.35em] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </div>

          {message && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</div>}
          {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}

          <button type="submit" disabled={submitting} className="mt-5 h-[52px] w-full rounded-2xl bg-blue-600 text-base font-black text-white shadow-lg shadow-blue-600/25 disabled:bg-slate-300">
            {submitting ? 'Memverifikasi...' : 'Aktifkan Akun'}
          </button>
          <button type="button" onClick={resend} className="mt-3 h-[48px] w-full rounded-2xl border border-slate-200 text-sm font-black text-slate-700">
            Kirim Ulang OTP
          </button>
        </form>
      </section>
    </CustomerShell>
  );
}
