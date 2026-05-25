export default function PosLayout({ left, right }) {

  return (

    <div className="h-screen bg-gray-100">

      <div className="grid grid-cols-12 h-full">

        <div className="col-span-8 p-4 overflow-auto">
          {left}
        </div>

        <div className="col-span-4 bg-white border-l p-4 overflow-auto">
          {right}
        </div>

      </div>

    </div>

  )

}