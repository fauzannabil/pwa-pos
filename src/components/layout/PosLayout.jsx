export default function PosLayout({
  header,
  left,
  right,
  mobileView,
  setMobileView,
  cartCount = 0,
}) {

  return (

    <div
      className="
        h-screen
        flex
        flex-col
        overflow-hidden
        bg-slate-50
        text-slate-900
      "
    >

      {header}

      <div
        className="
          lg:hidden
          flex
          shrink-0
          border-b
          border-slate-200
          bg-white
          shadow-sm
          z-40
        "
      >

        <button
          type="button"
          onClick={() =>
            setMobileView('products')
          }
          className={`
            flex-1
            flex
            items-center
            justify-center
            gap-2
            py-3
            text-sm
            font-semibold
            transition-colors
            ${
              mobileView === 'products'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-slate-500'
            }
          `}
        >
          <span>Produk</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setMobileView('cart')
          }
          className={`
            flex-1
            flex
            items-center
            justify-center
            gap-2
            py-3
            text-sm
            font-semibold
            transition-colors
            ${
              mobileView === 'cart'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-slate-500'
            }
          `}
        >
          <span>Keranjang</span>
          {
            cartCount > 0 && (
              <span
                className="
                  inline-flex
                  min-w-5
                  h-5
                  items-center
                  justify-center
                  rounded-full
                  bg-blue-600
                  px-1.5
                  text-[11px]
                  font-bold
                  text-white
                "
              >
                {cartCount}
              </span>
            )
          }
        </button>

      </div>

      <div
        className="
          flex
          min-h-0
          flex-1
          flex-col
          overflow-hidden
          lg:flex-row
        "
      >

        <div
          className={`
            flex-1
            overflow-hidden
            bg-slate-100
            ${
              mobileView !== 'products'
                ? 'hidden lg:flex lg:flex-col'
                : 'flex flex-col'
            }
          `}
        >
          {left}
        </div>

        <div
          className={`
            w-full
            min-h-0
            flex-col
            overflow-hidden
            border-l
            border-slate-200
            bg-white
            lg:flex
            lg:w-[420px]
            xl:w-[480px]
            ${
              mobileView !== 'cart'
                ? 'hidden lg:flex'
                : 'flex'
            }
          `}
        >
          {right}
        </div>

      </div>

    </div>

  )

}
