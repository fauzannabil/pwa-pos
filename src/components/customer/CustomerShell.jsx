import { NavLink, useNavigate } from 'react-router-dom';
import { logoutCustomer } from '../../services/customerShopService';
import useCustomerAuthStore from '../../stores/customerAuthStore';
import useCustomerCartStore from '../../stores/customerCartStore';

function Icon({ type }) {
  const paths = {
    home: 'M4 10.5 12 4l8 6.5V20H5v-9.5z M9 20v-6h6v6',
    store: 'M4 8h16l-1 12H5L4 8z M7 8V5h10v3 M9 12h6',
    cart: 'M6 6h15l-2 8H8L6 3H3 M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M18 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    order: 'M7 4h10l3 4v12H4V4h3z M14 4v5h6 M8 13h8 M8 17h5',
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
      <path d={paths[type]} />
    </svg>
  );
}

export default function CustomerShell({ children, title = 'UNTANPoS', subtitle = 'Take Away' }) {
  const navigate = useNavigate();
  const store = useCustomerCartStore((state) => state.store);
  const totalQty = useCustomerCartStore((state) => state.totalQty());
  const token = useCustomerAuthStore((state) => state.token);
  const customer = useCustomerAuthStore((state) => state.customer);
  const clearCustomerAuth = useCustomerAuthStore((state) => state.logout);

  const navItems = [
    { to: '/customer', label: 'Beranda', icon: 'home', end: true },
    { to: store?.id ? `/customer/store/${store.id}` : '/customer', label: 'Toko', icon: 'store' },
    { to: '/customer/cart', label: 'Keranjang', icon: 'cart', badge: totalQty },
    { to: '/customer/success', label: 'Order', icon: 'order' },
  ];

  async function handleCustomerAction() {
    if (!token) {
      navigate('/customer/login');
      return;
    }

    try {
      await logoutCustomer();
    } finally {
      clearCustomerAuth();
      navigate('/customer');
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto min-h-screen max-w-md bg-white shadow-2xl shadow-slate-900/10">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/customer')}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-600/20"
              aria-label="Ke beranda customer"
            >
              POS
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-black leading-tight">
                {title}
              </h1>
              <p className="truncate text-xs font-semibold text-slate-500">
                {subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCustomerAction}
              className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"
            >
              {token ? (customer?.name ? customer.name.split(' ')[0] : 'Logout') : 'Login'}
            </button>
          </div>
        </header>

        <main className="pb-24">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-slate-200 bg-white/95 px-3 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_32px_rgba(15,23,42,0.12)] backdrop-blur">
          <div className="grid grid-cols-4 gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `
                  relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-black transition
                  ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }
                `}
              >
                <Icon type={item.icon} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="absolute right-3 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
