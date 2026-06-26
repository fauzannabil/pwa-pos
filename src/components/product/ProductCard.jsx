function ProductCard({
  product,
  onClick,
  variant = 'card'
}) {

  const stock =
    Number(product.stock || 0);

  const isOutOfStock =
    stock <= 0;

  const price =
    Number(
      product.sell_price || 0
    ).toLocaleString();

  const categoryName =
    product.category_name ||
    product.category?.name ||
    '';

  const productCode =
    product.sku ||
    product.barcode ||
    product.code ||
    '';

  if (variant === 'list') {

    return (

      <button
        type="button"
        onClick={onClick}
        disabled={isOutOfStock}
        className="
          flex
          w-full
          items-center
          gap-3
          rounded-xl
          border
          border-slate-200
          bg-white
          p-3
          text-left
          shadow-sm
          transition
          hover:border-blue-200
          hover:shadow-md
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >

        <div
          className="
            flex
            h-16
            w-16
            shrink-0
            items-center
            justify-center
            overflow-hidden
            rounded-lg
            bg-slate-100
          "
        >
          {
            product.image
              ? (
                <img
                  src={product.image}
                  alt={product.title}
                  loading="lazy"
                  decoding="async"
                  className="
                    h-full
                    w-full
                    object-cover
                  "
                />
              )
              : (
                <span
                  className="
                    text-xs
                    font-black
                    text-slate-400
                  "
                >
                  POS
                </span>
              )
          }
        </div>

        <div className="min-w-0 flex-1">
          <div
            className="
              truncate
              text-sm
              font-bold
              text-slate-900
            "
          >
            {product.title}
          </div>

          <div
            className="
              mt-1
              flex
              min-w-0
              flex-wrap
              items-center
              gap-x-2
              gap-y-1
              text-[11px]
              font-semibold
              text-slate-500
            "
          >
            {
              categoryName
                ? <span className="truncate">{categoryName}</span>
                : null
            }
            {
              productCode
                ? <span className="truncate">{productCode}</span>
                : null
            }
          </div>

          <div
            className="
              mt-2
              flex
              items-center
              justify-between
              gap-3
            "
          >
            <div
              className="
                text-base
                font-black
                leading-none
                text-blue-600
              "
            >
              Rp {price}
            </div>

            <div
              className={`
                shrink-0
                rounded-full
                px-2.5
                py-1
                text-[11px]
                font-black
                ${
                  isOutOfStock
                    ? 'bg-rose-50 text-rose-600'
                    : stock <= 5
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                }
              `}
            >
              Stok {stock}
            </div>
          </div>
        </div>

      </button>

    );

  }

  return (

    <button
      type="button"
      onClick={onClick}
      disabled={isOutOfStock}
      className="
        text-left
        bg-white
        rounded-xl
        border
        border-slate-200
        shadow-sm
        hover:shadow-md
        hover:border-blue-200
        transition
        cursor-pointer
        overflow-hidden
        group
        disabled:cursor-not-allowed
        disabled:opacity-60
      "
    >

      <div
        className="
          aspect-square
          bg-slate-100
          flex
          items-center
          justify-center
          overflow-hidden
        "
      >

        {

          product.image

            ? (

              <img

                src={product.image}

                alt={product.title}

                loading="lazy"

                decoding="async"

                className="
                  w-full
                  h-full
                  object-cover
                  transition
                  duration-200
                  group-hover:scale-105
                "

              />

            )

            : (

              <div
                className="
                  flex
                  h-full
                  w-full
                  items-center
                  justify-center
                  text-xs
                  font-bold
                  text-slate-400
                "
              >

                POS

              </div>

            )

        }

      </div>

      <div
        className="
          p-3
        "
      >

        <h2
          className="
            font-semibold
            text-sm
            text-slate-800
            line-clamp-2
            min-h-[40px]
          "
        >

          {product.title}

        </h2>

        <div
          className="
            mt-2
            flex
            items-end
            justify-between
            gap-2
          "
        >

          <div
            className="
            text-blue-600
            font-bold
            text-sm
            leading-tight
          "
          >

            Rp
            {' '}
            {price}

          </div>

          <div
            className={`
              shrink-0
              rounded-full
              px-2
              py-1
              text-[11px]
              font-black
              ${
                isOutOfStock
                  ? 'bg-rose-50 text-rose-600'
                  : stock <= 5
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-100 text-slate-600'
              }
            `}
          >

            Stok
            {' '}
            {stock}

          </div>

        </div>

      </div>

    </button>

  );

}

export default ProductCard;
