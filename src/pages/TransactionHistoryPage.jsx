import {
  useEffect,
  useState
} from 'react';

import {
  getTransactions,
  getLocalTransactions
} from '../services/transactionService';

export default function
TransactionHistoryPage() {

  const [
    transactions,
    setTransactions
  ] = useState([]);

  async function
  loadTransactions() {

    try {

      const data =
        await getTransactions();

      setTransactions(
        data || []
      );

    } catch (error) {

      console.log(error);

      const localTransactions =
        await getLocalTransactions();

      setTransactions(
        localTransactions || []
      );

    }

  }

  useEffect(() => {

    loadTransactions();

  }, []);

  return (

    <div className="p-6">

      <h1
        className="
          text-3xl
          font-bold
          mb-6
        "
      >
        Transaction History
      </h1>

      <div className="space-y-4">

        {transactions.map((trx) => (

          <div
            key={
              trx.id ||
              trx.transaction_uuid
            }
            className="
              bg-white
              rounded-xl
              shadow
              p-4
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
                    text-lg
                  "
                >

                  {
                    trx.invoice ||
                    trx.invoice_no
                  }

                </div>

                <div className="flex gap-2 items-center mt-1">

                  <div
                    className={`
                      text-xs
                      px-2
                      py-1
                      rounded-full
                      text-white

                      ${
                        trx.sync_status === 'synced'
                          ? 'bg-green-500'

                          : trx.sync_status === 'failed'
                          ? 'bg-red-500'

                          : 'bg-orange-500'
                      }
                    `}
                  >

                    {
                      trx.sync_status === 'synced'
                        ? 'SYNCED'

                        : trx.sync_status === 'failed'
                        ? 'FAILED'

                        : 'PENDING'
                    }

                  </div>

                </div>

                <div
                  className="
                    text-gray-500
                    text-sm
                    mt-1
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
                  text-right
                "
              >

                <div
                  className="
                    font-bold
                    text-blue-600
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
                    text-sm
                    text-gray-500
                  "
                >

{

                  trx.created_at
                    ? new Date(
                        trx.created_at
                      ).toLocaleString()

                    : trx.transaction_time
                    ? new Date(
                        trx.transaction_time
                      ).toLocaleString()

                    : '-'

                }

                </div>

              </div>

            </div>

            <div className="mt-4">

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
                      justify-between
                      text-sm
                      border-t
                      py-1
                    "
                  >

                    <div>

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

                    <div>

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

    </div>

  );

}