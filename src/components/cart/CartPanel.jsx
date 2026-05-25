export default function CartPanel({

  cartItems,
  subtotal,
  increaseQty,
  decreaseQty,
  onCheckout,
  loadingCheckout,
  paymentMethod,
  setPaymentMethod,
  paidAmount,
  setPaidAmount,
  changeAmount,

})
 {

  return (

    <div className="flex flex-col h-full">

      <h2 className="text-2xl font-bold mb-4">
        Cart
      </h2>

      <div className="flex-1 overflow-auto">

        {cartItems.length === 0 && (

          <div className="text-gray-500">
            Cart kosong
          </div>

        )}

        {cartItems.map((item) => (

          <div
            key={item.id}
            className="
              border-b
              py-3
            "
          >

            <div className="font-semibold">
              {item.title}
            </div>

            <div className="flex items-center gap-2 mt-2">

              <button
                onClick={() => decreaseQty(item.id)}
                className="
                  w-8
                  h-8
                  bg-red-500
                  text-white
                  rounded-lg
                "
              >
                -
              </button>

              <div className="w-8 text-center">
                {item.qty}
              </div>

              <button
                onClick={() => increaseQty(item.id)}
                disabled={item.qty >= item.stock}
                className="
                  w-8
                  h-8
                  bg-green-500
                  text-white
                  rounded-lg
                "
              >
                +
              </button>

            </div>

            <div className="mt-2 text-blue-600 font-bold">

              Rp {(item.sell_price * item.qty).toLocaleString()}

            </div>

          </div>

        ))}

      </div>

      <div className="border-t pt-4 mt-4">

        <div className="text-2xl font-bold">

          Total:
          {' '}
          Rp {subtotal.toLocaleString()}

        </div>
<div className="mt-4">
  <label className="block mb-1">
    Payment Method
  </label>

  <select
    value={paymentMethod}
    onChange={(e) =>
      setPaymentMethod(e.target.value)
    }
    className="
      w-full
      border
      rounded-lg
      p-2
    "
  >

    <option value="cash">
      Cash
    </option>

    <option value="qris">
      QRIS
    </option>

    <option value="transfer">
      Transfer
    </option>

  </select>

</div>

<div className="mt-4">

  <label className="block mb-1">
    Paid Amount
  </label>

  <input
    type="number"
    value={paidAmount}
    onChange={(e) =>
      setPaidAmount(
        Number(e.target.value)
      )
    }
    className="
      w-full
      border
      rounded-lg
      p-2
    "
  />

</div>

<div className="mt-4">

  <label className="block mb-1">
    Change
  </label>

  <div
    className="
      text-2xl
      font-bold
      text-green-600
    "
  >

    Rp {changeAmount.toLocaleString()}

  </div>

</div>

<button
  onClick={onCheckout}
  disabled={loadingCheckout}
  className="
    w-full
    bg-blue-500
    text-white
    py-3
    rounded-lg
    disabled:bg-gray-400
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