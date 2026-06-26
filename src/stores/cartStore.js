import { create } from 'zustand';

const LEGACY_CART_KEY = 'pos-cart';
const EMPTY_CART_KEY = 'pos-cart:unscoped';

function safeParseCart(key) {
  try {
    const value =
      localStorage.getItem(key);

    if (!value) {
      return [];
    }

    const parsed =
      JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

function cartScopeKey(scope = {}) {
  const {
    tenant_id,
    store_id,
    terminal_id,
    user_id,
    shift_id,
  } = scope;

  if (
    !tenant_id ||
    !store_id ||
    !terminal_id ||
    !user_id ||
    !shift_id
  ) {
    return EMPTY_CART_KEY;
  }

  return [
    'pos-cart',
    tenant_id,
    store_id,
    terminal_id,
    user_id,
    shift_id,
  ].map(String).join(':');
}

function persistCart(key, items) {
  localStorage.setItem(
    key,
    JSON.stringify(items)
  );
}

function removeLegacyCart() {
  localStorage.removeItem(
    LEGACY_CART_KEY
  );
}

const useCartStore =
  create((set, get) => ({

    scopeKey:
      EMPTY_CART_KEY,

    items: [],

    setScope: (scope) => {
      const nextScopeKey =
        cartScopeKey(scope);

      const currentScopeKey =
        get().scopeKey;

      if (nextScopeKey === currentScopeKey) {
        return;
      }

      removeLegacyCart();

      set({
        scopeKey:
          nextScopeKey,
        items:
          safeParseCart(nextScopeKey),
      });
    },

    saveCart: (items) => {
      persistCart(
        get().scopeKey,
        items
      );
    },

    addItem: (product) =>
      set((state) => {
        const existing =
          state.items.find(
            (item) =>
              item.id === product.id
          );

        let newItems;

        if (existing) {
          if (existing.qty >= product.stock) {
            return state;
          }

          newItems =
            state.items.map(
              (item) =>
                item.id === product.id
                  ? {
                      ...item,
                      qty:
                        item.qty + 1,
                    }
                  : item
            );
        } else {
          if (product.stock <= 0) {
            return state;
          }

          newItems = [
            ...state.items,
            {
              ...product,
              qty: 1,
            },
          ];
        }

        persistCart(
          state.scopeKey,
          newItems
        );

        return {
          items:
            newItems,
        };
      }),

    increaseQty: (id) =>
      set((state) => {
        const newItems =
          state.items.map((item) => {
            if (item.id !== id) {
              return item;
            }

            if (item.qty >= item.stock) {
              return item;
            }

            return {
              ...item,
              qty:
                item.qty + 1,
            };
          });

        persistCart(
          state.scopeKey,
          newItems
        );

        return {
          items:
            newItems,
        };
      }),

    decreaseQty: (id) =>
      set((state) => {
        const newItems =
          state.items
            .map((item) =>
              item.id === id
                ? {
                    ...item,
                    qty:
                      item.qty - 1,
                  }
                : item
            )
            .filter(
              (item) =>
                item.qty > 0
            );

        persistCart(
          state.scopeKey,
          newItems
        );

        return {
          items:
            newItems,
        };
      }),

    removeItem: (id) =>
      set((state) => {
        const newItems =
          state.items.filter(
            (item) =>
              item.id !== id
          );

        persistCart(
          state.scopeKey,
          newItems
        );

        return {
          items:
            newItems,
        };
      }),

    clearCart: () => {
      localStorage.removeItem(
        get().scopeKey
      );

      set({
        items: [],
      });
    },

    resetCartScope: () => {
      set({
        scopeKey:
          EMPTY_CART_KEY,
        items: [],
      });
    },

  }));

export default useCartStore;
