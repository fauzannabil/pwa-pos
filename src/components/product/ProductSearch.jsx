import { useEffect, useRef } from 'react';

function GridIcon() {

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );

}

function ListIcon() {

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="9" y1="6" x2="21" y2="6" />
      <line x1="9" y1="12" x2="21" y2="12" />
      <line x1="9" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1.5" />
      <circle cx="4" cy="12" r="1.5" />
      <circle cx="4" cy="18" r="1.5" />
    </svg>
  );

}

export default function ProductSearch({

  keyword,
  setKeyword,
  totalProducts = 0,
  visibleProducts = 0,
  categories = [],
  selectedCategory = 'all',
  setSelectedCategory,
  displayMode = 'card',
  setDisplayMode,

}) {

  const inputRef = useRef(null);

  useEffect(() => {

    inputRef.current.focus();

  }, []);

  return (

    <div
      className="
        border-b
        border-slate-200
        bg-white
        p-4
      "
    >

      <div
        className="
          mb-3
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <h2
            className="
              text-lg
              font-bold
              text-slate-900
            "
          >
            Produk
          </h2>
          <p
            className="
              text-xs
              text-slate-500
            "
          >
            {visibleProducts}
            {' '}
            dari
            {' '}
            {totalProducts}
            {' '}
            produk tersedia
          </p>
        </div>

        <div
          className="
            flex
            flex-col
            gap-1
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            p-1.5
          "
        >
          <span
            className="
              px-2
              text-[10px]
              font-black
              uppercase
              tracking-wide
              text-slate-500
            "
          >
            Tampilan
          </span>
          <div
            className="
              flex
              gap-1
            "
          >
            <button
              type="button"
              onClick={() => setDisplayMode?.('card')}
              aria-pressed={displayMode === 'card'}
              aria-label="Tampilkan produk sebagai card"
              title="Card"
              className={`
                inline-flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                transition
                ${
                  displayMode === 'card'
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-100'
                    : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              <GridIcon />
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode?.('list')}
              aria-pressed={displayMode === 'list'}
              aria-label="Tampilkan produk sebagai list"
              title="List"
              className={`
                inline-flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                transition
                ${
                  displayMode === 'list'
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-100'
                    : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              <ListIcon />
            </button>
          </div>
        </div>
      </div>

      <input

        ref={inputRef}

        type="text"

        placeholder="Scan barcode atau cari produk..."

        value={keyword}

        onChange={(e) => setKeyword(e.target.value)}

        className="
          w-full
          h-12
          bg-slate-50
          border
          border-slate-200
          rounded-xl
          px-4
          text-base
          shadow-sm
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500/20
          focus:border-blue-500
        "

      />

      <div
        className="
          mt-3
          flex
          gap-2
          overflow-x-auto
          pb-1
        "
      >
        <button
          type="button"
          onClick={() =>
            setSelectedCategory?.('all')
          }
          className={`
            shrink-0
            rounded-full
            border
            px-4
            py-2.5
            text-xs
            font-bold
            transition
            ${
              selectedCategory === 'all'
                ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
            }
          `}
        >
          Semua
          {' '}
          ({totalProducts})
        </button>

        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            onClick={() =>
              setSelectedCategory?.(category.key)
            }
            className={`
              shrink-0
              rounded-full
              border
              px-4
              py-2.5
              text-xs
              font-bold
              transition
              ${
                selectedCategory === category.key
                  ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
              }
            `}
          >
            {category.label}
            {' '}
            ({category.count})
          </button>
        ))}
      </div>

    </div>

  )

}
