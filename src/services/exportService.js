import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export function
exportTransactionsToExcel(
  transactions
) {

  const summaryRows =

    transactions.map(

      trx => ({

        Invoice:
          trx.invoice_no,

        Date:
          trx.transaction_time,

        Cashier:
          trx.cashier_name,

        Payment:
          trx.payment_method,

        Total:
          trx.total,

        Status:
          trx.sync_status,

      })

    );

  const detailRows = [];

  transactions.forEach(

    trx => {

      (trx.items || [])

        .forEach(item => {

          detailRows.push({

            Invoice:
              trx.invoice_no,

            Date:
              trx.transaction_time,

            Cashier:
              trx.cashier_name,

            Product:
              item.product_name,

            Qty:
              item.qty,

            Price:
              item.price,

            Subtotal:
              item.qty * item.price,

          });

        });

    }

  );

  const workbook =

    XLSX.utils.book_new();

  const summarySheet =

    XLSX.utils.json_to_sheet(
      summaryRows
    );

  const detailSheet =

    XLSX.utils.json_to_sheet(
      detailRows
    );

  XLSX.utils.book_append_sheet(

    workbook,

    summarySheet,

    'Summary'

  );

  XLSX.utils.book_append_sheet(

    workbook,

    detailSheet,

    'Detail Items'

  );

  const excelBuffer =

    XLSX.write(

      workbook,

      {

        bookType: 'xlsx',

        type: 'array'

      }

    );

  const file =

    new Blob(

      [excelBuffer],

      {

        type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

      }

    );

  saveAs(

    file,

    `transactions-${Date.now()}.xlsx`

  );

}