import {
  useEffect,
  useState
} from 'react';

import db from '../db/db';

import {  
  syncPendingTransactions,
  forceRetryTransaction,
   deleteTransaction
  } from '../services/transactionService';

import { addAuditLog } from '../services/auditService';

import { Link } from 'react-router-dom';
import { exportTransactionsToExcel  } from '../services/exportService';

export default function
SyncDashboardPage() {

  const [transactions,
    setTransactions] =
      useState([]);

  const [loading,
    setLoading] =
      useState(false);

  const [filter,
    setFilter] =
      useState('all');

  async function
  loadTransactions() {

    const data =

      await db.transactions

        .orderBy(
          'created_at'
        )

        .reverse()

        .toArray();

    setTransactions(data);

  }

    useEffect(() => {

      loadTransactions();

      const interval = setInterval(

        () => {

          loadTransactions();

        },

        5000

      );



      return () => clearInterval(interval);

    }, []);

  async function
  handleRetry() {

    setLoading(true);

    try {

      await syncPendingTransactions();

      await loadTransactions();

      alert(
        'Sync completed'
      );

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);

    }

  }

  async function
    handleForceRetry(id) {

      await forceRetryTransaction(id);

      await loadTransactions();

  }

  async function
      handleDelete(trx) {

        const confirmDelete =

          confirm(

            `Delete transaction ${trx.invoice_no}?`

          );

        if (!confirmDelete) {

          return;

        }

        try {

          await deleteTransaction(
            trx.id
          );

          await addAuditLog(

            trx.transaction_uuid,

            'TRANSACTION_DELETED'

          );

          await loadTransactions();

        } catch (error) {

          console.log(error);

        }

    }

  const pendingCount =

    transactions.filter(

      (trx) =>

        trx.sync_status ===
        'pending'

    ).length;

  const retryCount =

    transactions.filter(

      (trx) =>

        trx.sync_status ===
        'retry'

    ).length;

  const conflictCount =

    transactions.filter(

      (trx) =>

        trx.sync_status ===
        'conflict'

    ).length;

  const syncedCount =

    transactions.filter(

      (trx) =>

        trx.sync_status ===
        'synced'

    ).length;

    const failedCount =

    transactions.filter(

      (trx) =>

        trx.sync_status ===
        'failed'

    ).length;

    const syncingCount =

      transactions.filter(

        (trx) =>

          trx.sync_status ===
          'syncing'

    ).length;

    const totalCount = transactions.length;

          const filteredTransactions =

        filter === 'all'

          ? transactions

          : transactions.filter(

              trx =>

                trx.sync_status ===
                filter

         );

  return (

    <div
      className="
        p-6
      "
     >

      <div
        className="
          flex
          justify-between
          items-center
          mb-6
        "
       >

        <h1
          className="
            text-3xl
            font-bold
          "
        >

          Sync Dashboard

        </h1>

<div className="flex gap-2">

  <button

    onClick={loadTransactions}

    className="
      bg-gray-600
      text-white
      px-4
      py-2
      rounded-lg
    "

  >

    Refresh

  </button>

  <button

    onClick={handleRetry}

    disabled={loading}

    className="
      bg-blue-600
      text-white
      px-4
      py-2
      rounded-lg
    "

  >

    {

      loading
        ? 'Syncing...'
        : 'Retry Sync'

    }

  </button>

  <button

      onClick={() =>

        exportTransactionsToExcel(
          transactions
        )

      }

      className="
        bg-green-600
        text-white
        px-4
        py-2
        rounded-lg
      "

    >

      Export Excel

  </button>
  
</div>

      </div>

    <div
        className="
          grid
          grid-cols-7
          gap-4
          mb-6
        "
      >

        {/* Pending */}

        <div
          className="
            bg-yellow-100
            p-4
            rounded-xl
          "
        >

          <div className="text-sm">

            Pending

          </div>

          <div
            className="
              text-3xl
              font-bold
            "
          >

            {pendingCount}

          </div>

        </div>

        {/* Retry */}

        <div
          className="
            bg-orange-100
            p-4
            rounded-xl
          "
        >

          <div className="text-sm">

            Retry

          </div>

          <div
            className="
              text-3xl
              font-bold
            "
          >

            {retryCount}

          </div>

// Conflict

        </div>

        {/* Conflict */}

        <div
          className="
            bg-red-100
            p-4
            rounded-xl
          "
        >

          <div className="text-sm">

            Conflict

          </div>

          <div
            className="
              text-3xl
              font-bold
            "
          >

            {conflictCount}

          </div>

        </div>

        {/* Failed */}

        <div
          className="
            bg-gray-200
            p-4
            rounded-xl
          "
        >

          <div className="text-sm">

            Failed

          </div>

          <div
            className="
              text-3xl
              font-bold
            "
          >

            {failedCount}

          </div>

        </div>

        {/* Synced */}

        <div
          className="
            bg-green-100
            p-4
            rounded-xl
          "
        >

          <div className="text-sm">

            Synced

          </div>

          <div
            className="
              text-3xl
              font-bold
            "
          >

            {syncedCount}

          </div>

        </div>

        <div
          className="
            bg-blue-100
            p-4
            rounded-xl
          "
         >

          <div className="text-sm">

            Syncing

          </div>

          <div
            className="
              text-3xl
              font-bold
            "
           >

            {syncingCount}

          </div>

        </div>

        <div
            className="
              bg-slate-100
              p-4
              rounded-xl
            "
          >

            <div className="text-sm">

              Total

            </div>

            <div
              className="
                text-3xl
                font-bold
              "
            >

              {totalCount}

            </div>

          </div>

      </div>

      <div
        className="
          flex
          gap-2
          mb-6
          flex-wrap
        "
       >

        {

          [

            'all',

            'pending',

            'retry',

            'conflict',

            'failed',

            'synced'

          ].map(status => (

            <button

              key={status}

              onClick={() =>

                setFilter(status)

              }

              className={`

                px-4
                py-2
                rounded-lg

                ${

                  filter === status

                  ? 'bg-blue-600 text-white'

                  : 'bg-gray-200'

                }

              `}

            >

              {status}

            </button>

          ))

        }

      </div>

      <div
        className="
          space-y-4
        "
      >

        {
          filteredTransactions.map(
            (trx) => (

              <div

                key={trx.id}

                className="
                  bg-white
                  shadow
                  rounded-xl
                  p-4
                "
              >

                <div
                  className="
                    flex
                    justify-between
                    mb-2
                  "
                >

                  <div>

                    <div
                      className="
                        font-bold
                      "
                    >

                      {
                        trx.invoice_no
                      }

                    </div>

                    <div
                      className="
                        text-sm
                        text-gray-500
                      "
                    >

                      {
                        trx.transaction_time
                      }

                    </div>

                  </div>

                  <div
                    className={`
                      px-3
                      py-1
                      rounded-lg
                      text-white
                      text-sm

                      ${
                        trx.sync_status === 'synced'

                          ? 'bg-green-500'

                        : trx.sync_status === 'retry'

                          ? 'bg-orange-500'

                        : trx.sync_status === 'conflict'

                          ? 'bg-red-500'

                        : trx.sync_status === 'failed'

                          ? 'bg-gray-700'

                        : trx.sync_status === 'syncing'

                          ? 'bg-blue-500'

                        : 'bg-yellow-500'
                      }
                    `}
                  >

                    {
                      trx.sync_status
                    }

                  </div>

                </div>

                <div
                  className="
                    text-sm
                  "
                 >

                  Retry:
                  {' '}
                  {
                    trx.retry_count || 0
                  }

                </div>



                <div
                  className="
                    flex
                    gap-2
                    mt-3
                  "
                >

                  <Link

                    to={`/transaction/${trx.id}`}

                    className="
                      bg-blue-500
                      text-white
                      px-3
                      py-1
                      rounded-lg
                      text-sm
                    "

                  >

                    Detail

                  </Link>

                 <button

                      onClick={() =>
                        handleForceRetry(
                          trx.id
                        )
                      }

                      disabled={
                        trx.sync_status !== 'conflict'
                      }

                      className={`
                        px-3
                        py-1
                        rounded-lg
                        text-sm
                        text-white

                        ${
                          trx.sync_status === 'conflict'
                          ? 'bg-red-500'
                          : 'bg-gray-400 cursor-not-allowed'
                        }
                      `}
                    >

                      Force Sync

                    </button>

                                    <button

                    onClick={() =>
                      handleDelete(trx)
                    }

                    disabled={
                      trx.sync_status !== 'failed'
                    }

                    className={`
                    text-sm
                      px-3
                      py-1
                      rounded-lg
                      text-white

                      ${
                        trx.sync_status === 'failed'
                        ? 'bg-red-600'
                        : 'bg-gray-400 cursor-not-allowed'
                      }
                    `}
                  >

                    Delete

                  </button>

                </div>

                {

                  trx.last_error && (

                    <div
                      className="
                        text-red-500
                        text-sm
                        mt-2
                      "
                    >

                      {
                        trx.last_error
                      }

                    </div>

                  )

                }

              </div>

            )
          )
        }

      </div>

    </div>

  );

}