import {
  useEffect,
  useState
} from 'react';

import db from '../db/db';

import {
  syncPendingTransactions
} from '../services/transactionService';

export default function
SyncDashboardPage() {

  const [transactions,
    setTransactions] =
      useState([]);

  const [loading,
    setLoading] =
      useState(false);

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

  const syncedCount =

    transactions.filter(

      (trx) =>

        trx.sync_status ===
        'synced'

    ).length;

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

        <button

          onClick={
            handleRetry
          }

          disabled={
            loading
          }

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

      </div>

      <div
        className="
          grid
          grid-cols-3
          gap-4
          mb-6
        "
      >

        <div
          className="
            bg-yellow-100
            p-4
            rounded-xl
          "
        >

          <div
            className="
              text-sm
            "
          >

            Pending

          </div>

          <div
            className="
              text-3xl
              font-bold
            "
          >

            {
              pendingCount
            }

          </div>

        </div>

        <div
          className="
            bg-orange-100
            p-4
            rounded-xl
          "
        >

          <div
            className="
              text-sm
            "
          >

            Retry

          </div>

          <div
            className="
              text-3xl
              font-bold
            "
          >

            {
              retryCount
            }

          </div>

        </div>

        <div
          className="
            bg-green-100
            p-4
            rounded-xl
          "
        >

          <div
            className="
              text-sm
            "
          >

            Synced

          </div>

          <div
            className="
              text-3xl
              font-bold
            "
          >

            {
              syncedCount
            }

          </div>

        </div>

      </div>

      <div
        className="
          space-y-4
        "
      >

        {
          transactions.map(
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
                      rounded-full
                      text-white
                      text-sm

                      ${
                        trx.sync_status
                        === 'synced'

                          ? 'bg-green-500'

                        : trx.sync_status
                        === 'retry'

                          ? 'bg-orange-500'

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