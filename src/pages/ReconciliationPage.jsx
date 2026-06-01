import {
useEffect,
useState
} from 'react';

import {
getStockDifferences,
repairLocalStock,
repairAllStocks
} from '../services/reconciliationService';

import {
Link
} from 'react-router-dom';

export default function ReconciliationPage() {

const [data, setData] =
useState([]);

const [summary, setSummary] =
useState({


  totalProducts: 0,

  mismatchProducts: 0,

  missingProducts: 0,

  totalDifference: 0

});


async function loadData() {


const result =

  await getStockDifferences();

setData(result);

setSummary({

  totalProducts:
    result.length,

  mismatchProducts:

    result.filter(

      item =>

        item.status ===
        'mismatch'

    ).length,

  missingProducts:

    result.filter(

      item =>

        item.status ===
        'missing_on_server'

    ).length,

  totalDifference:

    result.reduce(

      (sum, item) =>

        sum +

        Math.abs(
          item.difference
        ),

      0

    )

});


}

async function handleRepair(productId) {


const success =

  await repairLocalStock(
    productId
  );

if (success) {

  await loadData();

  alert(
    'Stock repaired'
  );

}


}

async function handleRepairAll() {


const total =

  await repairAllStocks();

await loadData();

alert(

  `${total} products repaired`

);


}

useEffect(() => {


loadData();


}, []);

return (


<div className="p-6">

  <div
    className="
      flex
      justify-between
      items-center
      mb-6
    "
  >

    <h1
      className="
        text-3xl
        font-bold
      "
    >

      Stock Reconciliation

    </h1>

    <div className="flex gap-2">

      <Link
        to="/dashboard"
        className="
          bg-purple-600
          text-white
          px-4
          py-2
          rounded-lg
        "
      >

        Dashboard

      </Link>

      <Link
        to="/pos"
        className="
          bg-blue-600
          text-white
          px-4
          py-2
          rounded-lg
        "
      >

        Back To POS

      </Link>

    </div>

  </div>

  <div
    className="
      grid
      grid-cols-4
      gap-4
      mb-6
    "
  >

    <div
      className="
        bg-blue-100
        p-4
        rounded-xl
      "
    >

      <div className="text-sm">

        Products

      </div>

      <div
        className="
          text-3xl
          font-bold
        "
      >

        {summary.totalProducts}

      </div>

    </div>

    <div
      className="
        bg-orange-100
        p-4
        rounded-xl
      "
    >

      <div className="text-sm">

        Mismatch

      </div>

      <div
        className="
          text-3xl
          font-bold
        "
      >

        {summary.mismatchProducts}

      </div>

    </div>

    <div
      className="
        bg-red-100
        p-4
        rounded-xl
      "
    >

      <div className="text-sm">

        Missing

      </div>

      <div
        className="
          text-3xl
          font-bold
        "
      >

        {summary.missingProducts}

      </div>

    </div>

    <div
      className="
        bg-yellow-100
        p-4
        rounded-xl
      "
    >

      <div className="text-sm">

        Stock Diff

      </div>

      <div
        className="
          text-3xl
          font-bold
        "
      >

        {summary.totalDifference}

      </div>

    </div>

  </div>

  <button

    onClick={handleRepairAll}

    className="
      bg-blue-600
      text-white
      px-4
      py-2
      rounded-lg
      mb-4
    "

  >

    Repair All

  </button>

  <table
    className="
      w-full
      border
    "
  >

    <thead>

      <tr
        className="
          bg-gray-100
        "
      >

        <th className="border p-2">
          Product
        </th>

        <th className="border p-2">
          Local
        </th>

        <th className="border p-2">
          Server
        </th>

        <th className="border p-2">
          Difference
        </th>

        <th className="border p-2">
          Action
        </th>

      </tr>

    </thead>

    <tbody>

      {

        data.map(item => (

          <tr
            key={item.id}
          >

            <td className="border p-2">

              {item.title}

            </td>

            <td className="border p-2">

              {item.local_stock}

            </td>

            <td className="border p-2">

              {item.server_stock}

            </td>

            <td
              className="
                border
                p-2
                font-bold
              "
            >

              {item.difference}

            </td>

            <td
              className="
                border
                p-2
              "
            >

              <button

                onClick={() =>
                  handleRepair(
                    item.id
                  )
                }

                className="
                  bg-blue-500
                  text-white
                  px-3
                  py-1
                  rounded
                "

              >

                Repair

              </button>

            </td>

          </tr>

        ))

      }

    </tbody>

  </table>

</div>


);

}
