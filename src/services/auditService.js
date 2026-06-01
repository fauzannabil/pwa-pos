import db from '../db/db';

export async function
addAuditLog(

  transactionUuid,

  event,

  metadata = null

) {

  await db.audit_logs.add({

    transaction_uuid:
      transactionUuid,

    event,

    metadata,

    created_at:
      new Date(),

  });

}

export async function
getAuditLogs() {

  return await db.audit_logs

    .orderBy('created_at')

    .reverse()

    .toArray();

}