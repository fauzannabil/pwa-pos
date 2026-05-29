function ProductCard({
  product,
  onClick
}) {

  return (

    <div
      onClick={onClick}
      className="
        bg-white
        rounded-xl
        shadow
        hover:shadow-lg
        transition
        cursor-pointer
        overflow-hidden
        border
      "
    >

      <div
        className="
          h-40
          bg-gray-100
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
                "

              />

            )

            : (

              <div
                className="
                  text-gray-400
                  text-sm
                "
              >

                No Image

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
            justify-between
            items-center
          "
        >

          <div
            className="
              text-green-600
              font-bold
            "
          >

            Rp
            {' '}
            {Number(
              product.sell_price || 0
            ).toLocaleString()}

          </div>

          <div
            className="
              text-xs
              text-gray-500
            "
          >

            Stock:
            {' '}
            {product.stock}

          </div>

        </div>

      </div>

    </div>

  );

}

export default ProductCard;