import { create }
from 'zustand';

const savedCart =

  JSON.parse(

    localStorage.getItem(
      'pos-cart'
    ) || '[]'

  );

const useCartStore =

  create((set, get) => ({

    items: savedCart,

    /*
    |--------------------------------
    | Save Cart Helper
    |--------------------------------
    */

    saveCart: (items) => {

      localStorage.setItem(

        'pos-cart',

        JSON.stringify(items)

      );

    },

    /*
    |--------------------------------
    | Add Item
    |--------------------------------
    */

    addItem: (product) =>

      set((state) => {

        const existing =

          state.items.find(

            (item) =>

              item.id ===
              product.id

          );

        let newItems = [];

        // existing item

        if (existing) {

          if (

            existing.qty >=
            product.stock

          ) {

            return state;

          }

          newItems =

            state.items.map(

              (item) =>

                item.id ===
                product.id

                  ? {

                      ...item,

                      qty:
                        item.qty + 1,

                    }

                  : item

            );

        } else {

          // stock empty

          if (

            product.stock <= 0

          ) {

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

        localStorage.setItem(

          'pos-cart',

          JSON.stringify(
            newItems
          )

        );

        return {

          items: newItems,

        };

      }),

    /*
    |--------------------------------
    | Increase Qty
    |--------------------------------
    */

    increaseQty: (id) =>

      set((state) => {

        const newItems =

          state.items.map(

            (item) => {

              if (
                item.id !== id
              ) {

                return item;

              }

              if (
                item.qty >=
                item.stock
              ) {

                return item;

              }

              return {

                ...item,

                qty:
                  item.qty + 1,

              };

            }

          );

        localStorage.setItem(

          'pos-cart',

          JSON.stringify(
            newItems
          )

        );

        return {

          items: newItems,

        };

      }),

    /*
    |--------------------------------
    | Decrease Qty
    |--------------------------------
    */

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

        localStorage.setItem(

          'pos-cart',

          JSON.stringify(
            newItems
          )

        );

        return {

          items: newItems,

        };

      }),

    /*
    |--------------------------------
    | Clear Cart
    |--------------------------------
    */

    clearCart: () => {

      localStorage.removeItem(
        'pos-cart'
      );

      set({

        items: [],

      });

    },

  }));

export default useCartStore;