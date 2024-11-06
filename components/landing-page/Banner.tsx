import Link from 'next/link';

const store = [
  {
    'id': 1,
    'title': 'Start Free Trial',
    'link': '/register',

  },
  {
    'id': 2,
    'title': 'Talk to Sales',
    'link': '/contact',
  }
]
const CallToAction = () => (
  <section>
    <div className='py-12 px-4 flex flex-col  items-center gap-4 justify-center  bg-gradient-to-bl from-[#FFF] via-[#FFF] to-[#87d5c7]  w-full'>
      <div className='flex flex-col gap-3 lg:w-[44%]'>
        <h2 className='text-[30px] text-gray-900 text-center font-medium  lg:text-[36px]  lg:font-bold'>
          Elevate your business with Settlo POS
        </h2>
        <p className='text-[18px] font-normal text-start text-gray-900 mt-3 lg:text-[22px]'>
          Join thousands of businesses. Experience seamless transactions, real-time insights, and dedicated support—start with Settlo today.
        </p>
      </div>
      <div className='flex flex-row gap-8 items-center justify-center mt-6 '>

        {
          store.map((item, key) => (
            <Link key={key} href={item.link}>
              <div className='flex flex-row gap-3 items-center justify-center '>
                <button className={key === store.length - 1 ? "border-1 rounded-full pl-5 pr-5 pt-3 pb-3 border-emerald-700 text-black text-[14px] font-medium lg:text-[16px]" : "border-1 rounded-full pl-5 pr-5 pt-3 pb-3 bg-emerald-500 text-white text-[14px] font-medium lg:text-[16px]"}>{item.title}</button>
              </div>
            </Link>
          ))
        }
      </div>
    </div>
  </section>
);

export { CallToAction };
