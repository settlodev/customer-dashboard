import type { ReactNode } from 'react';

type IHeroOneButtonProps = {
  title: ReactNode;
  description: string;
  button: ReactNode;
};

const HeroOneButton = (props: IHeroOneButtonProps) => (
  <header className="text-center">
    <h1 className="whitespace-pre-line text-3xl font-bold leading-hero text-gray-900 lg:text-5xl">
      {props.title}
    </h1>
    <div className="mb-8 mt-8 text-xl font-normal text-gray-900">{props.description}</div>

    {props.button}
  </header>
);

export { HeroOneButton };
