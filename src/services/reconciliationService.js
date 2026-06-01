import db from '../db/db';
import api from '../api/api';
import {  addAuditLog } from './auditService';

export async function
getStockDifferences() {

  const result = [];

  try {

    const response =

      await api.get(
        '/products'
      );

    const serverProducts =

      response.data.data;

    const localProducts =

      await db.products.toArray();

    for (
      const localProduct
      of localProducts
    ) {

      const serverProduct =

        serverProducts.find(

          p =>

            Number(p.id)

            ===

            Number(
              localProduct.id
            )

        );

      if (!serverProduct) {

        result.push({

          id:
            localProduct.id,

          title:
            localProduct.title,

          local_stock:
            localProduct.stock,

          server_stock:
            null,

          difference:
            localProduct.stock,

          status:
            'missing_on_server'

        });

        continue;

      }

      const diff =

        Number(
          localProduct.stock
        )

        -

        Number(
          serverProduct.stock
        );

      if (diff !== 0) {

        result.push({

          id:
            localProduct.id,

          title:
            localProduct.title,

          local_stock:
            localProduct.stock,

          server_stock:
            serverProduct.stock,

          difference:
            diff,

          status:
            'mismatch'

        });

      }

    }

    return result;

  } catch (error) {

    console.log(error);

    return [];

  }

}

/*
|--------------------------------
| Repair Local Stock
|--------------------------------
*/

export async function
repairLocalStock(

  productId,

  serverProducts = null

) {

  try {

    let products = serverProducts;

    if (!products) {

      const response =

        await api.get(
          '/products'
        );

      products =
        response.data.data;

    }

    const serverProduct =

      products.find(

        p =>

          Number(p.id)

          ===

          Number(productId)

      );

    if (!serverProduct) {

      return false;

    }

    const localProduct =

      await db.products.get(
        Number(productId)
      );

    await db.products.update(

      Number(productId),

        {

          stock:
            serverProduct.stock

        }

    );

    await addAuditLog(

      null,

      'STOCK_REPAIRED',

      JSON.stringify({

        product_id:
          productId,

        old_stock:
          localProduct?.stock || 0,

        new_stock:
          serverProduct.stock

      })

    );

    return {

      success: true,

      oldStock:
        localProduct?.stock || 0,

      newStock:
        serverProduct.stock

    };

  } catch (error) {

    console.log(error);

    return false;

  }

}


export async function
repairAllStocks() {

  try {

    const response =

      await api.get(
        '/products'
      );

    const serverProducts =

      response.data.data;

    const differences =

      await getStockDifferences();

    let repaired = 0;

    for (

      const item

      of differences

    ) {

      const result =

        await repairLocalStock(

          item.id,

          serverProducts

        );

      if (

        result?.success

      ) {

        repaired++;

      }

    }

    return repaired;

  } catch (error) {

    console.log(error);

    return 0;

  }

}