import {
  useEffect,
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

import Receipt
from '../components/receipt/Receipt';

import { v4 as uuidv4 } from 'uuid';

import {
  syncProducts,
  getLocalProducts
} from '../services/productService';

import {
  saveLocalTransaction,
  syncPendingTransactions,
  countPendingTransactions
} from '../services/transactionService';



export default function
PosPage() {

  const [
    products,
    setProducts
  ] = useState([]);

  const [
    keyword,
    setKeyword
  ] = useState('');

  const [
    searchKeyword,
    setSearchKeyword
  ] = useState('');

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
    selectedCustomer,
    setSelectedCustomer
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
    lastTransaction,
    setLastTransaction
  ] = useState(null);

  const user =
    useAuthStore(
      (state) =>
        state.user
    );

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

  const clearCart =
    useCartStore(
      (state) =>
        state.clearCart
    );

  const receiptRef =
    useRef();

  /*
  |--------------------------------
  | Load Products
  |--------------------------------
  */

async function
loadProducts() {

  /*
  |-----------------------------
  | Load local FIRST
  |-----------------------------
  */

  const localProducts =

    await getLocalProducts();

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

  syncProducts()

    .then(async () => {

      const updatedProducts =

        await getLocalProducts();

      setProducts(
        updatedProducts
      );

      console.log(
        'Background sync done'
      );

    })

    .catch((error) => {

      console.log(error);

    });

}

  /*
  |--------------------------------
  | Pending Count
  |--------------------------------
  */

  async function
  refreshPendingCount() {

    const count =

      await countPendingTransactions();

    setPendingCount(
      count
    );

  }

  /*
  |--------------------------------
  | Check Backend
  |--------------------------------
  */

  async function
  checkBackendOnline() {

    try {

      const API_URL =

        import.meta.env
          .VITE_API_URL;

      const response =

        await fetch(

          `${API_URL}/ping`,

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

    } catch (error) {

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

    }

    init();

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

  /*
  |--------------------------------
  | Print Receipt
  |--------------------------------
  */

  function handlePrint() {

    window.print();

  }

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

    if (loadingCheckout) {

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

        alert(
          'Cash is not enough'
        );

        return;

      }

    }

    setLoadingCheckout(
      true
    );

    try {

      const transaction = {
        
        transaction_uuid:  uuidv4(),
        
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

      await saveLocalTransaction(
        transaction
      );


      // save receipt data

      setLastTransaction(
        transaction
      );

      // sync if online

    // [TANDA PERUBAHAN]: Logika Sync yang lebih aman
        if (navigator.onLine) {
            try {
                // Kita await sync tapi jangan biarkan error sync menggagalkan status checkout di UI
                await syncPendingTransactions();
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

      // print receipt

      setTimeout(() => {

        handlePrint();

      }, 300);

      // [TANDA PERUBAHAN]: Beri feedback lebih jelas jika sedang offline
        if (!navigator.onLine) {
            alert('Transaction saved locally (Offline). It will sync automatically when online.');
        } else {
            alert('Transaction success');
        }

    } catch (error) {


        console.log(error);

        alert(

          error.message ||

          'Transaction failed'

        );

    } finally {

      setLoadingCheckout(
        false
      );

    }

  }

  /*
  |--------------------------------
  | Auto Barcode
  |--------------------------------
  */

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

      addItem(
        exactProduct
      );

      setKeyword('');

    }

  }, [

    keyword,
    products,
    addItem

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

  const filteredProducts =

    products.filter(
      (product) => {

        const search =

          searchKeyword.toLowerCase();

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

                <Link
                  to="/sync-dashboard"
                  className="
                    bg-orange-600
                    text-white
                    px-3
                    py-2
                    rounded-lg
                    text-sm
                  "
                >

                  Sync

                </Link>

                <LogoutButton />

              </div>

            </div>

            <ProductSearch

              keyword={keyword}

              setKeyword={
                setKeyword
              }

            />

        <div
          className="
            grid
            grid-cols-3
            gap-4
          "
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

                  onClick={() =>
                    addItem(
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

      {/* PRINT AREA */}

      <div
        className="
          print-area
        "
      >

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