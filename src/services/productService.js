import api from '../api/api';

import db from '../db/db';

import {
  getApiErrorMessage,
  validateSyncContext
} from '../utils/saasContext';

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

  } catch {

    return null;

  }

}

function isCacheableProductImage(url) {

  if (!url) {

    return false;

  }

  return !url
    .toLowerCase()
    .includes('/default.jpg');

}

function hasProductScope(context = null) {

  return Boolean(
    context?.tenant_id &&
    context?.store_id
  );

}

function sameId(a, b) {

  return String(a) === String(b);

}

function productSyncCursorKey(context = null) {

  if (!hasProductScope(context)) {

    return 'products_updated_at';

  }

  return `products_updated_at:${context.tenant_id}:${context.store_id}`;

}

function matchesProductScope(product, context = null) {

  if (!hasProductScope(context)) {

    return true;

  }

  return Boolean(
    product?.tenant_id &&
    product?.store_id &&
    sameId(product.tenant_id, context.tenant_id) &&
    sameId(product.store_id, context.store_id)
  );

}

function filterProductsByScope(products, context = null) {

  return (products || []).filter(
    (product) =>
      matchesProductScope(
        product,
        context
      )
  );

}

async function getScopedProductSyncCursor(context = null) {

  const record =

    await db.sync_meta.get(
      productSyncCursorKey(context)
    );

  return record?.value || null;

}

async function setProductSyncCursor(
  value,
  context = null
) {

  if (!value) {

    return;

  }

  await db.sync_meta.put({

    key:
      productSyncCursorKey(context),

    value,

    updated_at:
      new Date()
        .toISOString(),

  });

}

/*
|--------------------------------
| Sync Products
|--------------------------------
*/

export async function syncProducts(context = null) {

  const syncValidation =
    validateSyncContext(
      context
    );

  if (!syncValidation.ok) {

    throw new Error(
      syncValidation.reason
    );

  }

  if (!navigator.onLine) {

    return;

  }

  try {

    const localProducts =

      filterProductsByScope(

        await db.products
          .toArray(),

        context

      );

    const localProductMap =

      new Map(

        localProducts.map(
          (product) => [
            product.id,
            product
          ]
        )

      );

    const shouldRefreshCategoryNames =

      localProducts.some(
        (product) =>
          product.category_id &&
          !product.category_name &&
          !product.category?.name
      );

    const lastUpdatedAt =

      shouldRefreshCategoryNames
        ? null
        : await getScopedProductSyncCursor(
            context
          );

    const response =
      await api.get(
        '/products',
        {
          params:
            lastUpdatedAt
              ? {
                  updated_after:
                    lastUpdatedAt
                }
              : {}
        }
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
    const deletedProductIds = [];
    const updatedAtValues = [];

    for (
      const product
      of apiProducts
    ) {

      if (product.updated_at) {

        updatedAtValues.push(
          product.updated_at
        );

      }

      if (product.deleted_at) {

        deletedProductIds.push(
          product.id
        );

        continue;

      }

      let imageBase64 =
        localProductMap.get(
          product.id
        )?.image || null;

      const existingProduct =

        localProductMap.get(
          product.id
        );

      const imageChanged =

        isCacheableProductImage(
          product.image
        ) &&

        product.image !==
          existingProduct?.image_url;

      try {

        if (
          imageChanged ||
          (
            isCacheableProductImage(
              product.image
            ) &&
            !imageBase64
          )
        ) {

          imageBase64 =

            await imageToBase64(
              product.image
            );

        }

      } catch {}

      products.push({

        ...product,

        image:
          imageBase64,

        image_url:
          product.image,

        last_synced_at:
          new Date()
            .toISOString(),

      });

    }

    if (
      products.length > 0
    ) {

      await db.products.bulkPut(
        products
      );

    }

    if (
      deletedProductIds.length > 0
    ) {

      await db.products.bulkDelete(
        deletedProductIds
      );

    }

    const nextCursor =

      updatedAtValues
        .sort()
        .at(-1);

    await setProductSyncCursor(
      nextCursor,
      context
    );

  } catch (error) {

    const errorMessage =
      getApiErrorMessage(
        error,
        'Product sync failed'
      );

    if (
      [402, 403].includes(
        error?.response?.status
      )
    ) {

      throw error;

    }

  }

}

/*
|--------------------------------
| Get Local Products
|--------------------------------
*/

export async function
getLocalProducts(context = null) {

  return filterProductsByScope(

    await db.products
      .toArray(),

    context

  );

}

/*
|--------------------------------
| Reduce Local Stock
|--------------------------------
*/

export async function
reduceLocalStock(
  items,
  invoiceNo = null,
  context = {}
) {

  for (const item of items) {

    const product =

      await db.products.get(
        Number(item.product_id)
      );

    if (!product) {

      continue;

    }

    if (
      hasProductScope(context) &&
      !matchesProductScope(
        product,
        context
      )
    ) {

      throw new Error(
        'Produk tidak sesuai dengan tenant/store aktif.'
      );

    }

    const currentStock =

      Number(product.stock || 0);

    const qty =

      Number(item.qty || 0);

    const newStock =

      Math.max(
        0,
        currentStock - qty
      );

    await db.products.update(

      Number(item.product_id),

      {
        stock: newStock,
        updated_at:
          new Date()
            .toISOString(),
      }

    );

    await db.stock_movements.add({

      tenant_id:
        context.tenant_id || product.tenant_id || null,

      store_id:
        context.store_id || null,

      terminal_id:
        context.terminal_id || null,

      product_id:
        Number(item.product_id),

      product_name:
        product.title,

      type:
        'SALE',

      qty:
        qty,

      stock_before:
        currentStock,

      stock_after:
        newStock,

      reference_no:
        invoiceNo,

      created_at:
        new Date()

    });

  }

}
