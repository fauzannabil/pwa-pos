export default function Receipt({

  transaction,

}) {

  if (!transaction) return null;

  return (

    <div
      id="receipt"
      className="
        bg-white
        p-6
        max-w-sm
        mx-auto
      "
    >

      <div className="text-center mb-4">

        <h1 className="text-2xl font-bold">
          UNTANPoS
        </h1>

        <div className="text-sm">

          Receipt

        </div>

      </div>

      <div className="mb-4 text-sm">

        <div>
          Invoice:
          {' '}
          {transaction.invoice_no}
        </div>

        <div>
          Date:
          {' '}
          {
            new Date(
              transaction.transaction_time
            ).toLocaleString()
          }
        </div>

      </div>

      <div className="border-t border-b py-2">

        {transaction.items.map(
          (item, index) => (

          <div
            key={index}
            className="
              flex
              justify-between
              py-1
            "
          >

            <div>

              {item.title || item.product_id}

              {' '}
              x
              {' '}
              {item.qty}

            </div>

            <div>

              Rp {
                (
                  item.price *
                  item.qty
                ).toLocaleString()
              }

            </div>

          </div>

        ))}

      </div>

      <div className="mt-4 text-sm">

        <div
          className="
            flex
            justify-between
          "
        >

          <div>Total</div>

          <div>

            Rp {
              Number(
                transaction.total
              ).toLocaleString()
            }

          </div>

        </div>

        <div
          className="
            flex
            justify-between
          "
        >

          <div>Paid</div>

          <div>

            Rp {
              Number(
                transaction.paid_amount
              ).toLocaleString()
            }

          </div>

        </div>

        <div
          className="
            flex
            justify-between
          "
        >

          <div>Change</div>

          <div>

            Rp {
              Number(
                transaction.change_amount
              ).toLocaleString()
            }

          </div>

        </div>

      </div>

      <div
        className="
          text-center
          text-sm
          mt-6
        "
      >

        Thank You
        <div className="mt-2 font-bold text-slate-500">
          UNTANPoS
        </div>

      </div>

    </div>

  );

}
