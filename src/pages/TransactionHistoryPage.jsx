import {
  useEffect,
  useState
} from 'react';

import {
  getTransactions
} from '../services/transactionService';

export default function
TransactionHistoryPage() {

  const [transactions,
    setTransactions] = useState([]);

  async function loadTransactions() {

    try {

      const data =
        await getTransactions();

      setTransactions(data);

    } catch (error) {

      console.log(error);

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
            key={trx.id}
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

                  {trx.invoice}

                </div>

                <div
                  className="
                    text-gray-500
                    text-sm
                  "
                >

                  {
                    trx.cashier?.name
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
                      trx.grand_total
                    ).toLocaleString()
                  }

                </div>

                <div
                  className="
                    text-sm
                    text-gray-500
                  "
                >

                  {trx.created_at}

                </div>

              </div>

            </div>

            <div className="mt-4">

              {trx.details.map((item) => (

                <div
                  key={item.id}
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
                      item.product?.title
                    }

                    {' '}
                    x
                    {' '}
                    {item.qty}

                  </div>

                  <div>

                    Rp {
                      Number(
                        item.price
                      ).toLocaleString()
                    }

                  </div>

                </div>

              ))}

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}