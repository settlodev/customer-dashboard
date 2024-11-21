import Image from "next/image";
import type { ReactNode } from 'react';

type IHeroOneButtonProps = {
  title: ReactNode;
  description: string;
  button: ReactNode;
  className?: string;
};

const HeroOneButton = (props: IHeroOneButtonProps) => (
  <header className="flex flex-col items-center justify-center lg:flex-row gap-4 ">
  <div className='mr-8 space-x-10 flex flex-col items-start'> {/* Added flex and items-start */}
    <h1 className="whitespace-pre-line text-3xl font-bold leading-hero text-gray-900 lg:text-5xl uppercase">
      {props.title}
    </h1>
    <p className="mb-8 mt-4 text-xl font-normal text-gray-900 lg:text-2xl">
      {props.description}
    </p>
    {props.button}
  </div>

  <div className='mt-0'>
    <Image
      src="/images/user/hero2.jpg"
      alt="Hero Image"
      loading='lazy'
      width={450}
      height={50}
    />
  </div>
</header>
);

export { HeroOneButton };
