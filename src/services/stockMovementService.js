import db from '../db/db';

export async function addStockMovement(

  productId,
  productName,
  qty,
  beforeStock,
  afterStock,
  movementType,
  referenceNo = null

) {

  await db.stock_movements.add({

    product_id: productId,

    product_name: productName,

    qty,

    before_stock: beforeStock,

    after_stock: afterStock,

    movement_type: movementType,

    reference_no: referenceNo,

    created_at: new Date()

  });

}

export async function getStockMovements() {

  return await db.stock_movements

    .orderBy('created_at')

    .reverse()

    .toArray();

}