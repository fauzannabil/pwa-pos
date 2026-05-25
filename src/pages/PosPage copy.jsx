import { useEffect, useState, useRef } from 'react';

import useCartStore from '../stores/cartStore';
import useAuthStore from '../stores/authStore';

import PosLayout from '../components/layout/PosLayout';
import ProductCard from '../components/product/ProductCard';
import CartPanel from '../components/cart/CartPanel';
import ProductSearch from '../components/product/ProductSearch';
import LogoutButton from '../components/auth/LogoutButton';
import Receipt from '../components/receipt/Receipt';
import {
  syncProducts,
  getLocalProducts,
  reduceLocalStock
} from '../services/productService';
import {
  saveLocalTransaction,
  syncPendingTransactions,getPendingCount,
} from '../services/transactionService';

import { Link } from 'react-router-dom';
import useSyncStore from '../stores/syncStore';

export default function PosPage() {
  const API_URL =  import.meta.env.VITE_API_URL;

  const [products, setProducts] =
    useState([]);

  const [keyword, setKeyword] =
    useState('');

  const [loadingCheckout,
    setLoadingCheckout] =
      useState(false);

  const [paymentMethod,
    setPaymentMethod] =
      useState('cash');

  const [paidAmount,
    setPaidAmount] =
      useState(0);

  const [selectedCustomer,
    setSelectedCustomer] =
      useState(null);
  
  const [serverOnline, setServerOnline] =
      useState(true);
  
  const [pendingCount, setPendingCount] =
    useState(0);

  const [lastTransaction,
    setLastTransaction] =
      useState(null);

  const user =
    useAuthStore(
      (state) => state.user
    );

/*     async function checkServer() {
      try {
        await api.get('/ping');
        setServerOnline(true);
      } catch (error) {
        setServerOnline(false);
      }
    } */

  async function checkServer() {
      try {
        const response = await fetch(
          `${API_URL}/ping`,

          {
            method: 'GET',
          }

        );
        if (response.ok) {
          setServerOnline(true);
        } else {
          setServerOnline(false);
        }
      } catch (error) {
        setServerOnline(false);
      }
    }

  const addItem =
    useCartStore(
      (state) => state.addItem
    );

  const cartItems =
    useCartStore(
      (state) => state.items
    );

  const increaseQty =
    useCartStore(
      (state) => state.increaseQty
    );

  const decreaseQty =
    useCartStore(
      (state) => state.decreaseQty
    );

  const clearCart =
    useCartStore(
      (state) => state.clearCart
    );

  const receiptRef = useRef();

  const online =
  useSyncStore(
    (state) => state.online
  );

  const setOnline =
  useSyncStore(
    (state) => state.setOnline
  );
  
  async function refreshPendingCount() {
    const count =
      await getPendingCount();
    setPendingCount(count);
  }

  useEffect(() => {
      checkServer();
      const interval = setInterval(() => {
        checkServer();
      }, 5000);
      return () => clearInterval(interval);
    }, []);

  // load products

  useEffect(() => {

    async function loadProducts() {

      await syncProducts();

      const localProducts =
        await getLocalProducts();

      setProducts(localProducts);

    }

    loadProducts();
    refreshPendingCount();

  }, []);

  // subtotal

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

  // change

  const changeAmount =
    Math.max(
      0,
      paidAmount - subtotal
    );

  // print

  function handlePrint() {

    window.print();

  }

  // checkout

  async function handleCheckout() {

    if (
      paymentMethod === 'cash'
    ) {

      if (
        paidAmount < subtotal
      ) {

        alert(
          'Cash is not enough'
        );

        return;

      }

    }

    // prevent double click

    if (loadingCheckout)
      return;

    // cart empty

    if (
      cartItems.length === 0
    ) {

      return;

    }

    setLoadingCheckout(true);

    try {

      const transaction = {

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
            item => ({

              product_id:
                item.id,

              qty:
                item.qty,

              price:
                item.sell_price,

            })
          ),

      };

      // save local

      await saveLocalTransaction(
        transaction
      );

      await reduceLocalStock(
        transaction.items
      );

      // save receipt data

      setLastTransaction(
        transaction
      );

      // sync server

      const synced =
        await syncPendingTransactions();

      console.log(
        'Synced:',
        synced
      );

      await refreshPendingCount();
      // reload products

      await syncProducts();

      const localProducts =
        await getLocalProducts();

      setProducts(localProducts);
      await refreshPendingCount();
      // clear cart

      clearCart();

      // print receipt

      setTimeout(() => {

        handlePrint();

      }, 300);

      alert(
        'Transaction success'
      );

    } catch (error) {

      console.log(error);

      alert(
        'Transaction failed'
      );

    } finally {

      setLoadingCheckout(false);

    }

  }

  // auto add barcode

  useEffect(() => {

    if (!keyword) return;

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

      addItem(exactProduct);

      setKeyword('');

    }

  }, [
    keyword,
    products,
    addItem
  ]);

  // filter product

  const filteredProducts =
    products.filter(
      (product) => {

        const search =
          keyword.toLowerCase();

        return (

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

      }
    );

  // auto sync online

  useEffect(() => {

    async function handleOnline() {

      await syncPendingTransactions();

      await syncProducts();

      const localProducts =
        await getLocalProducts();

      setProducts(localProducts);

    }

    window.addEventListener(
      'online',
      handleOnline
    );

    return () => {

      window.removeEventListener(
        'online',
        handleOnline
      );

    };

  }, []);

  useEffect(() => {

    function handleOnline() {

      setOnline(true);

    }

    function handleOffline() {

      setOnline(false);

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

  useEffect(() => {

      const interval = setInterval(
        async () => {

          if (navigator.onLine) {

            await syncPendingTransactions();

          }

        },

        30000
      );

      return () => {

        clearInterval(interval);

      };

  }, []);

  return (

    <>

      <PosLayout

        left={

          <div>

            <div
              className="
                flex
                justify-between
                items-center
                mb-6
              "
            >

              <div>

                <h1
                  className="
                    text-4xl
                    font-bold
                  "
                >
                  POS SYSTEM
                </h1>

                <div
                  className="
                    text-gray-500
                  "
                >

                  Login:
                  {' '}
                  {user?.name}

                </div>
                <div
                  className={
                    serverOnline
                      ? 'text-green-600 font-bold'
                      : 'text-red-600 font-bold'
                  }
                >

                  {
                    serverOnline
                      ? 'ONLINE'
                      : 'OFFLINE'
                  }

                </div>

                <div
                  className="
                    text-sm
                    font-semibold
                    text-orange-600
                  "
                >

                  Pending Sync:
                  {' '}
                  {pendingCount}

                </div>

              </div>

              <div
                className="
                  flex
                  gap-2
                "
              >

                <Link
                  to="/transactions"
                  className="
                    bg-gray-700
                    text-white
                    px-3
                    py-2
                    rounded-lg
                    text-sm
                  "
                >

                  History

                </Link>

                <LogoutButton />

              </div>

            </div>
        
            <ProductSearch
              keyword={keyword}
              setKeyword={setKeyword}
            />

            <div
              className="
                grid
                grid-cols-3
                gap-4
              "
            >

              {filteredProducts.map(
                (product) => (

                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() =>
                      addItem(product)
                    }
                  />

                )
              )}

            </div>

          </div>

        }

        right={

          <CartPanel

            cartItems={cartItems}

            subtotal={subtotal}

            increaseQty={
              increaseQty
            }

            decreaseQty={
              decreaseQty
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

      {/* print receipt */}

      <div className="print-area hidden print:block">

        <div ref={receiptRef}>

          <Receipt
            transaction={
              lastTransaction
            }
          />

        </div>

      </div>

    </>

  );

}