import Image from "next/image";
import { SoldItems } from "@/types/dashboard/type";
import { ShoppingCartIcon } from "lucide-react";

interface Props {
  SoldItems: SoldItems[];
}

const SolidItemsCard: React.FC<Props> = ({ SoldItems }) => {
  const isValidImageUrl = (image: string) => {
    return (
      image &&
      (image.startsWith('http://') ||
      image.startsWith('https://') ||
      image.startsWith('/'))
    );
  };

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white py-6 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-4">
      <h4 className="mb-3 px-7.5 text-xl font-semibold text-black dark:text-white">
        Top 5 Sold Items
      </h4>

      <div className="flex flex-col gap-2">
        {SoldItems?.length > 0 ? (
          SoldItems.slice(0, 5).map((item, key) => (
            <div
              className="flex items-center justify-center gap-5 px-4 py-1 bg-[#f7f7fd] hover:bg-gray-3 dark:hover:bg-meta-4"
              key={key}
            >
              <div className="relative h-14 w-14 rounded-full">
                {isValidImageUrl(item.image) ? (
                  <Image
                    width={56}
                    height={56}
                    src={item.image}
                    alt="Item"
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-sm bg-emerald-500 flex items-center justify-center">
                    <ShoppingCartIcon />
                  </div>
                )}
              </div>

              <div className="flex flex-1 items-center justify-between">
                <div>
                  <h5 className="text-sm font-bold text-black capitalize dark:text-white">
                    {item.name}
                  </h5>
                  <p className="flex items-center gap-2">
                    <span className="text-sm font-medium text-black dark:text-white">
                      TSH {Intl.NumberFormat("en").format(item.price)}
                    </span>
                    <span className="text-xs font-medium"> 
                      {Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date(item.soldDate))}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No data available
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SolidItemsCard;
