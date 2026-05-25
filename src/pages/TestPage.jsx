import { useEffect, useState } from 'react';
import api from '../api/api';

export default function TestPage() {

  const [products, setProducts] = useState([]);

  useEffect(() => {

    api.get('/products')
      .then((res) => {
        setProducts(res.data);
      })
      .catch((err) => {
        console.log(err);
      });

  }, []);

  return (
    <div>

      <h1>Products</h1>

      {products.map((product) => (
        <div key={product.id}>
          {product.name}
        </div>
      ))}

    </div>
  );
}