import {
  useEffect,
  useCallback,
  useMemo,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import {
  getTransactions,
  getLocalTransactions,
  getTransactionScope
} from '../services/transactionService';

import useAuthStore
  from '../stores/authStore';

import PrintTemplatePreview
from '../components/receipt/PrintTemplatePreview';
import {
  getTransactionStatusClass,
  getTransactionStatusLabel
} from '../utils/transactionStatus';
import {
  filterTransactionsForUser
} from '../utils/authz';

function isOnlineOrderTransaction(trx) {
  return trx?.source === 'online_order' ||
    trx?.order_channel === 'online' ||
    Boolean(trx?.online_order_id || trx?.online_order_number);
}

export default function
TransactionHistoryPage() {

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

  const user =
    useAuthStore(
      (state) =>
        state.user
    );

  const context =
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

  const [
    transactions,
    setTransactions
  ] = useState([]);

  const [
    printTransaction,
    setPrintTransaction
  ] = useState(null);

  const loadTransactions =
    useCallback(async () => {

    try {

      const data =
        await getTransactions(context);

      setTransactions(
        filterTransactionsForUser(
          data || [],
          user
        )
      );

    } catch {

      const localTransactions =
        await getLocalTransactions(context);

      setTransactions(
        filterTransactionsForUser(
          localTransactions || [],
          user
        )
      );

    }

  }, [
    context,
    user
  ]);

  useEffect(() => {

    loadTransactions();

  }, [loadTransactions]);

  return (

    <div className="min-h-screen bg-slate-50 px-3 pb-28 pt-4 sm:px-6 sm:pb-8">

      <div
        className="
          mb-4
          flex
          flex-col
          items-start
          justify-between
          gap-3
          sm:mb-6
          sm:flex-row
          sm:items-center
        "
      >
        <h1
          className="
            text-xl
            font-bold
            text-slate-950
            sm:text-3xl
          "
        >
          Transaction History
        </h1>

        <Link
          to="/"
          className="
            hidden
            rounded-lg
            bg-blue-600
            px-4
            py-2
            text-sm
            font-semibold
            text-white
            hover:bg-blue-700
            sm:inline-flex
          "
        >
          Main POS
        </Link>
      </div>

      <div className="space-y-3 sm:space-y-4">

        {transactions.map((trx) => (

          <div
            key={
              trx.id ||
              trx.transaction_uuid
            }
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-3
              shadow-sm
              sm:p-4
            "
          >

            <div
              className="
                flex
                justify-between
              "
            >

              <div>

                <div
                  className="
                    font-bold
                    text-base
                    leading-tight
                    text-slate-950
                    sm:text-lg
                  "
                >

                  {
                    trx.invoice ||
                    trx.invoice_no
                  }

                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">

                  <div
                    className={`
                      text-[11px]
                      px-2
                      py-1
                      rounded-full
                      font-bold
                      ${getTransactionStatusClass(trx)}
                    `}
                  >

                    {getTransactionStatusLabel(trx)}

                  </div>

                  {isOnlineOrderTransaction(trx) && (
                    <div
                      className="
                        rounded-full
                        bg-sky-100
                        px-2
                        py-1
                        text-[11px]
                        font-bold
                        text-sky-700
                      "
                    >
                      ONLINE
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setPrintTransaction({
                        ...trx,
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
                      })
                    }
                    className="
                      rounded-full
                      bg-slate-800
                      px-3
                      py-1
                      text-[11px]
                      font-bold
                      text-white
                      hover:bg-slate-900
                    "
                  >
                    PRINT
                  </button>

                </div>

                <div
                  className="
                    mt-2
                    text-xs
                    text-slate-500
                    sm:text-sm
                  "
                >

                  PIC:
                  {' '}

                  {
                    trx.cashier?.name ||

                    trx.cashier_name ||

                    '-'
                  }

                </div>

              </div>

              <div
                className="
                  shrink-0
                  text-right
                "
              >

                <div
                  className="
                    font-bold
                    text-blue-600
                    text-sm
                    sm:text-base
                  "
                >

                  Rp {

                    Number(

                      trx.grand_total ||
                      trx.total ||
                      0

                    ).toLocaleString()

                  }

                </div>

                <div
                  className="
                    mt-1
                    max-w-[120px]
                    text-xs
                    leading-snug
                    text-slate-500
                    sm:max-w-none
                    sm:text-sm
                  "
                >

{
                  trx.transaction_time
                    ? new Date(
                        trx.transaction_time
                      ).toLocaleString()

                 : trx.created_at
                    ? new Date(
                        trx.created_at
                      ).toLocaleString()

                    : '-'

                }

                </div>

              </div>

            </div>

            <div className="mt-3 sm:mt-4">

              {

                (
                  trx.details ||

                  trx.items ||

                  []
                )

                .map((item, index) => (

                  <div
                    key={
                      item.id || index
                    }
                    className="
                      flex
                      border-t
                      border-slate-100
                      py-1.5
                      text-xs
                      sm:text-sm
                      flex
                      justify-between
                      gap-3
                    "
                  >

                    <div className="min-w-0 truncate text-slate-700">

                      {

                        item.product?.name ||

                        item.product_name ||

                        item.title ||

                        'Unknown Product'

                      }

                      {' '}

                      x

                      {' '}

                      {item.qty}

                    </div>

                    <div className="shrink-0 font-semibold text-slate-700">

                      Rp {

                        Number(

                          item.price || 0

                        ).toLocaleString()

                      }

                    </div>

                  </div>

                ))

              }

            </div>

          </div>

        ))}

      </div>

      <PrintTemplatePreview
        transaction={printTransaction}
        message="Pilih template bukti transaksi sebelum mencetak."
        onClose={() =>
          setPrintTransaction(null)
        }
      />

    </div>

  );

}
