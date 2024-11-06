import Image from 'next/image';

const brandLogos = [
  {
    src: '/images/brand/africanboy.jpeg',
    alt: 'Sentry',
  },
  {
    src: '/images/brand/bongekuku.jpeg',
    alt: 'Better Stack',
  },
  {
    src: '/images/brand/borntoshine.png',
    alt: 'Clerk',
  },
  {
    src: '/images/brand/paaz.png',
    alt: 'Turso',
  },
  {
    src: '/images/brand/markjuice.jpeg',
    alt: 'Turso',
  },
]

const Sponsors = () => (
  <section className='py-12 px-4 flex flex-col items-center justify-center bg-gradient-to-bl from-[#FFFFFF] via-[#FFFFFF] to-[#87d5c7] w-full'>
  
    <div className='flex flex-col items-center justify-center '>
      <div className='flex flex-col items-center justify-center gap-1 mb-3 lg:w-[54%]'>
        <h2 className='text-[30px] font-medium text-gray-900 text-center lg:font-bold lg:text-3xl'>Trusted by top brands</h2>
        <p className='hidden text-[18px] font-normal text-center text-gray-900 mt-3 lg:block lg:text-[22px]'>Join thousands of businesses thriving with  Settlo: the smart POS solution that simplifies your operations and boosts growth</p>
      </div>
    </div>
   <div className='flex flex-wrap items-center justify-center gap-3 p-3 h-full lg:flex-nowrap'>
      {brandLogos.map((logo) => (
        <Image
        className='rounded-md h-15 w-15 lg:h-20 lg:w-20'
          key={logo.src}
          src={logo.src}
          alt={logo.alt}
          width={60}
          height={60}
          loading='lazy'
        />
      ))}
    </div>
   
  </section>
);

export { Sponsors };
