import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CustomerShell from '../../components/customer/CustomerShell';
import { createOnlineOrder } from '../../services/customerShopService';
import useCustomerAuthStore from '../../stores/customerAuthStore';
import useCustomerCartStore from '../../stores/customerCartStore';

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

export default function CustomerCartPage() {
  const navigate = useNavigate();
  const store = useCustomerCartStore((state) => state.store);
  const items = useCustomerCartStore((state) => state.items);
  const addItem = useCustomerCartStore((state) => state.addItem);
  const decreaseItem = useCustomerCartStore((state) => state.decreaseItem);
  const removeItem = useCustomerCartStore((state) => state.removeItem);
  const total = useCustomerCartStore((state) => state.total());
  const saveLastOrder = useCustomerCartStore((state) => state.saveLastOrder);
  const token = useCustomerAuthStore((state) => state.token);
  const customer = useCustomerAuthStore((state) => state.customer);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();

    if (!store?.id || !items.length) {
      setError('Pilih toko dan produk terlebih dahulu.');
      return;
    }

    if (!token) {
      navigate('/customer/login', {
        state: {
          from: '/customer/cart',
        },
      });
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await createOnlineOrder(store.id, {
        notes,
        items: items.map((item) => ({
          product_id: item.id,
          qty: item.qty,
        })),
      });

      saveLastOrder(response.data);
      navigate('/customer/success');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomerShell title="Keranjang" subtitle={store?.name || 'Checkout take away'}>
      <section className="px-4 py-5">
        {!items.length ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 p-8 text-center">
            <p className="text-xl font-black">Keranjang kosong</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Pilih toko dan tambahkan produk untuk membuat pesanan.
            </p>
            <Link
              to="/customer"
              className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
            >
              Pilih Toko
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div className="rounded-[28px] bg-slate-950 p-5 text-white">
              <p className="text-xs font-black uppercase tracking-wide text-blue-200">
                Toko Pilihan
              </p>
              <h2 className="mt-1 text-2xl font-black">{store?.name}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-300">
                Pesanan akan dikirim ke dashboard toko.
              </p>
            </div>

            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 font-black">{item.title}</h3>
                      <p className="mt-1 text-sm font-semibold text-blue-600">
                        {formatCurrency(item.sell_price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="h-9 rounded-xl bg-rose-50 px-3 text-xs font-black text-rose-600"
                    >
                      Hapus
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => decreaseItem(item.id)}
                        className="h-10 w-10 rounded-2xl border border-slate-200 text-lg font-black"
                      >
                        -
                      </button>
                      <span className="min-w-8 text-center text-base font-black">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => addItem(item)}
                        className="h-10 w-10 rounded-2xl bg-slate-950 text-lg font-black text-white"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-lg font-black">
                      {formatCurrency(item.sell_price * item.qty)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black">Data Pemesan</h3>
              {token && customer ? (
                <div className="mt-4 rounded-3xl bg-slate-50 p-4">
                  <p className="text-base font-black">{customer.name}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    WA {customer.phone}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {customer.email}
                  </p>
                  <span className="mt-3 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                    WhatsApp terverifikasi
                  </span>
                </div>
              ) : (
                <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                  Customer wajib login dan verifikasi WhatsApp sebelum membuat pesanan.
                </div>
              )}
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Catatan pesanan, opsional"
                rows={3}
                className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                {error}
              </div>
            )}

            <div className="sticky bottom-24 rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-black text-slate-500">Total</span>
                <span className="text-2xl font-black">{formatCurrency(total)}</span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="h-[52px] w-full rounded-2xl bg-blue-600 text-base font-black text-white shadow-lg shadow-blue-600/25 disabled:bg-slate-300"
              >
                {submitting ? 'Mengirim pesanan...' : token ? 'Kirim Pesanan' : 'Login untuk Checkout'}
              </button>
            </div>
          </form>
        )}
      </section>
    </CustomerShell>
  );
}
