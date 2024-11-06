import type { ReactNode } from 'react';

type ICTABannerProps = {
  title: string;
  subtitle: string;
  button: ReactNode;
};

const CTABanner = (props: ICTABannerProps) => (
  // <div className="flex flex-col rounded-md bg-primary-100 p-4 text-center sm:flex-row sm:items-center sm:justify-between sm:p-12 sm:text-left">
  <div className='flex flex-col items-center justify-center w-full'>
    <div className="">
      <h2 className="text-xl text-gray-900 text-center font-bold capitalize lg:text-3xl">{props.title}</h2>
      <div className="text-[12px] font-medium text-center text-gray-900  lg:text-xl">{props.subtitle}</div>
    </div>

    <div className="whitespace-no-wrap mt-3 sm:ml-2 sm:mt-0">
      {props.button}
    </div>
  </div>
);

export { CTABanner };
