import db from '../db/db';
import {
  validateSyncContext
} from '../utils/saasContext';

export async function addStockMovement(

  productId,
  productName,
  qty,
  beforeStock,
  afterStock,
  movementType,
  referenceNo = null,
  context = null

) {

  const syncValidation =
    validateSyncContext(
      context
    );

  if (!syncValidation.ok) {

    throw new Error(
      syncValidation.reason
    );

  }

  await db.stock_movements.add({

    tenant_id:
      context.tenant_id,

    store_id:
      context.store_id,

    terminal_id:
      context.terminal_id,

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

export async function getStockMovements(context = null) {

  const syncValidation =
    validateSyncContext(
      context
    );

  if (!syncValidation.ok) {

    throw new Error(
      syncValidation.reason
    );

  }

  const movements =
    await db.stock_movements

    .orderBy('created_at')

    .reverse()

    .toArray();

  return movements.filter(
    (movement) =>
      String(movement.tenant_id) === String(context.tenant_id) &&
      String(movement.store_id) === String(context.store_id) &&
      String(movement.terminal_id) === String(context.terminal_id)
  );

}
