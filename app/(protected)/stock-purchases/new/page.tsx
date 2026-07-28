import StockPurchaseForm from "@/components/forms/stock_purchase_form";

const page = () => {
  return (
    <div className="flex-1 space-y-4 md:p-8 pt-6 mt-10">
      <StockPurchaseForm item={null} />
    </div>
  );
};
export default page;
