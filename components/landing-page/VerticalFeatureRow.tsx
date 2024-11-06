
type IVerticalFeatureRowProps = {
  title: string;
  description: string;
  image?: string;
  imageAlt: string;
  reverse?: boolean;
  icon?: React.ReactNode;
};

const VerticalFeatureRow = (props: IVerticalFeatureRowProps) => {

  return (
<div className="flex flex-col items-center justify-center lg:grid lg:grid-cols-2 space-y-10">
    <div>
    <div className="flex flex-col items-start justify-center w-full bg-[#FEF8F3] h-[250px] lg:w-[380px] lg:h-50 border-b-4 border-r-4 border-gray-900 rounded-md pl-5 pr-5 pt-3 pb-3 shadow-xl">
    <div className="flex flex-row gap-2 items-center justify-center">
    <p>{props.icon}</p>
    <h3 className="text-[20px] text-start font-medium text-gray-900 lg:font-bold">{props.title}</h3>
    </div>
    <p className="mt-3 text-normal text-start text-[14px] text-gray-900 lg:text-start lg:text-[16px]">{props.description}</p>
    </div>
    </div>
  
</div>
  );
};

export { VerticalFeatureRow };
