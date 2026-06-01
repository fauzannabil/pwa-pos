import {

  useEffect,
  useState,

} from 'react';

import {
  Link,
} from 'react-router-dom';

import db from '../db/db';

import {

  getPendingCount,
  getTodayRevenue,
  getTodayTransactions,
  getTopProducts,

} from '../services/transactionService';

import SalesChart
  from '../components/dashboard/SalesChart';

  import HourlySalesChart
from '../components/dashboard/HourlySalesChart';

export default function
DashboardPage() {

  const [

    totalProducts,
    setTotalProducts,

  ] = useState(0);

  const [

    totalTransactions,
    setTotalTransactions,

  ] = useState(0);

  const [

    totalRevenue,
    setTotalRevenue,

  ] = useState(0);

  const [

    pendingCount,
    setPendingCount,

  ] = useState(0);

  const [

    topProducts,
    setTopProducts,

  ] = useState([]);

  const [
    failedCount,
    setFailedCount,
  ] = useState(0);

  async function
  loadDashboard() {

    try {

      /*
      |------------------------------
      | Total Products
      |------------------------------
      */

      const products =

        await db.products
          .toArray();

      setTotalProducts(
        products.length
      );

      /*
      |------------------------------
      | Today Transactions
      |------------------------------
      */

      const transactions =

        await getTodayTransactions();

      setTotalTransactions(
        transactions.length
      );

      /*
      |------------------------------
      | Revenue
      |------------------------------
      */

      const revenue =

        await getTodayRevenue();

      setTotalRevenue(
        revenue
      );

      /*
      |------------------------------
      | Pending Sync
      |------------------------------
      */

      const pending =

        await getPendingCount();

      setPendingCount(
        pending
      );

      /*
      |------------------------------
      | Top Products
      |------------------------------
      */

      const top =

        await getTopProducts();

      setTopProducts(
        top
      );
      /*
      |------------------------------
      | Failed Sync
      |------------------------------
      */

      const failed =

        await db.transactions

          .where('sync_status')

          .equals('failed')

          .count();

      setFailedCount(
        failed
      );




    } catch (error) {

      console.log(error);

    }

  }

  useEffect(() => {

    loadDashboard();

  }, []);

  return (

    <div
      className="
        min-h-screen
        bg-gray-100
        p-6
      "
    >

      {/* HEADER */}

      <div
        className="
          flex
          justify-between
          items-center
          mb-8
        "
      >

        <div>

          <h1
            className="
              text-4xl
              font-bold
            "
          >

            Dashboard

          </h1>

          <div
            className="
              text-gray-500
              mt-1
            "
          >

            POS Analytics

          </div>

        </div>



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

      <div
        className="
          flex
          gap-3
          mb-8
          flex-wrap
        "
      >

        <Link
          to="/transactions"
          className="
            bg-green-600
            text-white
            px-4
            py-2
            rounded-lg
          "
        >

          Transactions

        </Link>

        <Link
          to="/sync-dashboard"
          className="
            bg-orange-600
            text-white
            px-4
            py-2
            rounded-lg
          "
        >

          Sync Dashboard

        </Link>

        <Link
          to="/audit-logs"
          className="
            bg-slate-700
            text-white
            px-4
            py-2
            rounded-lg
          "
        >

          Audit Logs

        </Link>

                <Link
          to="/reconciliation"
          className="
            bg-purple-600
            text-white
            px-4
            py-2
            rounded-lg
          "
        >
          Stock Reconciliation
        </Link>

      </div>
      {/* STATS */}

      <div
        className="
          grid
          grid-cols-6
          gap-4
          mb-8
        "
      >

        {/* PRODUCTS */}

        <div
          className="
            bg-white
            rounded-2xl
            shadow
            p-5
          "
        >

          <div
            className="
              text-gray-500
              text-sm
            "
          >

            Total Products

          </div>

          <div
            className="
              text-4xl
              font-bold
              mt-2
            "
          >

            {totalProducts}

          </div>

        </div>

        {/* TRANSACTIONS */}

        <div
          className="
            bg-white
            rounded-2xl
            shadow
            p-5
          "
        >

          <div
            className="
              text-gray-500
              text-sm
            "
          >

            Transactions Today

          </div>

          <div
            className="
              text-4xl
              font-bold
              mt-2
            "
          >

            {totalTransactions}

          </div>

        </div>

        {/* REVENUE */}

        <div
          className="
            bg-white
            rounded-2xl
            shadow
            p-5
          "
        >

          <div
            className="
              text-gray-500
              text-sm
            "
          >

            Revenue Today

          </div>

          <div
            className="
              text-3xl
              font-bold
              mt-2
              text-green-600
            "
          >

            Rp {

              Number(
                totalRevenue
              ).toLocaleString()

            }

          </div>

        </div>

        {/* PENDING */}

        <div
          className="
            bg-white
            rounded-2xl
            shadow
            p-5
          "
        >

          <div
            className="
              text-gray-500
              text-sm
            "
          >

            Pending Sync

          </div>

          <div
            className="
              text-4xl
              font-bold
              mt-2
              text-orange-500
            "
          >

            {pendingCount}

          </div>

        </div>

        <div
          className="
            bg-white
            rounded-2xl
            shadow
            p-5
          "
        >

          <div
            className="
              text-gray-500
              text-sm
            "
          >

            Failed Sync

          </div>

          <div
            className="
              text-4xl
              font-bold
              mt-2
              text-red-600
            "
          >

            {failedCount}

          </div>

        </div>

        <div
          className="
            bg-white
            rounded-2xl
            shadow
            p-5
          "
        >

          <div
            className="
              text-gray-500
              text-sm
            "
          >

            Avg Transaction

          </div>

          <div
            className="
              text-3xl
              font-bold
              mt-2
              text-indigo-600
            "
          >

            Rp {

              totalTransactions > 0

                ? Math.round(

                    totalRevenue /

                    totalTransactions

                  ).toLocaleString()

                : 0

            }

          </div>

        </div>

      </div>

  <div className="mb-8">
    <SalesChart />
  </div>

  <div className="mb-8">
    <HourlySalesChart />
  </div>

      {/* TOP PRODUCTS */}

      <div
        className="
          bg-white
          rounded-2xl
          shadow
          p-6
        "
      >

        <h2
          className="
            text-2xl
            font-bold
            mb-4
          "
        >

          Top Products

        </h2>

        <div
          className="
            space-y-3
          "
        >

          {

            topProducts.map(

              (item, index) => (

                <div

                  key={index}

                  className="
                    flex
                    justify-between
                    border-b
                    py-2
                  "
                >

                  <div
                    className="
                      font-medium
                    "
                  >

                    {item[0]}

                  </div>

                  <div
                    className="
                      font-bold
                      text-blue-600
                    "
                  >

                    {item[1]}
                    {' '}
                    sold

                  </div>

                </div>

              )

            )

          }

          {

            topProducts.length === 0 && (

              <div
                className="
                  text-gray-500
                "
              >

                No transaction data

              </div>

            )

          }

        </div>

      </div>

    </div>

  );

}