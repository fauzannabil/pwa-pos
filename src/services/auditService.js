import db from '../db/db';

function hasScope(context = null) {

  return Boolean(
    context?.tenant_id &&
    context?.store_id &&
    context?.terminal_id
  );

}

function matchesAuditScope(log, context = null) {

  if (!hasScope(context)) {

    return true;

  }

  return Boolean(
    log?.tenant_id &&
    log?.store_id &&
    log?.terminal_id &&
    String(log.tenant_id) === String(context.tenant_id) &&
    String(log.store_id) === String(context.store_id) &&
    String(log.terminal_id) === String(context.terminal_id)
  );

}

export async function
addAuditLog(

  transactionUuid,

  event,

  metadata = null,

  context = {}

) {

  await db.audit_logs.add({

    tenant_id:
      context.tenant_id || null,

    store_id:
      context.store_id || null,

    terminal_id:
      context.terminal_id || null,

    transaction_uuid:
      transactionUuid,

    event,

    metadata,

    created_at:
      new Date(),

  });

}

export async function
getAuditLogs(context = null) {

  const logs =

    await db.audit_logs

    .orderBy('created_at')

    .reverse()

    .toArray();

  return logs.filter(
    (log) =>
      matchesAuditScope(
        log,
        context
      )
  );

}
