import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const priceOf = (product) => Number(product?.sell_price || 0);

const useCustomerCartStore = create(
  persist(
    (set, get) => ({
      store: null,
      items: [],
      lastOrder: null,

      setStore(store) {
        const currentStore = get().store;

        if (currentStore?.id && currentStore.id !== store?.id) {
          set({
            store,
            items: [],
          });
          return;
        }

        set({ store });
      },

      addItem(product) {
        const existing = get().items.find((item) => item.id === product.id);

        if (existing) {
          set({
            items: get().items.map((item) =>
              item.id === product.id
                ? { ...item, qty: item.qty + 1 }
                : item
            ),
          });
          return;
        }

        set({
          items: [
            ...get().items,
            {
              ...product,
              qty: 1,
            },
          ],
        });
      },

      decreaseItem(productId) {
        set({
          items: get()
            .items.map((item) =>
              item.id === productId
                ? { ...item, qty: Math.max(0, item.qty - 1) }
                : item
            )
            .filter((item) => item.qty > 0),
        });
      },

      removeItem(productId) {
        set({
          items: get().items.filter((item) => item.id !== productId),
        });
      },

      clearCart() {
        set({
          items: [],
        });
      },

      saveLastOrder(order) {
        set({
          lastOrder: order,
          items: [],
        });
      },

      updateLastOrder(order) {
        set({
          lastOrder: {
            ...(get().lastOrder || {}),
            ...order,
          },
        });
      },

      total() {
        return get().items.reduce(
          (sum, item) => sum + priceOf(item) * item.qty,
          0
        );
      },

      totalQty() {
        return get().items.reduce((sum, item) => sum + item.qty, 0);
      },
    }),
    {
      name: 'untanpos-customer-cart',
    }
  )
);

export default useCustomerCartStore;
