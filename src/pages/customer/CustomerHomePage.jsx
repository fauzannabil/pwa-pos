import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CustomerShell from '../../components/customer/CustomerShell';
import { fetchCustomerMemberships, fetchPublicStores } from '../../services/customerShopService';
import useCustomerAuthStore from '../../stores/customerAuthStore';
import useCustomerCartStore from '../../stores/customerCartStore';

export default function CustomerHomePage() {
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const setStore = useCustomerCartStore((state) => state.setStore);
  const token = useCustomerAuthStore((state) => state.token);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const [storeResponse, membershipResponse] = await Promise.all([
          fetchPublicStores({ search }),
          token ? fetchCustomerMemberships() : Promise.resolve({ data: [] }),
        ]);
        const membershipByStore = new Map(
          (membershipResponse.data || []).map((membership) => [
            Number(membership.store_id),
            membership,
          ])
        );
        setStores(
          (storeResponse.data || []).map((store) => ({
            ...store,
            membership: store.membership || membershipByStore.get(Number(store.id)) || null,
          }))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search, token]);

  return (
    <CustomerShell title="UNTANPoS" subtitle="Pilih toko untuk pesan take away">
      <section className="px-4 py-5">
        <div className="rounded-[28px] bg-slate-950 px-5 py-6 text-white">
          <p className="text-xs font-black uppercase tracking-wide text-blue-200">
            Customer App
          </p>
          <h2 className="mt-2 text-3xl font-black leading-tight">
            Pesan cepat, ambil di toko.
          </h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-slate-300">
            Cari toko aktif, pilih produk, lalu kirim pesanan ke kasir.
          </p>
        </div>

        <div className="sticky top-[70px] z-20 -mx-4 mt-4 border-y border-slate-100 bg-white px-4 py-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari toko atau tenant..."
            className="h-[52px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h3 className="text-xl font-black">Toko tersedia</h3>
              <p className="text-sm font-semibold text-slate-500">
                {stores.length} toko online aktif
              </p>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-28 animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {stores.map((store) => (
                <Link
                  key={store.id}
                  to={`/customer/store/${store.id}`}
                  onClick={() => setStore(store)}
                  className="block rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition active:scale-[0.99]"
                >
                  <div className="flex gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg font-black text-blue-700">
                      {String(store.name || 'T').slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-lg font-black">{store.name}</h4>
                      <p className="truncate text-sm font-semibold text-slate-500">
                        {store.tenant?.name || '-'}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                        {store.address || 'Alamat toko belum diisi'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {store.membership ? (
                          <>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                              Member {store.membership.member_code || ''}
                            </span>
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                              {(store.membership.points || 0).toLocaleString('id-ID')} poin
                            </span>
                          </>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                            Belum member
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {!stores.length && !error && (
                <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center">
                  <p className="text-base font-black">Belum ada toko online</p>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    Aktifkan Online Shop pada toko dan plan tenant.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </CustomerShell>
  );
}
