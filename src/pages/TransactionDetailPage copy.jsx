import { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import db from '../db/db';

import { getAuditLogs }
from '../services/auditService';

export default function
TransactionDetailPage() {

  const { id } =
    useParams();

  const [transaction,
    setTransaction] =
      useState(null);

  const [auditLogs,
    setAuditLogs] =
      useState([]);

  useEffect(() => {

    async function loadData() {

      const trx =
        await db.transactions.get(
          Number(id)
        );

      setTransaction(trx);

      const logs =
        await getAuditLogs();

      setAuditLogs(

        logs.filter(

          log =>

            log.transaction_uuid ===
            trx?.transaction_uuid

        )

      );

    }

    loadData();

  }, [id]);

  if (!transaction) {

    return (

      <div className="p-6">

        Loading...

      </div>

    );

  }

  return (

    <div className="p-6">

      <h1
        className="
          text-3xl
          font-bold
          mb-6
        "
      >

        Transaction Detail

      </h1>

      <div
        className="
          bg-white
          rounded-xl
          shadow
          p-4
          mb-6
        "
      >

        <div>

          Invoice:

          {transaction.invoice_no}

        </div>

        <div>

          UUID:

          {transaction.transaction_uuid}

        </div>

        <div>

          Status:

          {transaction.sync_status}

        </div>

        <div>

          Retry Count:

          {transaction.retry_count || 0}

        </div>

        <div>

          Total:

          Rp

          {Number(
            transaction.total
          ).toLocaleString()}

        </div>

      </div>

      <div
        className="
          bg-white
          rounded-xl
          shadow
          p-4
          mb-6
        "
      >

        <h2
          className="
            font-bold
            mb-4
          "
        >

          Items

        </h2>

        <table
          className="
            w-full
          "
        >

          <thead>

            <tr>

              <th>Product</th>

              <th>Qty</th>

              <th>Price</th>

            </tr>

          </thead>

          <tbody>

            {

              transaction.items?.map(

                (item,index)=>(

                  <tr key={index}>

                    <td>

                      {

                        item.product_title

                        ||

                        item.title

                      }

                    </td>

                    <td>

                      {item.qty}

                    </td>

                    <td>

                      {

                        Number(
                          item.price
                        )
                        .toLocaleString()

                      }

                    </td>

                  </tr>

                )

              )

            }

          </tbody>

        </table>

      </div>

      <div
        className="
          bg-white
          rounded-xl
          shadow
          p-4
        "
      >

        <h2
          className="
            font-bold
            mb-4
          "
        >

          Audit Logs

        </h2>

        {

          auditLogs.map(

            log => (

              <div
                key={log.id}
                className="
                  border-b
                  py-2
                "
              >

                <div>

                  {log.event}

                </div>

                <div
                  className="
                    text-sm
                    text-gray-500
                  "
                >

                  {

                    new Date(
                      log.created_at
                    )
                    .toLocaleString()

                  }

                </div>

              </div>

            )

          )

        }

      </div>

    </div>

  );

}