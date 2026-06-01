import { useEffect, useState } from 'react';

import { useParams } from 'react-router-dom';

import db from '../db/db';

import { getAuditLogs } from '../services/auditService';

import { voidTransaction } from '../services/transactionService';

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

  /*
  |--------------------------------
  | PRINT RECEIPT
  |--------------------------------
  */

  function printReceipt() {
    const logoUrl = `${window.location.origin}/logo-untanpos.png`;

      if (!transaction) return;

      const itemsHtml =

        (transaction.items || [])

          .map(

            item => `

              <div style="margin-bottom:6px">

                <div class="item-name">

                  ${
                    item.product_name ||
                    item.product_title ||
                    item.title ||
                    '-'
                  }

                </div>

                <div class="row">

                  <span>

                    ${item.qty} x Rp ${Number(
                      item.price || 0
                    ).toLocaleString()}

                  </span>

                  <span>

                    Rp ${Number(
                      (item.qty || 0) *
                      (item.price || 0)
                    ).toLocaleString()}

                  </span>

                </div>

              </div>

            `

          )

          .join('');

      const trxDate =
            new Date(
              transaction.transaction_time
            ).toLocaleString(
              'id-ID'
      );


      const html = `

        <html>

          <head>

            <title>

              Receipt ${transaction.invoice_no}

            </title>

          <style>

            body {

              width: 58mm;
              font-family: "Courier New", monospace;
              font-size: 12px;
              margin: 0;
              padding: 5px;

            }

            .center {

              text-align: center;

            }

            .line {

              border-top: 1px dashed #000;
              margin: 5px 0;

            }

            .row {

              display: flex;
              justify-content: space-between;

            }

            .item-name {

              font-weight: bold;

            }

            .total {

              font-size: 13px;
              font-weight: bold;

            }

            .invoice {
              font-size: 10px;
              letter-spacing: -0.5px;
              font-weight: bold;
            }

          </style>

          </head>

          <body>

            <div class="center">
            <img
              src="${logoUrl}"
              style="
                width:120px;
                margin-bottom:6px;
              "
            >


              <div>

                Universitas Tanjungpura Pontianak

              </div>

              <div>

                Telp: 095179945179

              </div>

            </div>

            <hr>

            <table
              style="
                width:100%;
                font-size:12px;
                margin-top:4px;
              "
            >

              <tr>

                <td style="width:45px">

                  Invoice

                </td>

                <td style="width:10px">

                  :

                </td>

                <td class="invoice">

                  ${transaction.invoice_no}

                </td>

              </tr>

              <tr>

                <td>

                  Date

                </td>

                <td>

                  :

                </td>

                <td>

                  ${new Date(
                    transaction.transaction_time
                  ).toLocaleString('id-ID')}

                </td>

              </tr>

              <tr>

                <td>

                  Cashier

                </td>

                <td>

                  :

                </td>

                <td>

                  ${transaction.cashier_name || 'Administrator'}

                </td>

              </tr>

            </table>

            <div class="line"></div>

               ${itemsHtml}

            <div class="line"></div>
            <div>

              Payment :

              ${transaction.payment_method || 'Cash'}

            </div>

            <div class="row total">

              <span>Total</span>

              <span>

                Rp ${Number(
                  transaction.total || 0
                ).toLocaleString()}

              </span>

            </div>
<div class="row total">

  <span>Paid:</span>

  <span>

    Rp ${Number(
      transaction.paid_amount || 0
    ).toLocaleString()}

  </span>

</div>

<div class="row total">

  <span>Change:</span>

  <span>

    Rp ${Number(
      transaction.change_amount || 0
    ).toLocaleString()}

  </span>

</div>





            <hr>

            <div class="center">

              Thank You

              <br><br>

              Barang yang sudah dibeli

              <br>

              tidak dapat ditukar

              <br>

              atau dikembalikan

            </div>
              <div align="center"
                style="
                  font-size:16px;
                  font-weight:bold;
                "
              >

                UNTANPOS

              </div>
          </body>

        </html>

      `;

      const printWindow =

        window.open(
          '',
          '_blank'
        );

      printWindow.document.write(
        html
      );

      printWindow.document.close();

      printWindow.focus();

      printWindow.print();

  }

  async function handleVoid() {

    const reason =

      prompt(

        'Void Reason'
      );

    if (!reason) {

      return;

    }

    const confirmVoid =

      confirm(

        'Void this transaction?'
      );

    if (!confirmVoid) {

      return;

    }

    try {

      await voidTransaction(

        transaction.id,

        reason

      );

      alert(

        'Transaction voided'

      );

      window.location.reload();

    } catch (error) {

      alert(

        error.message

      );

    }

  }


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
            mb-6
        "
        >

        <button

            onClick={printReceipt}

            className="
            bg-green-600
            text-white
            px-4
            py-2
            rounded-lg
            "

        >

            Print Receipt

        </button>

        <button

            onClick={handleVoid}

            disabled={transaction.void_status}

            className={`

              px-4
              py-2
              rounded-lg
              text-white
              ml-2

              ${

                transaction.void_status

                ? 'bg-gray-400'

                : 'bg-red-600'

              }

            `}

          >

            {

              transaction.void_status

                ? 'VOIDED'

                : 'Void Transaction'

            }

        </button>

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

        <div class="invoice">

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

        <div>

          Paid :

          Rp {Number(
            transaction.paid_amount || 0
          ).toLocaleString()}

        </div>

        <div>

          Change :

          Rp {Number(
            transaction.change_amount || 0
          ).toLocaleString()}

        </div>

        <div>

          Cashier :

          { 
            transaction.cashier_name|| 'Administrator'
          }

        </div>

        <div>

            Void Status :

            {

              transaction.void_status

                ? 'YES'

                : 'NO'

            }

          </div>
          {

            transaction.void_status && (

              <>

                <div>

                  Void Reason :

                  {

                    transaction.void_reason

                  }

                </div>

                <div>

                  Void At :

                  {

                    new Date(

                      transaction.void_at

                    ).toLocaleString()

                  }

                </div>

              </>

            )

          }

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

                        item.product_name

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