import { create } from 'zustand';

const useCartStore = create((set) => ({

  items: [],

  addItem: (product) =>

    set((state) => {

      // stock habis
      if (product.stock <= 0) {

        return state;

      }

      const existing = state.items.find(
        (item) => item.id === product.id
      );

      // jika item sudah ada
      if (existing) {

        // qty sudah mencapai stock
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

      // item baru
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

  increaseQty: (id) =>

    set((state) => ({

      items: state.items.map((item) => {

        // stop jika qty >= stock
        if (
          item.id === id &&
          item.qty >= item.stock
        ) {

          return item;

        }

        return item.id === id

          ? {

              ...item,

              qty: item.qty + 1

            }

          : item;

      }),

    })),

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

  clearCart: () =>

    set({

      items: [],

    }),

}));

export default useCartStore;