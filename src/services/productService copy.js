import api from '../api/api';

import db from '../db/db';

export async function syncProducts() {

  try {

    const response = await api.get('/products');

    const products = response.data.map((product) => ({
      ...product,
      image: product.image
        ? product.image.replace(
            'http://localhost:8000',
            'http://127.0.0.1:8000'
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