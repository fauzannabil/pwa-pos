import {
  useEffect,
  useMemo,
  useState
} from 'react';

import { getAuditLogs } from '../services/auditService';
import {
  getTransactionScope
} from '../services/transactionService';
import useAuthStore from '../stores/authStore';

export default function AuditLogPage() {

  const tenant =
    useAuthStore(
      (state) =>
        state.tenant
    );

  const store =
    useAuthStore(
      (state) =>
        state.store
    );

  const terminal =
    useAuthStore(
      (state) =>
        state.terminal
    );

  const context =
    useMemo(() =>
      getTransactionScope({
      tenant,
      store,
      terminal,
    }), [
      tenant,
      store,
      terminal
    ]);

  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const filteredLogs = logs.filter(
      (log) =>
        log.transaction_uuid
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
        ||
        log.event
          ?.toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );


    useEffect(() => {

    async function loadLogs() {

      const data =
        await getAuditLogs(
          context
        );

      setLogs(data);

    }

    loadLogs();

    const interval = setInterval(

      loadLogs,

      5000

    );

    return () => clearInterval(interval);

  }, [context]);

  return (

    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">

        Audit Logs

      </h1>
      <input

        type="text"

        placeholder="Search UUID atau Event"

        value={search}

        onChange={(e) =>

          setSearch(
            e.target.value
          )

        }

        className="
          border
          rounded-lg
          px-4
          py-2
          mb-4
          w-full
        "

      />

      <div className="overflow-auto">

        <div
  className="
    grid
    grid-cols-4
    gap-4
    mb-4
  "
>

  <div className="bg-blue-100 p-4 rounded-xl">

    <div className="text-sm">

      Total Logs

    </div>

    <div className="text-2xl font-bold">

      {logs.length}

    </div>

  </div>

  <div className="bg-green-100 p-4 rounded-xl">

    <div className="text-sm">

      Synced

    </div>

    <div className="text-2xl font-bold">

      {

        logs.filter(

          l =>

            l.event ===

            'TRANSACTION_SYNCED'

        ).length

      }

    </div>

  </div>

  <div className="bg-orange-100 p-4 rounded-xl">

    <div className="text-sm">

      Retry

    </div>

    <div className="text-2xl font-bold">

      {

        logs.filter(

          l =>

            l.event ===

            'TRANSACTION_RETRY'

        ).length

      }

    </div>

  </div>

  <div className="bg-red-100 p-4 rounded-xl">

    <div className="text-sm">

      Failed

    </div>

    <div className="text-2xl font-bold">

      {

        logs.filter(

          l =>

            l.event ===

            'TRANSACTION_FAILED'

        ).length

      }

    </div>

  </div>

</div>

        <table className="w-full border">

          <thead>

            <tr className="bg-gray-100">

              <th className="border p-2">
                Time
              </th>

              <th className="border p-2">
                UUID
              </th>

              <th className="border p-2">
                Event
              </th>

              <th className="border p-2">
                Metadata
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredLogs.map((log) => (

              <tr key={log.id}>

                <td className="border p-2">

                  {new Date(
                    log.created_at
                  ).toLocaleString()}

                </td>

                <td className="border p-2">

                  {log.transaction_uuid}

                </td>

                <td className="border p-2">

                  <span

                    className={`

                      px-2

                      py-1

                      rounded-full

                      text-white

                      text-xs

                      ${

                        log.event ===
                        'TRANSACTION_CREATED'

                          ? 'bg-blue-500'

                        : log.event ===
                        'TRANSACTION_SYNCED'

                          ? 'bg-green-500'

                        : log.event ===
                        'TRANSACTION_RETRY'

                          ? 'bg-orange-500'

                        : log.event ===
                        'TRANSACTION_FAILED'

                          ? 'bg-gray-700'

                        : 'bg-red-500'

                      }

                    `}

                  >

                    {log.event}

                  </span>

                </td>

                <td className="border p-2">

                  {log.metadata || '-'}

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  );

}
