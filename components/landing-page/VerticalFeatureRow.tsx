import className from 'classnames';
import Image from 'next/image';
type IVerticalFeatureRowProps = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  reverse?: boolean;
};

const VerticalFeatureRow = (props: IVerticalFeatureRowProps) => {
  const verticalFeatureClass = className(
    'mt-20',
    'flex',
    'flex-wrap',
    'items-center',
    {
      'flex-row-reverse': props.reverse,
    },
  );

  return (
    <div className={verticalFeatureClass}>
      <div className="w-full text-center sm:w-1/2 sm:px-6">
        <h3 className="text-2xl font-bold text-gray-900">{props.title}</h3>
        <div className="mt-3 text-medium">{props.description}</div>
      </div>
      <div className="w-full p-6 sm:w-1/2">
        <Image src={`${props.image}`} width={200} height={200} alt={props.imageAlt} />
      </div>
    </div>
  );
};

export { VerticalFeatureRow };
