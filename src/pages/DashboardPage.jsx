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

      {/* STATS */}

      <div
        className="
          grid
          grid-cols-4
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

      </div>

  <div className="mb-8">
    <SalesChart />
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