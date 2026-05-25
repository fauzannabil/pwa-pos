import api from '../api/api';

import db from '../db/db';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL;

export async function syncProducts() {

  try {

    const response = await api.get('/products');

    const products = response.data.map((product) => ({
      ...product,
      image: product.image
        ? product.image.replace(
            'http://localhost:8000',BACKEND_URL
         )
        : null,

    }));

    await db.products.clear();

    await db.products.bulkPut(products);

    console.log('Products synced');

  } catch (error) {

    console.log(error);

  }

}

export async function getLocalProducts() {

  return await db.products.toArray();

}

export async function reduceLocalStock(items) {

  for (const item of items) {

    const product =
      await db.products.get(item.product_id);

    if (!product) continue;

    const currentStock =
      Number(product.stock || 0);

    const qty =
      Number(item.qty || 0);

    const newStock =
      Math.max(0, currentStock - qty);

    await db.products.update(
      item.product_id,
      {
        stock: newStock,
      }
    );

  }

}