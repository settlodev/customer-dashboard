import { Orders } from "@/types/orders/type";

interface OrderProps {
  orders: Orders[]
}

const TableOne = ({orders}: OrderProps) => {
  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">
        Latest Orders
      </h4>

      <div className="flex flex-col">
        <div className="grid grid-cols-4 rounded-sm bg-gray-2 dark:bg-meta-4 sm:grid-cols-5">
          <div className="p-2 xl:p-3">
            <p className="text-sm font-bold capitalize xsm:text-base">
              Order #
            </p>
          </div>
          
          <div className="hidden lg:flex text-center xl:p-3">
            <p className=" text-sm font-bold capitalize xsm:text-base">
              Closed Date
            </p>
          </div>
          <div className="p-2 text-center xl:p-3">
            <p className="text-sm font-bold capitalize xsm:text-base">
              Amount
            </p>
          </div>
          <div className="p-2 text-center sm:block xl:p-3">
            <p className="text-sm font-bold capitalize xsm:text-base">
              Items
            </p>
          </div>
          <div className="p-2 text-center sm:block xl:p-3">
            <p className="text-sm font-bold capitalize xsm:text-base">
              Status
            </p>
          </div>
        </div>

        {orders.slice(0, 5).map((order, key) => (
          <div
            className={`grid grid-cols-4 sm:grid-cols-5 ${
              key === orders.length - 1
                ? ""
                : "border-b border-stroke dark:border-strokedark"
            }`}
            key={key}
          >
            <div className="flex items-center p-2.5 xl:p-5 cursor-pointer">
              <p className="text-[10px] font-semibold hover:text-sm text-black dark:text-white sm:block">
                {order.orderNumber}
              </p>
            </div>

    
            <div className="hidden lg:flex items-center justify-center p-2 xl:p-3">
              <p className="text-sm text-black dark:text-white">{order.closedDate !== null ? Intl.DateTimeFormat().format(new Date(order.closedDate)) : "-"}</p>
            </div>

            <div className="flex items-center justify-center p-2 xl:p-3">
              <p className="text-sm  text-black dark:text-white">{Intl.NumberFormat().format(order.amount)}/=</p>
            </div>

            <div className="flex items-center justify-center p-2 sm:flex xl:p-3">
              <p className="text-sm text-black dark:text-white">{order.items.length}</p>
            </div>

            <div className="flex items-center justify-center p-2 sm:flex xl:p-3">
    <p className={`text-sm text-white px-2 py-1 rounded ${
        order.orderPaymentStatus === "PAID" ? "bg-emerald-500" :
        order.orderPaymentStatus === "PARTIAL_PAID" ? "bg-amber-50" :
        order.orderPaymentStatus === "NOT_PAID" ? "bg-red-300" : 
        "bg-gray-300" // Fallback for unknown status
    }`}>
        {order.orderPaymentStatus === "PAID" ? "PAID" :
         order.orderPaymentStatus === "PARTIAL_PAID" ? "PARTIAL PAID" :
         order.orderPaymentStatus === "NOT_PAID" ? "NOT PAID" : 
         "Unknown Status"}
    </p>
</div>


          </div>
        ))}
      </div>
    </div>
  );
};

export default TableOne;
