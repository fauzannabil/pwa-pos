export default function ProductCard({ product, onClick }) {

  return (

    <button

      onClick={onClick}
       disabled={product.stock <= 0}

      className="
        bg-white
        rounded-2xl
        shadow-sm
        hover:shadow-lg
        transition
        p-4
        text-left
        w-full
      "

    >

<img
  src={product.image}
  alt={product.title}
  onError={(e) => {
    e.target.src =
      'https://placehold.co/300x300?text=No+Image';
  }}

  className="
    w-full
    h-40
    object-cover
    rounded-xl
    mb-3
  "
/>

      <div className="font-bold text-lg">
        {product.title}
      </div>

      <div className="text-blue-600 font-semibold mt-1">
        Rp {Number(product.sell_price).toLocaleString()}
      </div>

      <div className="text-sm text-gray-500 mt-1">
        Stock: {product.stock <= 0 ? 'Out of Stock' : product.stock}
      </div>

    </button>

  )

}