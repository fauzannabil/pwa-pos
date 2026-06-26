import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CustomerShell from '../../components/customer/CustomerShell';
import { fetchOnlineOrderStatus } from '../../services/customerShopService';
import useCustomerCartStore from '../../stores/customerCartStore';

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

const formatDateTime = (value) =>
  value
    ? new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(value))
    : '-';

const statusCopy = {
  pending: {
    label: 'Menunggu konfirmasi toko',
    description: 'Pesanan sudah masuk. Toko akan segera menerima dan menyiapkannya.',
  },
  accepted: {
    label: 'Sedang disiapkan',
    description: 'Toko sudah menerima pesanan dan sedang menyiapkan item Anda.',
  },
  ready: {
    label: 'Siap diambil',
    description: 'Pesanan sudah siap. Silakan datang ke toko untuk membayar dan mengambil.',
  },
  completed: {
    label: 'Selesai',
    description: 'Pesanan sudah dibayar dan selesai.',
  },
  cancelled: {
    label: 'Dibatalkan',
    description: 'Pesanan ini dibatalkan. Hubungi toko jika membutuhkan bantuan.',
  },
};

const paymentCopy = {
  unpaid: 'Belum dibayar di kasir',
  paid: 'Lunas',
  cancelled: 'Dibatalkan',
};

const heroCopy = {
  pending: {
    title: 'Pesanan terkirim',
    description: 'Toko akan melihat pesanan ini di dashboard Pesanan Online.',
  },
  accepted: {
    title: 'Pesanan diproses',
    description: 'Toko sudah menerima pesanan dan sedang menyiapkannya.',
  },
  ready: {
    title: 'Pesanan siap diambil',
    description: 'Silakan datang ke toko untuk mengambil dan menyelesaikan pembayaran.',
  },
  completed: {
    title: 'Pesanan selesai',
    description: 'Pesanan sudah dibayar dan selesai. Terima kasih.',
  },
  cancelled: {
    title: 'Pesanan dibatalkan',
    description: 'Pesanan ini dibatalkan. Hubungi toko jika membutuhkan bantuan.',
  },
};

export default function CustomerSuccessPage() {
  const lastOrder = useCustomerCartStore((state) => state.lastOrder);
  const updateLastOrder = useCustomerCartStore((state) => state.updateLastOrder);
  const store = useCustomerCartStore((state) => state.store);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const currentStatus = statusCopy[lastOrder?.status] || {
    label: lastOrder?.status || '-',
    description: 'Status terbaru akan diperbarui otomatis.',
  };
  const currentHero = heroCopy[lastOrder?.status] || {
    title: 'Status pesanan',
    description: 'Status terbaru akan diperbarui otomatis.',
  };
  const displayStore = lastOrder?.store || store;
  const timeline = [
    ['Order Dibuat', lastOrder?.created_at],
    ['Order Diterima', lastOrder?.accepted_at],
    ['Order Siap', lastOrder?.ready_at],
    ['Order Diambil', lastOrder?.completed_at],
    ['Order Selesai', lastOrder?.completed_at],
  ];

  useEffect(() => {
    if (!lastOrder?.uuid) {
      return undefined;
    }

    let mounted = true;

    const refreshOrder = async () => {
      try {
        setRefreshing(true);
        const response = await fetchOnlineOrderStatus(lastOrder.uuid);
        if (mounted && response?.data) {
          updateLastOrder(response.data);
        }
      } catch (error) {
        console.warn('Gagal memuat status order terbaru', error);
      } finally {
        if (mounted) {
          setRefreshing(false);
        }
      }
    };

    refreshOrder();
    const timer = window.setInterval(refreshOrder, 10000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [lastOrder?.uuid, updateLastOrder]);

  return (
    <CustomerShell title="Order" subtitle="Status pesanan take away">
      <section className="px-4 py-5">
        {lastOrder ? (
          <div className="space-y-5">
            <div className="rounded-[32px] bg-emerald-600 p-7 text-white shadow-2xl shadow-emerald-600/25">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-3xl font-black text-emerald-600">
                ✓
              </div>
              <h2 className="mt-5 text-3xl font-black leading-tight">
                {currentHero.title}
              </h2>
              <p className="mt-3 text-sm font-semibold text-emerald-50">
                {currentHero.description}
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Nomor Order
              </p>
              <h3 className="mt-2 break-words text-base font-black leading-snug tracking-normal sm:text-lg">
                {lastOrder.order_number}
              </h3>
              <div className="mt-4 rounded-3xl bg-blue-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-blue-600">
                  Status Pesanan
                </p>
                <p className="mt-1 text-lg font-black text-slate-950">
                  {currentStatus.label}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {currentStatus.description}
                </p>
              </div>

              {displayStore && (
                <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Data Toko
                  </p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    {displayStore.name || 'Toko'}
                  </p>
                  {displayStore.tenant?.name && (
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {displayStore.tenant.name}
                    </p>
                  )}
                  {displayStore.code && (
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Kode toko: {displayStore.code}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-5 space-y-3 text-sm">
                <Row label="Pembayaran" value={paymentCopy[lastOrder.payment_status] || lastOrder.payment_status} />
                <Row label="Customer" value={lastOrder.customer_name} />
                <Row label="Telepon" value={lastOrder.customer_phone} />
                <Row label="Total" value={formatCurrency(lastOrder.total)} strong />
              </div>

              <button
                type="button"
                onClick={() => setShowDetail((current) => !current)}
                className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 px-4 text-sm font-black text-blue-700"
              >
                {showDetail ? 'Tutup Detail' : 'Detail'}
              </button>

              {showDetail && (
                <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                  <h3 className="text-base font-black text-slate-950">
                    Timeline Pesanan
                  </h3>
                  <div className="mt-4 space-y-3">
                    {timeline.map(([label, value], index) => (
                      <div
                        key={`${label}-${index}`}
                        className="flex items-start gap-3"
                      >
                        <span
                          className={`mt-1 h-3 w-3 rounded-full ${
                            value ? 'bg-blue-600' : 'bg-slate-200'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-slate-900">
                            {label}
                          </p>
                          <p className="text-sm font-semibold text-slate-500">
                            {formatDateTime(value)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-4 text-xs font-bold text-slate-400">
                {refreshing ? 'Memuat status terbaru...' : 'Status diperbarui otomatis.'}
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-black">Item</h3>
              <div className="mt-3 space-y-3">
                {lastOrder.items?.map((item) => (
                  <div key={`${item.product_id}-${item.product_title}`} className="flex justify-between gap-4 text-sm">
                    <div>
                      <p className="font-black">{item.product_title}</p>
                      <p className="text-slate-500">{item.qty} x {formatCurrency(item.unit_price)}</p>
                    </div>
                    <p className="font-black">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to={store?.id ? `/customer/store/${store.id}` : '/customer'}
              className="flex h-[52px] items-center justify-center rounded-2xl bg-blue-600 text-base font-black text-white"
            >
              Pesan Lagi
            </Link>
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-300 p-8 text-center">
            <p className="text-xl font-black">Belum ada order terakhir</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Pesanan berhasil akan tampil di halaman ini.
            </p>
            <Link
              to="/customer"
              className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
            >
              Mulai Pesan
            </Link>
          </div>
        )}
      </section>
    </CustomerShell>
  );
}

function Row({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className={`${strong ? 'text-lg' : 'text-sm'} text-right font-black`}>
        {value}
      </span>
    </div>
  );
}
