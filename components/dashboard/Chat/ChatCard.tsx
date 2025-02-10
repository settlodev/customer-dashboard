import React from "react";
import Image from "next/image";
import { ShoppingCartIcon, TrendingUpIcon } from "lucide-react";
import { SoldItems } from "@/types/dashboard/type";

interface Props {
  SoldItems: SoldItems[];
}

const SoldItemsCard: React.FC<Props> = ({ SoldItems }) => {
  const isValidImageUrl = (image: string) => {
    return (
      image &&
      (image.startsWith('http://') ||
        image.startsWith('https://') ||
        image.startsWith('/'))
    );
  };

  return (
    <div className="col-span-12 rounded-lg border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark xl:col-span-4">
      <div className="flex items-center justify-between p-4 border-b border-stroke dark:border-strokedark">
        <div className="flex items-center gap-3">
          <TrendingUpIcon className="w-5 h-5 text-primary" />
          <h4 className="text-xl font-semibold text-black dark:text-white">
            Top Sold Items
          </h4>
        </div>
        <span className="px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full">
          Today&lsquo;s Best
        </span>
      </div>

      <div className="p-4">
        {SoldItems?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {SoldItems.slice(0, 5).map((item, key) => (
              <div
                className="flex flex-col p-3 transition-all duration-300 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-meta-4/30 dark:hover:bg-meta-4/50"
                key={key}
              >
                <div className="relative w-full mb-3">
                  <div className="relative pt-[100%] w-full">
                    {isValidImageUrl(item.imageUrl) ? (
                      <Image
                        fill
                        src={item.imageUrl}
                        alt={item.productName}
                        className="rounded-lg object-cover absolute inset-0"
                      />
                    ) : (
                      <div className="absolute inset-0 rounded-lg bg-primary/20 flex items-center justify-center">
                        <ShoppingCartIcon className="w-12 h-12 text-primary" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-primary text-white text-xs font-bold rounded-full">
                      {key + 1}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-sm font-bold text-black capitalize dark:text-white line-clamp-2">
                    {item.productName}
                  </h5>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary">
                      TSH {Intl.NumberFormat("en").format(item.price)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.soldDate).toLocaleString('en-US', {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <ShoppingCartIcon className="w-12 h-12 text-gray-400" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No items sold yet today
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoldItemsCard;