export default function CartPanel({

  cartItems,
  subtotal,
  increaseQty,
  decreaseQty,
  removeItem,
  onCheckout,
  loadingCheckout,
  paymentMethod,
  setPaymentMethod,
  paidAmount,
  setPaidAmount,
  changeAmount,

})
 {

  const totalItems =
    cartItems.reduce(
      (sum, item) =>
        sum + Number(item.qty || 0),
      0
    );

  const paymentOptions = [
    {
      value: 'cash',
      label: 'Tunai',
    },
    {
      value: 'qris',
      label: 'QRIS',
    },
    {
      value: 'transfer',
      label: 'Transfer',
    },
  ];

  const quickAmounts = [
    5000,
    10000,
    20000,
    50000,
  ];

  const quickAmountLabels = {
    5000: '5K',
    10000: '10K',
    20000: '20K',
    50000: '50K',
  };

  const addQuickAmount = (amount) => {

    setPaidAmount(
      Number(paidAmount || 0) +
      Number(amount || 0)
    );

  };

  return (

    <div className="flex h-full flex-col">

      <div
        className="
          flex
          items-center
          justify-between
          border-b
          border-slate-200
          p-4
        "
      >
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Keranjang
          </h2>
          <p className="text-xs text-slate-500">
            Transaksi berjalan
          </p>
        </div>
        {
          totalItems > 0 && (
            <span
              className="
                rounded-full
                bg-blue-100
                px-2.5
                py-0.5
                text-xs
                font-bold
                text-blue-700
              "
            >
              {totalItems}
              {' '}
              item
            </span>
          )
        }
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">

        {cartItems.length === 0 && (

          <div
            className="
              flex
              h-full
              flex-col
              items-center
              justify-center
              p-6
              text-center
            "
          >
            <div
              className="
                mb-4
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-full
                bg-slate-100
                text-3xl
                text-slate-300
              "
            >
              POS
            </div>
            <div className="font-semibold text-slate-600">
              Keranjang Kosong
            </div>
            <div className="mt-1 text-sm text-slate-400">
              Klik produk untuk menambahkan item
            </div>
          </div>

        )}

        <div className="space-y-2 p-3">

          {cartItems.map((item) => (

          <div
            key={item.id}
            className="
              flex
              items-center
              gap-2
              rounded-lg
              bg-slate-50
              p-3
              shadow-sm
            "
          >

            <div
              className="
                h-12
                w-12
                flex-shrink-0
                overflow-hidden
                rounded-lg
                bg-slate-200
              "
            >
              {
                item.image ? (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                    POS
                  </div>
                )
              }
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-slate-800">
                {item.title}
              </div>
              <div className="mt-0.5 text-xs text-slate-500">
                Rp
                {' '}
                {Number(item.sell_price || 0).toLocaleString()}
                {' x '}
                {item.qty}
              </div>
              <div className="mt-1 text-xs font-bold text-blue-600">
                Rp {(item.sell_price * item.qty).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-1">

              <button
                type="button"
                onClick={() =>
                  removeItem(item.id)
                }
                aria-label={`Hapus ${item.title} dari keranjang`}
                title="Hapus item"
                className="
                  flex
                h-9
                w-9
                  items-center
                  justify-center
                  rounded-lg
                  bg-rose-50
                  text-rose-600
                  transition
                  hover:bg-rose-100
                  hover:text-rose-700
                "
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v5" />
                  <path d="M14 11v5" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => decreaseQty(item.id)}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  bg-slate-200
                  text-lg
                  font-black
                  text-slate-600
                "
              >
                -
              </button>

              <div className="w-9 text-center text-sm font-black text-slate-800">
                {item.qty}
              </div>

              <button
                type="button"
                onClick={() => increaseQty(item.id)}
                disabled={item.qty >= item.stock}
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-lg
                  bg-slate-200
                  text-lg
                  font-black
                  text-slate-600
                  disabled:opacity-40
                "
              >
                +
              </button>

            </div>

          </div>

          ))}

        </div>

      </div>

      <div
        className="
          flex-shrink-0
          border-t
          border-slate-200
          bg-slate-50
          p-3
        "
      >

        <div className="mb-2 flex items-center justify-between text-sm">

          <span className="text-slate-500">
            Subtotal
          </span>

          <span className="font-semibold text-slate-800">
            Rp {subtotal.toLocaleString()}
          </span>

        </div>

<div className="mt-3">
  <label className="mb-2 block text-xs font-semibold text-slate-600">
    Metode Pembayaran
  </label>

  <div className="grid grid-cols-3 gap-2">
    {paymentOptions.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() =>
          setPaymentMethod(option.value)
        }
        className={`
          rounded-xl
          border-2
          p-2
          text-sm
          font-semibold
          transition
          ${
            paymentMethod === option.value
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }
        `}
      >
        {option.label}
      </button>
    ))}
  </div>

</div>

{
  paymentMethod === 'cash' && (
    <div className="mt-3 flex items-center gap-2">
      <div className="shrink-0 text-xs font-semibold text-slate-600">
        Nominal
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-4 gap-1.5">
        {quickAmounts.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() =>
              addQuickAmount(amount)
            }
            className="
              h-8
              rounded-lg
              border
              border-slate-200
              bg-white
              px-2
              text-xs
              font-black
              text-slate-700
              shadow-sm
              transition
              hover:border-blue-300
              hover:bg-blue-50
              hover:text-blue-700
            "
          >
            +{quickAmountLabels[amount]}
          </button>
        ))}
      </div>

      {paidAmount > 0 && (
        <button
          type="button"
          onClick={() =>
            setPaidAmount(0)
          }
          className="
            h-8
            shrink-0
            rounded-lg
            bg-rose-50
            px-2
            text-xs
            font-bold
            text-rose-600
            hover:bg-rose-100
          "
        >
          Reset
        </button>
      )}
    </div>
  )
}

<div className="mt-3 grid grid-cols-2 gap-2">

  <div>

    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
      Jumlah Bayar
    </label>

    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
        Rp
      </span>
      <input
        type="number"
        value={
          paidAmount > 0
            ? paidAmount
            : ''
        }
        onChange={(e) =>
          setPaidAmount(
            e.target.value === ''
              ? 0
              : Number(e.target.value)
          )
        }
        placeholder="0"
        className="
          h-10
          w-full
          rounded-xl
          border
          border-slate-200
          bg-white
          pl-8
          pr-2
          text-sm
          font-bold
          outline-none
          focus:border-blue-500
          focus:ring-2
          focus:ring-blue-500/20
        "
      />
    </div>

  </div>

  <div>
    <label className="mb-1.5 block text-xs font-semibold text-slate-600">
      Change
    </label>
    <div
      className="
        flex
        h-10
        items-center
        rounded-xl
        bg-emerald-50
        px-3
        text-sm
        font-black
        text-emerald-600
      "
    >
      Rp {changeAmount.toLocaleString()}
    </div>
  </div>

</div>

<div className="mt-3 flex items-center justify-between">
  <span className="font-semibold text-slate-800">
    Total
  </span>
  <span className="text-xl font-bold text-blue-600">
    Rp {subtotal.toLocaleString()}
  </span>
</div>

<button
  onClick={onCheckout}
  disabled={loadingCheckout}
  className="
    mt-2.5
    w-full
    h-12
    bg-gradient-to-r
    from-blue-500
    to-blue-600
    text-white
    rounded-xl
    font-semibold
    text-base
    shadow-lg
    shadow-blue-500/20
    disabled:bg-gray-400
    disabled:shadow-none
  "
>

  {
    loadingCheckout
      ? 'Processing...'
      : 'Checkout'
  }

</button>

      </div>

    </div>

  )

}
