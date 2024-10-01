import { AppConfig } from './AppConfig';
import Image from "next/image";

type ILogoProps = {
  xl?: boolean;
};

const Logo = (props: ILogoProps) => {
  const size = props.xl ? '44' : '32';
  const fontStyle = props.xl
    ? 'font-semibold text-3xl'
    : 'font-semibold text-xl';

  return (
    <span className={`inline-flex items-center text-gray-900 ${fontStyle}`}>
      <Image src="/images/new_logo.svg" width={200} height={70} alt={'Logo'} />
    </span>
  );
};

export { Logo };
