import {
  useEffect,
  useState
} from 'react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import {
  getHourlySales
} from '../../services/transactionService';

export default function
HourlySalesChart() {

  const [data,
    setData] =
      useState([]);

  useEffect(() => {

    async function loadData() {

      const result =

        await getHourlySales();

      setData(result);

    }

    loadData();

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
          text-xl
          font-bold
          mb-4
        "
      >

        Hourly Sales Today

      </h2>

      <ResponsiveContainer
        width="100%"
        height={300}
      >

        <BarChart
          data={data}
        >

          <XAxis
            dataKey="hour"
          />

          <YAxis />

          <Tooltip />

          <Bar
            dataKey="total"
          />

        </BarChart>

      </ResponsiveContainer>

    </div>

  );

}