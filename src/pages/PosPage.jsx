import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef
} from 'react';

import {
  Link
} from 'react-router-dom';

import useCartStore
from '../stores/cartStore';

import useAuthStore
from '../stores/authStore';

import PosLayout
from '../components/layout/PosLayout';

import ProductCard
from '../components/product/ProductCard';

import CartPanel
from '../components/cart/CartPanel';

import ProductSearch
from '../components/product/ProductSearch';

import LogoutButton
from '../components/auth/LogoutButton';

import PrintTemplatePreview
from '../components/receipt/PrintTemplatePreview';

import { v4 as uuidv4 } from 'uuid';

import {
  syncProducts,
  getLocalProducts
} from '../services/productService';

import {
  getActiveCashierShift
} from '../services/cashierShiftService';

import {
  //saveLocalTransaction,
  saveTransactionAtomic,
  syncPendingTransactions,
  countPendingTransactions,
  getTransactionScope
} from '../services/transactionService';

import {
  validatePosContext
} from '../utils/saasContext';
import {
  getApiUrl,
  getBackendBaseUrl
} from '../config/apiConfig';
import {
  canUseManagerTools,
  getUserRoles,
  hasAnyPermission
} from '../utils/authz';
import {
  showToast
} from '../utils/uiFeedback';

const PRODUCT_DISPLAY_MODE_KEY =
  'pos_product_display_mode';

export default function
PosPage() {

  const [
    products,
    setProducts
  ] = useState([]);

  const [
    pendingOnlineOrderCount,
    setPendingOnlineOrderCount
  ] = useState(0);

  const [
    keyword,
    setKeyword
  ] = useState('');

  const [
    searchKeyword,
    setSearchKeyword
  ] = useState('');

  const [
    selectedCategory,
    setSelectedCategory
  ] = useState('all');

  const [
    mobileProfileOpen,
    setMobileProfileOpen
  ] = useState(false);

  const [
    productDisplayMode,
    setProductDisplayMode
  ] = useState(() => {

    if (typeof window === 'undefined') {
      return 'card';
    }

    const storedMode =
      localStorage.getItem(
        PRODUCT_DISPLAY_MODE_KEY
      );

    if (
      storedMode === 'list' ||
      storedMode === 'card'
    ) {

      return storedMode;

    }

    return window.innerWidth < 640
      ? 'list'
      : 'card';

  });

  const [
    loadingCheckout,
    setLoadingCheckout
  ] = useState(false);

  const [
    paymentMethod,
    setPaymentMethod
  ] = useState('cash');

  const [
    paidAmount,
    setPaidAmount
  ] = useState(0);

  const [
    selectedCustomer
  ] = useState(null);

  const [
    pendingCount,
    setPendingCount
  ] = useState(0);

  const [
    serverOnline,
    setServerOnline
  ] = useState(
    navigator.onLine
  );

  const [
    subscriptionBlockedMessage,
    setSubscriptionBlockedMessage
  ] = useState('');

  const [
    mobileView,
    setMobileView
  ] = useState('products');

  const [
    checkoutReceipt,
    setCheckoutReceipt
  ] = useState(null);

  const [
    checkoutPrintMessage,
    setCheckoutPrintMessage
  ] = useState('');

  useEffect(() => {

    localStorage.setItem(
      PRODUCT_DISPLAY_MODE_KEY,
      productDisplayMode
    );

  }, [productDisplayMode]);

  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  const tenant =
    useAuthStore(
      (state) =>
        state.tenant
    );

  const store =
    useAuthStore(
      (state) =>
        state.store
    );

  const terminal =
    useAuthStore(
      (state) =>
        state.terminal
    );

  const subscription =
    useAuthStore(
      (state) =>
        state.subscription
    );

  const activeCashierShift =
    useAuthStore(
      (state) =>
        state.activeCashierShift
    );

  const setActiveCashierShift =
    useAuthStore(
      (state) =>
        state.setActiveCashierShift
    );

  const transactionContext =
    useMemo(() =>
      getTransactionScope({
      tenant,
      store,
      terminal,
    }), [
      tenant,
      store,
      terminal
    ]);

  const setCartScope =
    useCartStore(
      (state) =>
        state.setScope
    );

  useEffect(() => {

    setCartScope({
      ...transactionContext,
      user_id:
        user?.id || null,
      shift_id:
        activeCashierShift?.id || null,
    });

  }, [
    setCartScope,
    transactionContext,
    user?.id,
    activeCashierShift?.id,
  ]);

  const addItem =
    useCartStore(
      (state) =>
        state.addItem
    );

  const cartItems =
    useCartStore(
      (state) =>
        state.items
    );

  const increaseQty =
    useCartStore(
      (state) =>
        state.increaseQty
    );

  const decreaseQty =
    useCartStore(
      (state) =>
        state.decreaseQty
    );

  const removeItem =
    useCartStore(
      (state) =>
        state.removeItem
    );

  const clearCart =
    useCartStore(
      (state) =>
        state.clearCart
    );

  const checkoutLockRef =
    useRef(false);

  const backendShiftUrl =
    `${getBackendBaseUrl()}/dashboard/transactions`;

  const refreshActiveShift =
    useCallback(async ({
      silent = false,
    } = {}) => {

      if (!navigator.onLine) {

        if (!silent) {

          showToast({
          title:
            'POS sedang offline',
          message:
            'Shift kasir hanya bisa diperbarui saat koneksi online.',
          tone:
            'error',
          });

        }

        return;

      }

      try {

        const shift =
          await getActiveCashierShift();

        setActiveCashierShift(
          shift
        );

        if (!silent) {

          showToast({
          title:
            shift?.id
              ? 'Shift aktif ditemukan'
              : 'Shift belum aktif',
          message:
            shift?.id
              ? 'POS sudah terhubung ke shift kasir aktif.'
              : 'Buka shift kasir di dashboard, lalu refresh shift lagi.',
          tone:
            shift?.id
              ? 'success'
              : 'error',
          });

        }

      } catch {

        if (!silent) {

          showToast({
          title:
            'Gagal refresh shift',
          message:
            'Periksa koneksi backend dan status login kasir.',
          tone:
            'error',
          });

        }

      }

    }, [
      setActiveCashierShift,
    ]);

  /*
  |--------------------------------
  | Load Products
  |--------------------------------
  */

const loadProducts =
  useCallback(async () => {

  /*
  |-----------------------------
  | Load local FIRST
  |-----------------------------
  */

  const localProducts =

    await getLocalProducts(
      transactionContext
    );

  if (localProducts.length > 0) {

    setProducts(
      localProducts
    );

  }

  /*
  |-----------------------------
  | Background Sync
  |-----------------------------
  */

  syncProducts(
    transactionContext
  )

    .then(async () => {

      const updatedProducts =

        await getLocalProducts(
          transactionContext
        );

      setProducts(
        updatedProducts
      );

    })

    .catch(() => {});

}, [transactionContext]);

  /*
  |--------------------------------
  | Pending Count
  |--------------------------------
  */

  const refreshPendingCount =
    useCallback(async () => {

    const count =

      await countPendingTransactions(
        transactionContext
      );

    setPendingCount(
      count
    );

  }, [transactionContext]);

  /*
  |--------------------------------
  | Check Backend
  |--------------------------------
  */

  async function
  checkBackendOnline() {

    try {

      const response =

        await fetch(

          getApiUrl('ping'),

          {
            method: 'GET',
          }

        );

      const online =
        response.ok;

      setServerOnline(
        online
      );

      return online;

    } catch {

      setServerOnline(
        false
      );

      return false;

    }

  }

  /*
  |--------------------------------
  | Initial Load
  |--------------------------------
  */

  useEffect(() => {

    async function init() {

      loadProducts();

      await refreshPendingCount();

      await checkBackendOnline();

      if (navigator.onLine) {

        await refreshActiveShift({
          silent: true,
        });

      }

    }

    init();

  }, [
    loadProducts,
    refreshPendingCount,
    refreshActiveShift,
  ]);

  useEffect(() => {

    function handleSubscriptionBlocked(event) {

      setSubscriptionBlockedMessage(
        event.detail?.message ||
        'Subscription tenant tidak aktif.'
      );

    }

    window.addEventListener(
      'saas:subscription-blocked',
      handleSubscriptionBlocked
    );

    window.addEventListener(
      'saas:access-blocked',
      handleSubscriptionBlocked
    );

    return () => {

      window.removeEventListener(
        'saas:subscription-blocked',
        handleSubscriptionBlocked
      );

      window.removeEventListener(
        'saas:access-blocked',
        handleSubscriptionBlocked
      );

    };

  }, []);

  /*
  |--------------------------------
  | Online Offline Listener
  |--------------------------------
  */

  useEffect(() => {

    function handleOnline() {

      setServerOnline(
        true
      );

    }

    function handleOffline() {

      setServerOnline(
        false
      );

    }

    window.addEventListener(
      'online',
      handleOnline
    );

    window.addEventListener(
      'offline',
      handleOffline
    );

    return () => {

      window.removeEventListener(
        'online',
        handleOnline
      );

      window.removeEventListener(
        'offline',
        handleOffline
      );

    };

  }, []);

  /*
  |--------------------------------
  | Subtotal
  |--------------------------------
  */

  const subtotal =

    cartItems.reduce(

      (total, item) => {

        return total +

          (
            item.sell_price *
            item.qty
          );

      },

      0

    );

  /*
  |--------------------------------
  | Change Amount
  |--------------------------------
  */

  const changeAmount =

    Math.max(

      0,

      paidAmount -
      subtotal

    );

  const cartCount =
    cartItems.reduce(
      (total, item) =>
        total + Number(item.qty || 0),
      0
    );

  /*
  |--------------------------------
  | Checkout
  |--------------------------------
  */

  async function
  handleCheckout() {

    // empty cart

    if (
      cartItems.length === 0
    ) {

      return;

    }

    // prevent double click

    if (

      loadingCheckout ||

      checkoutLockRef.current

    ) {

      return;

    }

    // cash validation

    if (

      paymentMethod ===
      'cash'

    ) {

      if (
        paidAmount <
        subtotal
      ) {

        showToast({
          title:
            'Pembayaran kurang',
          message:
            'Jumlah bayar belum mencukupi total transaksi.',
          tone:
            'error',
        });

        return;

      }

    }

    const contextValidation =
      validatePosContext({
        tenant,
        store,
        terminal,
        subscription,
      });

    if (!contextValidation.ok) {

      showToast({
        title:
          'POS belum siap',
        message:
          contextValidation.reason,
        tone:
          'error',
      });

      return;

    }

    if (!activeCashierShift?.id) {

      showToast({
        title:
          'Shift kasir belum aktif',
        message:
          'Buka shift kasir di dashboard atau tekan Refresh Shift jika shift sudah dibuka.',
        tone:
          'error',
      });

      return;

    }

    checkoutLockRef.current =
      true;

    setLoadingCheckout(
      true
    );

    try {

      const transaction = {
        
        transaction_uuid:  uuidv4(),

        tenant_id:
          tenant.id,

        store_id:
          store.id,

        terminal_id:
          terminal.id,

        cashier_shift_id:
          activeCashierShift.id,
        
        cashier_id: user?.id,
        cashier_name: user?.name,


        invoice_no:

          'INV-' +

          Date.now() +

          '-' +

          Math.floor(
            Math.random() * 1000
          ),

        customer_id:

          selectedCustomer?.id
          ?? null,

        payment_method:
          paymentMethod,

        paid_amount:

          paymentMethod ===
          'cash'

            ? paidAmount

            : subtotal,

        change_amount:
          changeAmount,

        total:
          subtotal,

        transaction_time:

          new Date()
            .toISOString(),

        items:

          cartItems.map(
            (item) => ({

              product_id:
                item.id,

              qty:
                item.qty,

              price:
                item.sell_price,

              product_name: item.title //utk kemudanan di history transaksi

            })
          ),

      };

      // save local transaction

     // await saveLocalTransaction(
      await saveTransactionAtomic(
        transaction
      );

      // sync if online

    // [TANDA PERUBAHAN]: Logika Sync yang lebih aman
        if (navigator.onLine) {
            try {
                // Kita await sync tapi jangan biarkan error sync menggagalkan status checkout di UI
                await syncPendingTransactions(
                  transactionContext
                );
            } catch (syncError) {
                console.warn("Sync failed but transaction saved locally:", syncError);
                // Jangan alert error di sini agar user tidak bingung, 
                // karena data sudah aman di IndexedDB dan akan di-retry oleh syncService
            }
        }

      // reload products

      await loadProducts();

      // refresh pending

      await refreshPendingCount();

      // clear cart

      clearCart();

      setCheckoutPrintMessage(
        navigator.onLine
          ? 'Transaksi berhasil. Silakan pilih template bukti transaksi untuk dicetak.'
          : 'Transaksi tersimpan lokal. Data akan sync otomatis saat online.'
      );

      setCheckoutReceipt({
        ...transaction,
        store_name:
          store?.name,
        store_address:
          store?.address,
        store_phone:
          store?.phone,
        store_email:
          store?.email,
        store_website:
          store?.website,
        tenant_name:
          tenant?.name,
        terminal_name:
          terminal?.name,
        cashier_shift_id:
          activeCashierShift?.id,
        cashier_shift_opened_at:
          activeCashierShift?.opened_at,
      });

    } catch (error) {

      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error;

        showToast({
          title:
            'Transaksi gagal',
          message:
            backendMessage ||
            error.message ||
            'Transaction failed',
          tone:
            'error',
        });

    } 
    finally {

          setLoadingCheckout(
            false
          );

          checkoutLockRef.current =
            false;

    }

  }

  /*
  |--------------------------------
  | Auto Barcode
  |--------------------------------
  */

  const handleAddProduct =
    useCallback((product) => {

      if (!activeCashierShift?.id) {

        showToast({
          title:
            'Shift kasir belum aktif',
          message:
            'Buka shift kasir sebelum menambahkan item transaksi.',
          tone:
            'error',
        });

        return;

      }

      addItem(
        product
      );

    }, [
      activeCashierShift?.id,
      addItem,
    ]);

  useEffect(() => {

    if (!keyword) {

      return;

    }

    const exactProduct =

      products.find(
        (product) =>

          (
            product.barcode || ''
          )

          .toLowerCase()

          ===

          keyword.toLowerCase()

      );

    if (exactProduct) {

      handleAddProduct(
        exactProduct
      );

      setKeyword('');

    }

  }, [

    keyword,
    products,
    handleAddProduct

  ]);

  useEffect(() => {

    const timer =

      setTimeout(() => {

        setSearchKeyword(
          keyword
        );

      }, 300);

    return () => {

      clearTimeout(timer);

    };

  }, [keyword]);


  /*
  |--------------------------------
  | Filter Products
  |--------------------------------
  */

  const productCategoryKey = (product) => {

    const categoryId =
      product.category_id ||
      product.category?.id ||
      'uncategorized';

    return String(categoryId);

  };

  const productCategoryName = (product) => {

    return (
      product.category_name ||
      product.category?.name ||
      product.category?.title ||
      (
        product.category_id
          ? `Kategori ${product.category_id}`
          : 'Tanpa Kategori'
      )
    );

  };

  const categories =
    useMemo(() => {

      const categoryMap =
        new Map();

      for (const product of products) {

        const key =
          productCategoryKey(product);

        if (!categoryMap.has(key)) {

          categoryMap.set(
            key,
            {
              key,
              label:
                productCategoryName(product),
              count: 0,
            }
          );

        }

        categoryMap.get(key).count += 1;

      }

      return Array.from(
        categoryMap.values()
      ).sort((a, b) =>
        a.label.localeCompare(
          b.label,
          'id-ID'
        )
      );

    }, [products]);

  const filteredProducts =

    products.filter(
      (product) => {

        const search =

          searchKeyword.toLowerCase();

        const matchesCategory =
          selectedCategory === 'all' ||
          productCategoryKey(product) ===
            selectedCategory;

        const matchesSearch =
          (

          (
            product.title || ''
          )

          .toLowerCase()

          .includes(search)

          ||

          (
            product.barcode || ''
          )

          .toLowerCase()

          .includes(search)

          );

        return (
          matchesCategory &&
          matchesSearch
        );

      }
    );

  const posContextValidation =
    validatePosContext({
      tenant,
      store,
      terminal,
      subscription,
    });

  const posAlertMessage =
    subscriptionBlockedMessage ||
    posContextValidation.reason;

  const showManagerTools =
    canUseManagerTools(
      user
    );

  const canAccessOnlineOrders =
    hasAnyPermission(
      user,
      [
        'online-orders-access'
      ]
    );

  const userRoles =
    getUserRoles(
      user
    );

  useEffect(() => {

    function handlePendingOnlineOrders(event) {

      setPendingOnlineOrderCount(
        Number(event.detail?.count || 0)
      );

    }

    window.addEventListener(
      'online-orders:pending-count',
      handlePendingOnlineOrders
    );

    return () => {

      window.removeEventListener(
        'online-orders:pending-count',
        handlePendingOnlineOrders
      );

    };

  }, []);

  const header =
    (
      <header
        className="
          sticky
          top-0
          z-50
          flex
          min-h-16
          flex-col
          gap-3
          border-b
          border-slate-200
          bg-white
          px-4
          py-3
          shadow-sm
          sm:flex-row
          sm:items-center
          sm:justify-between
          lg:px-6
        "
      >
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center lg:gap-6">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-blue-600
                text-sm
                font-bold
                text-white
                shrink-0
              "
            >
              POS
            </div>
            <div className="min-w-0">
              <div className="truncate text-lg font-black leading-tight text-slate-900 sm:text-lg lg:text-xl">
                {store?.name || 'KASIR'}
              </div>
              <div className="mt-1 hidden text-xs leading-snug text-slate-500 sm:flex sm:flex-wrap sm:items-center sm:gap-x-1">
                <span className="truncate">
                  {tenant?.name || '-'}
                </span>
                <span className="hidden sm:inline">/</span>
                <span className="truncate">
                  {terminal?.name || '-'}
                </span>
                <span className="hidden sm:inline">/</span>
                <span className="font-semibold text-slate-600">
                  Shift{' '}
                  {activeCashierShift?.id
                  ? `#${activeCashierShift.id}`
                    : 'Belum aktif'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setMobileProfileOpen(
                  (open) => !open
                )
              }
              className="
                ml-auto
                inline-flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-slate-100
                text-slate-700
                hover:bg-slate-200
                sm:hidden
              "
              aria-label="Detail profil POS"
            >
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
            </button>
          </div>

          {mobileProfileOpen && (
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:hidden">
            <div className="min-w-0 rounded-lg bg-slate-50 px-2.5 py-1.5">
              <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                Tenant
              </div>
              <div className="truncate text-xs font-semibold text-slate-700">
                {tenant?.name || '-'}
              </div>
            </div>
            <div className="min-w-0 rounded-lg bg-slate-50 px-2.5 py-1.5">
              <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                Terminal
              </div>
              <div className="truncate text-xs font-semibold text-slate-700">
                {terminal?.name || '-'}
              </div>
            </div>
            <div className="min-w-0 rounded-lg bg-slate-50 px-2.5 py-1.5">
              <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                Shift
              </div>
              <div className="truncate text-xs font-semibold text-slate-700">
                {activeCashierShift?.id
                  ? `#${activeCashierShift.id}`
                  : 'Belum aktif'}
              </div>
            </div>
            <div className="min-w-0 rounded-lg bg-slate-50 px-2.5 py-1.5">
              <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                Akun
              </div>
              <div className="truncate text-xs font-semibold text-slate-700">
                {user?.name || 'Kasir'}
              </div>
              <div className="truncate text-[11px] font-medium text-slate-500">
                {userRoles.length > 0 ? userRoles.join(', ') : 'pos-user'}
              </div>
            </div>
            <div className="col-span-2 rounded-xl border border-red-100 bg-white p-2">
              <LogoutButton />
            </div>
          </div>
          )}

          <div className="hidden h-8 w-px bg-slate-200 md:block" />

          <div className="hidden md:block">
            <div className="text-sm font-semibold text-slate-700">
              {new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
            <div className="text-xs text-slate-500">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end lg:gap-3">
          <nav className="hidden items-center gap-1 lg:flex">
            {showManagerTools && (
              <Link
                to="/dashboard"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Dashboard
              </Link>
            )}
            {canAccessOnlineOrders && (
              <Link
                to="/online-orders"
                className="relative rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Online
                {pendingOnlineOrderCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-black leading-none text-white shadow-md shadow-red-600/30">
                    {pendingOnlineOrderCount > 99
                      ? '99+'
                      : pendingOnlineOrderCount}
                  </span>
                )}
              </Link>
            )}
            <Link
              to="/transactions"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Riwayat
            </Link>
            <Link
              to="/sync-dashboard"
              className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              Sync
            </Link>
            {showManagerTools && (
              <Link
                to="/conflicts"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                Konflik
              </Link>
            )}
          </nav>

          <div className="hidden h-8 w-px bg-slate-200 lg:block" />

          <div
            className={`
              rounded-lg
              px-3
              py-2
              text-xs
              font-bold
              ${
                serverOnline
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }
            `}
          >
            {serverOnline ? 'ONLINE' : 'OFFLINE'}
          </div>

          {
            pendingCount > 0 && (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                Pending
                {' '}
                {pendingCount}
              </div>
            )
          }

          <div className="hidden border-l border-slate-200 pl-3 text-sm font-semibold text-slate-700 sm:block">
            <div>
              {user?.name || 'Kasir'}
            </div>
            <div className="text-xs font-medium text-slate-500">
              {userRoles.length > 0 ? userRoles.join(', ') : 'pos-user'}
            </div>
          </div>

          <div className="hidden sm:block">
            <LogoutButton />
          </div>
        </div>
      </header>
    );

  return (

    <>

      <PosLayout
        header={header}
        mobileView={mobileView}
        setMobileView={setMobileView}
        cartCount={cartCount}

        left={

          <div className="flex h-full flex-col">

            {
              (
                !posContextValidation.ok ||
                subscriptionBlockedMessage
              ) && (
                <div
                  className="
                    border-b
                    border-rose-200
                    bg-rose-50
                    px-4
                    py-3
                    text-sm
                    font-semibold
                    text-rose-700
                  "
                >
                  {posAlertMessage}
                </div>
              )
            }

            {
              posContextValidation.ok &&
              !activeCashierShift?.id && (
                <div
                  className="
                    flex
                    flex-col
                    gap-3
                    border-b
                    border-amber-200
                    bg-amber-50
                    px-4
                    py-3
                    text-sm
                    text-amber-800
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div className="font-semibold">
                    Shift kasir belum aktif. Buka shift terlebih dahulu sebelum transaksi.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={refreshActiveShift}
                      className="
                        rounded-lg
                        bg-amber-600
                        px-3
                        py-2
                        text-xs
                        font-bold
                        text-white
                        hover:bg-amber-700
                      "
                    >
                      Refresh Shift
                    </button>
                    <a
                      href={backendShiftUrl}
                      className="
                        rounded-lg
                        border
                        border-amber-300
                        bg-white
                        px-3
                        py-2
                        text-xs
                        font-bold
                        text-amber-800
                        hover:bg-amber-100
                      "
                    >
                      Buka Shift di Dashboard
                    </a>
                  </div>
                </div>
              )
            }

            <ProductSearch

              keyword={keyword}

              setKeyword={
                setKeyword
              }

              totalProducts={products.length}
              visibleProducts={filteredProducts.length}
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              displayMode={productDisplayMode}
              setDisplayMode={setProductDisplayMode}

            />

        <div
          className={`
            min-h-0
            flex-1
            overflow-y-auto
            p-4
            ${
              productDisplayMode === 'list'
                ? 'flex flex-col gap-2'
                : 'grid grid-cols-2 content-start gap-3 sm:grid-cols-3 xl:grid-cols-4'
            }
          `}
        >

          {

            filteredProducts.map(
              (product) => (

                <ProductCard

                  key={
                    product.id
                  }

                  product={
                    product
                  }

                  variant={productDisplayMode}

                  onClick={() =>
                    handleAddProduct(
                      product
                    )
                  }

                />

              )
            )

          }

        </div>

          </div>

        }

        right={

          <CartPanel

            cartItems={
              cartItems
            }

            subtotal={
              subtotal
            }

            increaseQty={
              increaseQty
            }

            decreaseQty={
              decreaseQty
            }

            removeItem={
              removeItem
            }

            onCheckout={
              handleCheckout
            }

            loadingCheckout={
              loadingCheckout
            }

            paymentMethod={
              paymentMethod
            }

            setPaymentMethod={
              setPaymentMethod
            }

            paidAmount={
              paidAmount
            }

            setPaidAmount={
              setPaidAmount
            }

            changeAmount={
              changeAmount
            }

          />

        }

      />

      <PrintTemplatePreview
        transaction={checkoutReceipt}
        message={checkoutPrintMessage}
        onClose={() => {
          setCheckoutReceipt(null);
          setCheckoutPrintMessage('');
        }}
      />

    </>

  );

}
