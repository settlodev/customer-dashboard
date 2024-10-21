import Image from "next/image";;

type ILogoProps = {
  xl?: boolean;
};

const Logo = (props: ILogoProps) => {
  // const size = props.xl ? '44' : '32';
  const fontStyle = props.xl
    ? 'font-semibold text-3xl'
    : 'font-semibold text-xl';

  return (
    <span className={`inline-flex items-center text-gray-900 ${fontStyle}`}>
        <Image onClick={()=>window.location.href='/'} src="/images/new_logo.svg" className="hidden lg:block md:block" width={160} height={70} alt={'Logo'} />
        <Image onClick={()=>window.location.href='/'} src="/images/new_logo.svg" className="lg:hidden md:hidden mt-1" width={120} height={50} alt={'Logo'} />
    </span>
  );
};

export { Logo };
