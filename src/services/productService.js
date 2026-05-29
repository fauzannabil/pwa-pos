import api from '../api/api';

import db from '../db/db';

/*
|--------------------------------
| Convert Image To Base64
|--------------------------------
*/

async function imageToBase64(url) {

  try {

    const response = await fetch(url, {

      mode: 'cors',

      cache: 'no-cache',

    });

    if (!response.ok) {

      return null;

    }

    const blob =
      await response.blob();

    return await new Promise(
      (resolve) => {

        const reader =
          new FileReader();

        reader.onloadend =
          () => {

            resolve(
              reader.result
            );

          };

        reader.readAsDataURL(
          blob
        );

      }
    );

  } catch (error) {

    console.log(
      'Image cache failed:',
      error
    );

    return null;

  }

}

/*
|--------------------------------
| Sync Products
|--------------------------------
*/

export async function syncProducts() {

  if (!navigator.onLine) {

    console.log(
      'Offline mode'
    );

    return;

  }

  try {

    const response =
      await api.get(
        '/products'
      );

    /*
    Laravel Resource:
    {
      data: [...]
    }
    */

    const apiProducts =

      response.data.data;

    const products = [];

    for (
      const product
      of apiProducts
    ) {

      let imageBase64 =
        null;

      try {

        if (product.image) {

          imageBase64 =

            await imageToBase64(
              product.image
            );

        }

      } catch (error) {

        console.log(
          'Image failed:',
          product.id
        );

      }

      products.push({

        ...product,

        image:
          imageBase64,

      });

    }

    await db.products.clear();

    await db.products.bulkPut(
      products
    );

    console.log(
      'Products synced'
    );

  } catch (error) {

    console.log(
      'SYNC ERROR:',
      error
    );

  }

}

/*
|--------------------------------
| Get Local Products
|--------------------------------
*/

export async function
getLocalProducts() {

  return await db.products
    .toArray();

}

/*
|--------------------------------
| Reduce Local Stock
|--------------------------------
*/

export async function
reduceLocalStock(items) {

  for (const item of items) {

    const product =

      await db.products.get(
        item.product_id
      );

    if (!product) {

      continue;

    }

    const currentStock =

      Number(
        product.stock || 0
      );

    const qty =

      Number(
        item.qty || 0
      );

    const newStock =

      Math.max(
        0,
        currentStock - qty
      );

    await db.products.update(

      item.product_id,

      {
        stock: newStock,
      }

    );

  }

}