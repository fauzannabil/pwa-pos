import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';
import {
  acceptOnlineOrder,
  completeOnlineOrder,
  getOnlineOrder,
  getOnlineOrders,
  markOnlineOrderReady,
} from '../services/onlineOrderService';
import PrintTemplatePreview from '../components/receipt/PrintTemplatePreview';

const statusLabel = {
  pending: 'Baru',
  accepted: 'Diproses',
  ready: 'Siap Diambil',
  completed: 'Selesai',
  cancelled: 'Batal',
};

const statusClass = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  ready: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
};

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

export default function OnlineOrdersPage() {
  const tenant = useAuthStore((state) => state.tenant);
  const store = useAuthStore((state) => state.store);
  const terminal = useAuthStore((state) => state.terminal);
  const user = useAuthStore((state) => state.user);
  const activeCashierShift = useAuthStore((state) => state.activeCashierShift);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [printTransaction, setPrintTransaction] = useState(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');

  const filteredOrders = useMemo(() => {
    if (!filter) {
      return orders;
    }

    return orders.filter((order) => order.status === filter);
  }, [filter, orders]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getOnlineOrders();
      setOrders(data);

      if (selectedOrder?.id) {
        const fresh = await getOnlineOrder(selectedOrder.id);
        setSelectedOrder(fresh);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Gagal memuat pesanan online.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedOrder?.id]);

  useEffect(() => {
    loadOrders();
    const timer = window.setInterval(loadOrders, 20000);

    return () => window.clearInterval(timer);
  }, [loadOrders]);

  async function openOrder(orderId) {
    try {
      setProcessingId(orderId);
      const order = await getOnlineOrder(orderId);
      setSelectedOrder(order);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Gagal membuka detail pesanan.'
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function runAction(order, action) {
    try {
      setProcessingId(order.id);
      setError('');

      if (action === 'accept') {
        await acceptOnlineOrder(order.id);
      }

      if (action === 'ready') {
        await markOnlineOrderReady(order.id);
      }

      if (action === 'complete') {
        const response = await completeOnlineOrder(order.id);
        const completedOrder = response?.data;

        if (completedOrder) {
          setSelectedOrder(completedOrder);
          setPrintTransaction(
            onlineOrderToReceiptTransaction(completedOrder, {
              store,
              tenant,
              terminal,
              user,
            })
          );
        }
      }

      await loadOrders();

      if (selectedOrder?.id === order.id && action !== 'complete') {
        const fresh = await getOnlineOrder(order.id).catch(() => null);
        setSelectedOrder(fresh);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Aksi pesanan online gagal diproses.'
      );
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-3 pb-28 pt-4 text-slate-950 sm:px-6 lg:pb-8">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-blue-600">
            {store?.name || 'Toko aktif'}
          </p>
          <h1 className="text-2xl font-black sm:text-3xl">
            Pesanan Online
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Terima pesanan take away dan selesaikan pembayaran saat customer mengambil.
          </p>
        </div>

        <Link
          to="/"
          className="hidden rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-700 sm:inline-flex"
        >
          Main POS
        </Link>
      </div>

      {!activeCashierShift && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          Shift kasir belum aktif. Order tetap bisa dilihat, tetapi pembayaran hanya bisa diselesaikan setelah shift dibuka.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[
          ['', 'Semua'],
          ['pending', 'Baru'],
          ['accepted', 'Diproses'],
          ['ready', 'Siap'],
        ].map(([value, label]) => (
          <button
            key={value || 'all'}
            type="button"
            onClick={() => setFilter(value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
              filter === value
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'border border-slate-200 bg-white text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-3">
          {loading && orders.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-bold text-slate-500">
              Memuat pesanan online...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-lg font-black">Belum ada pesanan online aktif</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Pesanan baru dari customer app akan tampil di sini.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black">
                      {order.order_number}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {order.customer_name} / {order.customer_phone}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                      statusClass[order.status] || statusClass.pending
                    }`}
                  >
                    {statusLabel[order.status] || order.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <InfoTile label="Item" value={order.items_count} />
                  <InfoTile label="Total" value={formatCurrency(order.total)} />
                  <InfoTile label="Masuk" value={formatDateTime(order.created_at)} />
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openOrder(order.id)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black text-slate-700"
                  >
                    Detail
                  </button>
                  {order.status === 'pending' && (
                    <ActionButton
                      disabled={processingId === order.id}
                      onClick={() => runAction(order, 'accept')}
                    >
                      Terima
                    </ActionButton>
                  )}
                  {order.status === 'accepted' && (
                    <ActionButton
                      tone="sky"
                      disabled={processingId === order.id}
                      onClick={() => runAction(order, 'ready')}
                    >
                      Siap
                    </ActionButton>
                  )}
                  {order.status === 'ready' && (
                    <ActionButton
                      tone="emerald"
                      disabled={processingId === order.id || !activeCashierShift}
                      onClick={() => runAction(order, 'complete')}
                    >
                      Selesaikan & Bayar
                    </ActionButton>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:self-start">
          {selectedOrder ? (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Detail Pesanan
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    {selectedOrder.order_number}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600"
                >
                  Tutup
                </button>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <Row label="Customer" value={selectedOrder.customer_name} />
                <Row label="Telepon" value={selectedOrder.customer_phone} />
                <Row
                  label="Status"
                  value={statusLabel[selectedOrder.status] || selectedOrder.status}
                />
                <Row
                  label="Pembayaran"
                  value={selectedOrder.payment_status}
                />
              {selectedOrder.transaction?.invoice && (
                <Row
                  label="Invoice POS"
                  value={selectedOrder.transaction.invoice}
                />
              )}
              </div>

              {selectedOrder.notes && (
                <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                  {selectedOrder.notes}
                </div>
              )}

              <div className="mt-5 space-y-3">
                {selectedOrder.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm"
                  >
                    <div>
                      <p className="font-black">{item.product_title}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {item.qty} x {formatCurrency(item.unit_price)}
                      </p>
                    </div>
                    <p className="font-black">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <Row label="Total" value={formatCurrency(selectedOrder.total)} strong />
              </div>

              {selectedOrder.transaction?.invoice && (
                <button
                  type="button"
                  onClick={() =>
                    setPrintTransaction(
                      onlineOrderToReceiptTransaction(selectedOrder, {
                        store,
                        tenant,
                        terminal,
                        user,
                      })
                    )
                  }
                  className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-black text-white hover:bg-slate-950"
                >
                  Print Receipt
                </button>
              )}
            </div>
          ) : (
            <div className="py-10 text-center">
              <p className="text-lg font-black">Pilih pesanan</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Detail item dan pembayaran akan tampil di panel ini.
              </p>
            </div>
          )}
        </aside>
      </div>

      {printTransaction && (
        <PrintTemplatePreview
          transaction={printTransaction}
          message="Pilih template cetak untuk pesanan online."
          onClose={() => setPrintTransaction(null)}
        />
      )}
    </div>
  );
}

function onlineOrderToReceiptTransaction(order, context = {}) {
  return {
    id: order?.transaction?.id || order?.id,
    invoice: order?.transaction?.invoice || order?.order_number,
    invoice_no: order?.transaction?.invoice || order?.order_number,
    created_at: order?.completed_at || order?.created_at || new Date().toISOString(),
    transaction_time: order?.completed_at || order?.created_at,
    cashier_name: context.user?.name || 'Kasir',
    customer: {
      name: order?.customer_name || 'Customer Online',
      phone: order?.customer_phone || '',
      email: order?.customer_email || '',
      address: 'Ambil di toko',
    },
    payment_method: 'cash',
    payment_status: order?.payment_status,
    total: order?.total,
    grand_total: order?.total,
    cash: order?.total,
    paid_amount: order?.total,
    change: 0,
    change_amount: 0,
    details: (order?.items || []).map((item) => ({
      id: item.id || item.product_id,
      product_id: item.product_id,
      product_name: item.product_title,
      product_title: item.product_title,
      title: item.product_title,
      barcode: item.sku,
      qty: item.qty,
      unit_price: item.unit_price,
      price: item.subtotal,
      subtotal: item.subtotal,
    })),
    source: 'online_order',
    order_channel: 'online',
    online_order_id: order?.id,
    online_order_number: order?.order_number,
    store_name: context.store?.name || order?.store?.name,
    store_address: context.store?.address,
    store_phone: context.store?.phone,
    store_email: context.store?.email,
    store_website: context.store?.website,
    tenant_name: context.tenant?.name,
    terminal_name: context.terminal?.name,
  };
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ActionButton({ children, tone = 'blue', disabled = false, onClick }) {
  const tones = {
    blue: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20',
    sky: 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/20',
    emerald: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none ${
        tones[tone] || tones.blue
      }`}
    >
      {children}
    </button>
  );
}

function Row({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-semibold text-slate-500">{label}</span>
      <span
        className={`text-right ${
          strong ? 'text-lg font-black' : 'text-sm font-bold'
        } text-slate-900`}
      >
        {value}
      </span>
    </div>
  );
}
