import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CustomerShell from '../../components/customer/CustomerShell';
import { fetchCustomerMemberships, fetchStoreProducts, joinStoreMembership } from '../../services/customerShopService';
import useCustomerAuthStore from '../../stores/customerAuthStore';
import useCustomerCartStore from '../../stores/customerCartStore';

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);

export default function CustomerStorePage() {
  const { storeId } = useParams();
  const [store, setStoreState] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState(null);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const token = useCustomerAuthStore((state) => state.token);
  const addItem = useCustomerCartStore((state) => state.addItem);
  const setStore = useCustomerCartStore((state) => state.setStore);
  const totalQty = useCustomerCartStore((state) => state.totalQty());

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const [response, membershipResponse] = await Promise.all([
          fetchStoreProducts(storeId, { search }),
          token ? fetchCustomerMemberships() : Promise.resolve({ data: [] }),
        ]);
        setStoreState(response.store);
        setStore(response.store);
        setProducts(response.data || []);
        setMembership(
          response.store?.membership ||
            (membershipResponse.data || []).find((item) => Number(item.store_id) === Number(storeId)) ||
            null
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => window.clearTimeout(timer);
  }, [storeId, search, setStore, token]);

  const joinMember = async () => {
    if (!token) {
      setError('Silakan login sebelum bergabung sebagai member toko.');
      return;
    }

    setJoining(true);
    setError('');

    try {
      const response = await joinStoreMembership(storeId);
      setMembership(response.data);
      setStoreState((current) => current ? { ...current, membership: response.data } : current);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  const categories = useMemo(() => {
    const names = products
      .map((product) => product.category?.name)
      .filter(Boolean);

    return ['all', ...Array.from(new Set(names))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (category === 'all') return products;

    return products.filter((product) => product.category?.name === category);
  }, [products, category]);

  return (
    <CustomerShell
      title={store?.name || 'Toko'}
      subtitle={store?.tenant?.name || 'Katalog produk'}
    >
      <section className="px-4 py-5">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-blue-600">
            Take Away
          </p>
          <h2 className="mt-1 text-2xl font-black">{store?.name || 'Memuat toko...'}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {store?.address || 'Pilih produk lalu checkout untuk dikirim ke toko.'}
          </p>
          <div className="mt-4 rounded-2xl bg-slate-50 p-3">
            {membership ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-600">
                    Member toko
                  </p>
                  <p className="text-sm font-black">
                    {membership.member_code || 'Member aktif'} / {membership.tier || 'regular'}
                  </p>
                  <p className="text-xs font-bold text-slate-500">
                    Poin {membership.points || 0}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                  Aktif
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Belum member
                  </p>
                  <p className="text-sm font-bold text-slate-600">
                    Gabung untuk menyimpan poin dan promo toko ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={joinMember}
                  disabled={joining}
                  className="shrink-0 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-black text-white disabled:bg-slate-300"
                >
                  {joining ? 'Memproses' : 'Gabung'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="sticky top-[70px] z-20 -mx-4 mt-4 border-y border-slate-100 bg-white px-4 py-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari produk..."
            className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-black transition ${
                  category === item
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                    : 'border border-slate-200 bg-white text-slate-700'
                }`}
              >
                {item === 'all' ? 'Semua' : item}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-5 space-y-3">
          {loading ? (
            [1, 2, 3, 4].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-3xl bg-slate-100" />
            ))
          ) : (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm"
              >
                <div className="flex gap-3">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-24 w-24 shrink-0 rounded-2xl bg-slate-100 object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-base font-black leading-tight">
                      {product.title}
                    </h3>
                    <p className="mt-1 truncate text-xs font-bold text-slate-500">
                      {product.category?.name || 'Produk'} / Stok {product.stock}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-lg font-black text-blue-600">
                        {formatCurrency(product.sell_price)}
                      </p>
                      <button
                        type="button"
                        onClick={() => addItem(product)}
                        disabled={product.stock < 1}
                        className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:bg-slate-300"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {!loading && !filteredProducts.length && !error && (
            <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-base font-black">Produk tidak ditemukan</p>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Coba kata kunci lain atau pilih kategori berbeda.
              </p>
            </div>
          )}
        </div>

        {totalQty > 0 && (
          <Link
            to="/customer/cart"
            className="fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-sm items-center justify-between rounded-3xl bg-slate-950 px-5 py-4 text-white shadow-2xl shadow-slate-950/25"
          >
            <span className="font-black">{totalQty} item di keranjang</span>
            <span className="rounded-2xl bg-white px-3 py-2 text-sm font-black text-slate-950">
              Checkout
            </span>
          </Link>
        )}
      </section>
    </CustomerShell>
  );
}
