import { create } from 'zustand';

const useCartStore = create((set) => ({

  items: [],

  /*
  |--------------------------------------------------
  | Add Item
  |--------------------------------------------------
  */

  addItem: (product) =>
    set((state) => {

      const existing = state.items.find(
        (item) => item.id === product.id
      );

      // jika item sudah ada
      if (existing) {

        // cegah melebihi stock
        if (existing.qty >= product.stock) {

          return state;

        }

        return {

          items: state.items.map((item) =>

            item.id === product.id
              ? {
                  ...item,
                  qty: item.qty + 1
                }
              : item

          ),

        };

      }

      // jika stock kosong
      if (product.stock <= 0) {

        return state;

      }

      return {

        items: [

          ...state.items,

          {
            ...product,
            qty: 1,
          }

        ],

      };

    }),

  /*
  |--------------------------------------------------
  | Increase Qty
  |--------------------------------------------------
  */

  increaseQty: (id) =>
    set((state) => ({

      items: state.items.map((item) => {

        if (item.id !== id) {
          return item;
        }

        // cegah melebihi stock
        if (item.qty >= item.stock) {
          return item;
        }

        return {
          ...item,
          qty: item.qty + 1
        };

      }),

    })),

  /*
  |--------------------------------------------------
  | Decrease Qty
  |--------------------------------------------------
  */

  decreaseQty: (id) =>
    set((state) => ({

      items: state.items
        .map((item) =>

          item.id === id
            ? {
                ...item,
                qty: item.qty - 1
              }
            : item

        )
        .filter((item) => item.qty > 0),

    })),

  /*
  |--------------------------------------------------
  | Clear Cart
  |--------------------------------------------------
  */

  clearCart: () =>
    set({

      items: [],

    }),

}));

export default useCartStore;