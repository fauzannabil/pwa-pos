import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Link,
  useLocation,
} from 'react-router-dom';

import ProtectedRoute from './components/auth/ProtectedRoute';

import {
  lazy,
  Suspense,
  useEffect,
  useState
} from 'react';
import useAuthStore  from './stores/authStore';
import { me } from './services/authService';
import {
  canUseManagerTools,
  hasAnyPermission
} from './utils/authz';
import {
  getOnlineOrders
} from './services/onlineOrderService';

const PosPage = lazy(() => import('./pages/PosPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const TransactionHistoryPage = lazy(() => import('./pages/TransactionHistoryPage'));
const OnlineOrdersPage = lazy(() => import('./pages/OnlineOrdersPage'));
const SyncDashboardPage = lazy(() => import('./pages/SyncDashboardPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const TransactionDetailPage = lazy(() => import('./pages/TransactionDetailPage'));
const ReconciliationPage = lazy(() => import('./pages/ReconciliationPage'));
const ConflictResolutionPage = lazy(() => import('./pages/ConflictResolutionPage'));
const CustomerHomePage = lazy(() => import('./pages/customer/CustomerHomePage'));
const CustomerStorePage = lazy(() => import('./pages/customer/CustomerStorePage'));
const CustomerCartPage = lazy(() => import('./pages/customer/CustomerCartPage'));
const CustomerSuccessPage = lazy(() => import('./pages/customer/CustomerSuccessPage'));
const CustomerLoginPage = lazy(() => import('./pages/customer/CustomerLoginPage'));
const CustomerRegisterPage = lazy(() => import('./pages/customer/CustomerRegisterPage'));
const CustomerVerifyOtpPage = lazy(() => import('./pages/customer/CustomerVerifyOtpPage'));

function BottomNavIcon({ type }) {
  if (type === 'more') {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="currentColor"
        aria-hidden="true"
      >
        <circle cx="5" cy="12" r="1.8" />
        <circle cx="12" cy="12" r="1.8" />
        <circle cx="19" cy="12" r="1.8" />
      </svg>
    );
  }

  const icons = {
    pos: 'M4 6h16v12H4z M8 6v12 M16 6v12 M4 10h16',
    history: 'M12 8v5l3 2 M4 12a8 8 0 1 0 2.34-5.66 M4 4v5h5',
    online: 'M6 7h12l-1 11H7L6 7z M9 7a3 3 0 0 1 6 0 M8 12h8',
    sync: 'M4 7h10a4 4 0 0 1 4 4v1 M20 17H10a4 4 0 0 1-4-4v-1 M17 9l3 3 3-3 M7 15l-3-3-3 3',
    dashboard: 'M4 4h7v7H4z M13 4h7v5h-7z M13 11h7v9h-7z M4 13h7v7H4z',
  };

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={icons[type]} />
    </svg>
  );
}

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

function AppBottomMenu({
  onlineOrderCount = 0,
}) {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isManager = canUseManagerTools(user);
  const canAccess = (permissions) =>
    hasAnyPermission(user, permissions);

  if (
    !token ||
    location.pathname === '/login' ||
    location.pathname.startsWith('/customer')
  ) {
    return null;
  }

  const items = [
    {
      to: '/',
      label: 'POS',
      icon: 'pos',
      end: true,
      permissions: ['transactions-access'],
    },
    {
      to: '/online-orders',
      label: 'Online',
      icon: 'online',
      permissions: ['online-orders-access'],
    },
    {
      to: '/transactions',
      label: 'Riwayat',
      icon: 'history',
      permissions: ['transactions-access'],
    },
    {
      to: '/sync-dashboard',
      label: 'Sync',
      icon: 'sync',
      permissions: ['transactions-access'],
    },
    ...(isManager
      ? [{
          to: '/dashboard',
          label: 'Dashboard',
          icon: 'dashboard',
          permissions: ['dashboard-access'],
        }]
      : []),
    {
      to: isManager ? '/conflicts' : '/sync-dashboard',
      label: 'Lainnya',
      icon: 'more',
      permissions: isManager
        ? ['transactions-access']
        : ['transactions-access'],
    },
  ].filter((item) => canAccess(item.permissions));

  if (items.length === 0) {
    return null;
  }

  return (
      <nav
        className="
          fixed
          inset-x-0
          bottom-0
          z-50
          border-t
          border-slate-200
          bg-white/95
          px-2
          pb-[max(0.5rem,env(safe-area-inset-bottom))]
          pt-2
          shadow-[0_-10px_30px_rgba(15,23,42,0.10)]
          backdrop-blur
          lg:hidden
        "
        aria-label="Navigasi utama POS mobile"
      >
        <div
          className="mx-auto grid max-w-md gap-1"
          style={{
            gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
          }}
        >
          {items.map((item) => (
            <NavLink
              key={`${item.to}-${item.label}-mobile`}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `
                relative
                flex
                min-h-[54px]
                flex-col
                items-center
                justify-center
                gap-1
                rounded-2xl
                px-2
                text-[11px]
                font-bold
                transition
                ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }
              `}
            >
              <BottomNavIcon type={item.icon} />
              {item.to === '/online-orders' && onlineOrderCount > 0 && (
                <span className="absolute -mt-8 ml-8 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-black leading-none text-white shadow-md shadow-red-600/30">
                  {onlineOrderCount > 99 ? '99+' : onlineOrderCount}
                </span>
              )}
              <span className="leading-none">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
  );
}

function OnlineOrderNotifier({
  onPendingCountChange,
}) {
  const location = useLocation();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const store = useAuthStore((state) => state.store);
  const [alert, setAlert] = useState(null);
  const [dismissed, setDismissed] = useState({
    signature: '',
    until: 0,
  });

  const canWatch =
    Boolean(token) &&
    hasAnyPermission(user, ['online-orders-access']) &&
    location.pathname !== '/login' &&
    !location.pathname.startsWith('/customer');

  useEffect(() => {
    if (!canWatch) {
      onPendingCountChange(0);
      setAlert(null);
      return undefined;
    }

    let cancelled = false;

    async function pollPendingOrders() {
      try {
        const orders = await getOnlineOrders({
          status: 'pending',
        });
        const pendingOrders = (orders || []).filter(
          (order) => order.status === 'pending'
        );

        if (cancelled) return;

        onPendingCountChange(pendingOrders.length);
        window.dispatchEvent(
          new CustomEvent('online-orders:pending-count', {
            detail: {
              count: pendingOrders.length,
            },
          })
        );

        if (
          pendingOrders.length === 0 ||
          location.pathname === '/online-orders'
        ) {
          setAlert(null);
          return;
        }

        const signature = pendingOrders
          .map((order) => order.id)
          .sort()
          .join(',');

        const stillDismissed =
          dismissed.signature === signature &&
          Date.now() < dismissed.until;

        if (!stillDismissed) {
          setAlert({
            signature,
            orders: pendingOrders,
            firstOrder: pendingOrders[0],
          });
        }
      } catch (error) {
        if (cancelled) return;

        if (error?.response?.status === 403) {
          onPendingCountChange(0);
          setAlert(null);
        }
      }
    }

    pollPendingOrders();
    const timer = window.setInterval(
      pollPendingOrders,
      15000
    );

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [
    canWatch,
    dismissed.signature,
    dismissed.until,
    location.pathname,
    onPendingCountChange,
  ]);

  if (!alert) {
    return null;
  }

  const order = alert.firstOrder || {};
  const count = alert.orders.length;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/35 px-3 pb-4 pt-10 backdrop-blur-[2px] sm:items-center sm:px-6">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-red-100 bg-white shadow-2xl shadow-slate-950/25">
        <div className="bg-red-600 px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-100">
                Pesanan online baru
              </p>
              <h2 className="mt-1 text-2xl font-black">
                {count} pesanan menunggu
              </h2>
            </div>
            <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl bg-white px-3 text-lg font-black text-red-600">
              {count}
            </span>
          </div>
        </div>

        <div className="space-y-4 p-5 text-slate-950">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black">
                  {order.invoice || order.order_number || 'Pesanan baru'}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {order.customer_name || 'Customer Online'}
                  {order.customer_phone ? ` / ${order.customer_phone}` : ''}
                </p>
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                Baru
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Total
                </p>
                <p className="font-black text-slate-950">
                  {formatCurrency(order.grand_total || order.total || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Toko
                </p>
                <p className="truncate font-black text-slate-950">
                  {store?.name || 'Toko aktif'}
                </p>
              </div>
            </div>
          </div>

          <p className="text-sm font-semibold leading-6 text-slate-600">
            Segera buka daftar pesanan untuk menerima dan memproses order take away agar customer tidak menunggu lama.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/online-orders"
              onClick={() => setAlert(null)}
              className="inline-flex flex-1 items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white hover:bg-blue-700"
            >
              Buka Pesanan
            </Link>
            <button
              type="button"
              onClick={() => {
                setDismissed({
                  signature: alert.signature,
                  until: Date.now() + 120000,
                });
                setAlert(null);
              }}
              className="inline-flex flex-1 items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              Ingatkan Lagi
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function App() {

const [accessAlert, setAccessAlert] =
  useState(null);

const [pwaUpdateAvailable, setPwaUpdateAvailable] =
  useState(false);

const [offlineReady, setOfflineReady] =
  useState(false);

const [toast, setToast] =
  useState(null);

const [pendingOnlineOrderCount, setPendingOnlineOrderCount] =
  useState(0);

const authLogin =
  useAuthStore(
    (state) => state.login
  );

    useEffect(() => {

      async function loadUser() {

        const token =
          localStorage.getItem('token');

        if (!token) return;

        try {

          const response = await me();

          await authLogin(
            token,
            response.user,
            response.tenant,
            response.store,
            response.terminal,
            response.subscription,
            response.active_cashier_shift
          );

        } catch {}

      }

      loadUser();

    }, [authLogin]);

    useEffect(() => {

      function handleAccessBlocked(event) {

        setAccessAlert({
          title:
            event.detail?.title ||
            'Akses POS tertahan',
          message:
            event.detail?.message ||
            'Tenant, toko, terminal, atau subscription sedang tidak aktif.',
          status:
            event.detail?.status || null,
        });

      }

      window.addEventListener(
        'saas:access-blocked',
        handleAccessBlocked
      );

      window.addEventListener(
        'saas:subscription-blocked',
        handleAccessBlocked
      );

      return () => {

        window.removeEventListener(
          'saas:access-blocked',
          handleAccessBlocked
        );

        window.removeEventListener(
          'saas:subscription-blocked',
          handleAccessBlocked
        );

      };

    }, []);

    useEffect(() => {

      function handleToast(event) {

        setToast({
          title:
            event.detail?.title || 'Info',
          message:
            event.detail?.message || '',
          tone:
            event.detail?.tone || 'info',
        });

        window.clearTimeout(
          window.__posToastTimer
        );

        window.__posToastTimer =
          window.setTimeout(
            () => setToast(null),
            4500
          );

      }

      window.addEventListener(
        'app:toast',
        handleToast
      );

      return () => {

        window.removeEventListener(
          'app:toast',
          handleToast
        );

        window.clearTimeout(
          window.__posToastTimer
        );

      };

    }, []);

    useEffect(() => {

      function handleUpdateAvailable() {

        setPwaUpdateAvailable(true);

      }

      function handleOfflineReady() {

        setOfflineReady(true);

      }

      window.addEventListener(
        'pwa:update-available',
        handleUpdateAvailable
      );

      window.addEventListener(
        'pwa:offline-ready',
        handleOfflineReady
      );

      return () => {

        window.removeEventListener(
          'pwa:update-available',
          handleUpdateAvailable
        );

        window.removeEventListener(
          'pwa:offline-ready',
          handleOfflineReady
        );

      };

    }, []);

  function applyPwaUpdate() {

    if (window.__pwaUpdateSW) {

      window.__pwaUpdateSW(true);

    } else {

      window.location.reload();

    }

  }

  function protectedPage(page, options = {}) {

    return (
      <ProtectedRoute
        {...options}
      >
        {page}
      </ProtectedRoute>
    );

  }

  return (

    <BrowserRouter>

      {accessAlert && (
        <div className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
          <div className="mx-auto flex max-w-4xl items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-lg shadow-amber-900/10">
            <div>
              <div className="text-sm font-bold">
                {accessAlert.title}
              </div>
              <div className="mt-1 text-sm">
                {accessAlert.message}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAccessAlert(null)}
              className="rounded-lg px-2 py-1 text-sm font-bold text-amber-900 hover:bg-amber-100"
              aria-label="Tutup peringatan akses"
            >
              x
            </button>
          </div>
        </div>
      )}

      {pwaUpdateAvailable && (
        <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 rounded-xl border border-blue-200 bg-white px-4 py-3 text-slate-900 shadow-xl shadow-slate-900/10">
            <div>
              <div className="text-sm font-bold">
                Versi baru tersedia
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Selesaikan transaksi aktif, lalu muat ulang aplikasi POS.
              </div>
            </div>
            <button
              type="button"
              onClick={applyPwaUpdate}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
            >
              Update
            </button>
          </div>
        </div>
      )}

      {offlineReady && !pwaUpdateAvailable && (
        <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 shadow-lg shadow-emerald-900/10">
            <div className="text-sm font-semibold">
              POS siap digunakan offline.
            </div>
            <button
              type="button"
              onClick={() => setOfflineReady(false)}
              className="rounded-lg px-2 py-1 text-sm font-bold text-emerald-900 hover:bg-emerald-100"
              aria-label="Tutup info offline"
            >
              x
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed right-4 top-20 z-[70] w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-xl shadow-slate-900/10">
          <div
            className={`text-sm font-bold ${
              toast.tone === 'error'
                ? 'text-red-700'
                : toast.tone === 'success'
                  ? 'text-emerald-700'
                  : 'text-slate-900'
            }`}
          >
            {toast.title}
          </div>
          {toast.message && (
            <div className="mt-1 text-sm text-slate-600">
              {toast.message}
            </div>
          )}
        </div>
      )}

      <div className={window.location.pathname.startsWith('/customer') ? '' : 'pb-20 lg:pb-0 lg:pt-16'}>
        <OnlineOrderNotifier
          onPendingCountChange={setPendingOnlineOrderCount}
        />

        <Suspense
          fallback={
            <div className="p-6">
              Loading...
            </div>
          }
        >

      <Routes>

        <Route
          path="/customer"
          element={<CustomerHomePage />}
        />

        <Route
          path="/customer/store/:storeId"
          element={<CustomerStorePage />}
        />

        <Route
          path="/customer/cart"
          element={<CustomerCartPage />}
        />

        <Route
          path="/customer/login"
          element={<CustomerLoginPage />}
        />

        <Route
          path="/customer/register"
          element={<CustomerRegisterPage />}
        />

        <Route
          path="/customer/verify-otp"
          element={<CustomerVerifyOtpPage />}
        />

        <Route
          path="/customer/success"
          element={<CustomerSuccessPage />}
        />

        {/* Login */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* POS */}
        <Route
          path="/"
          element={

            <ProtectedRoute
              permissions={['transactions-access']}
            >

              <PosPage />

            </ProtectedRoute>

          }
        />

        {/* TRANSACTION HISTORY */}
        <Route
          path="/transactions"
          element={

            <ProtectedRoute
              permissions={['transactions-access']}
            >

              <TransactionHistoryPage />

            </ProtectedRoute>

          }
        />

        <Route
          path="/online-orders"
          element={
            <ProtectedRoute
              permissions={['online-orders-access']}
            >
              <OnlineOrdersPage />
            </ProtectedRoute>
          }
        />

        {/* Redirect unknown route */}
          <Route
            path="*"
            element={<Navigate to="/" />}
          />


          <Route
            path="/sync-dashboard"
            element={
              protectedPage(
                <SyncDashboardPage />,
                {
                  permissions: ['transactions-access'],
                }
              )
            }
          />

          <Route
            path="/dashboard"
            element={
              protectedPage(
                <DashboardPage />,
                {
                  requireManagerTools: true,
                  permissions: ['dashboard-access'],
                }
              )
            }
          />

          <Route
            path="/audit-logs"
            element={
              protectedPage(
                <AuditLogPage />,
                {
                  requireManagerTools: true,
                  permissions: ['audit-logs-access'],
                }
              )
            }
          />
             <Route

                path="/transaction/:id"

                element={

                  protectedPage(
                    <TransactionDetailPage />,
                    {
                      permissions: ['transactions-access'],
                    }
                  )

                }

              />

              <Route
                path="/reconciliation"
                element={
                  protectedPage(
                    <ReconciliationPage />,
                    {
                      requireManagerTools: true,
                      permissions: [
                        'products-edit',
                        'stock-opnames-access',
                      ],
                    }
                  )
                }
              />

              <Route
                path="/conflicts"
                element={
                  protectedPage(
                    <ConflictResolutionPage />,
                    {
                      requireManagerTools: true,
                      permissions: ['transactions-access'],
                    }
                  )
                }
              />
      </Routes>

        </Suspense>
      </div>

      <AppBottomMenu
        onlineOrderCount={pendingOnlineOrderCount}
      />

    </BrowserRouter>

  );

}
