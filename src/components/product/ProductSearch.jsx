import { useEffect, useRef } from 'react';

export default function ProductSearch({

  keyword,
  setKeyword,

}) {

  const inputRef = useRef(null);

  useEffect(() => {

    inputRef.current.focus();

  }, []);

  useEffect(() => {

    inputRef.current.focus();

  }, [keyword]);

  return (

    <div className="mb-6">

      <input

        ref={inputRef}

        type="text"

        placeholder="Scan barcode atau cari produk..."

        value={keyword}

        onChange={(e) => setKeyword(e.target.value)}

        className="
          w-full
          bg-white
          border
          rounded-2xl
          p-4
          text-lg
          shadow-sm
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
        "

      />

    </div>

  )

}