import {

  useEffect,
  useState,

} from 'react';

import {

  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,

} from 'recharts';

import {

  getWeeklySales,

} from '../../services/transactionService';

export default function
SalesChart() {

  const [

    data,
    setData,

  ] = useState([]);

  async function
  loadChart() {

    const result =

      await getWeeklySales();

    setData(result);

  }

  useEffect(() => {

    loadChart();

  }, []);

  return (

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
          mb-6
        "
      >

        Weekly Revenue

      </h2>

      <div
        className="
          w-full
          h-80
        "
      >

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <LineChart
            data={data}
          >

            <CartesianGrid
              strokeDasharray="3 3"
            />

            <XAxis
              dataKey="day"
            />

            <YAxis />

            <Tooltip />

            <Line

              type="monotone"

              dataKey="total"

              strokeWidth={3}

            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>

  );

}