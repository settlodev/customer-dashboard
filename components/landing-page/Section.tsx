import type { ReactNode } from 'react';

type ISectionProps = {
  title?: string;
  description?: string;
  yPadding?: string;
  children: ReactNode;
};

const Section = (props: ISectionProps) => (
  <div
    className={`flex flex-col  ${
      props.yPadding ? props.yPadding : 'py-12'
    }`}
  >
    {(props.title || props.description) && (
      <div className="mb-12 text-center items-center justify-center">
        {props.title && (
          <h2 className="text-[20px] font-bold text-gray-900 lg:text-[36px] lg:font-bold">{props.title}</h2>
        )}
        {props.description && (
          <div className="mt-3 text-[16px] text-center pl-2 text-gray-900 font-normal lg:text-xl md:px-20">{props.description}</div>
        )}
      </div>
    )}

    {props.children}
  </div>
);

export { Section };
