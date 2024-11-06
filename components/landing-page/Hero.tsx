import Link from 'next/link';
import Image from 'next/image';

const buttons = [
    {
        label: 'Start Free Trial!',
        href: '/register',
    },
    {
        label: 'Talk to Sales',
        href: '/contact',
    }
]
const Hero = () => {
    // const doLogout = async () => {
    //     await deleteAuthCookie();
    //     window.location.reload();
    // }
    return (
        <section className="py-12 px-4 flex flex-col items-center justify-center bg-gradient-to-tr from-[#F5F5F5] via-[#FFFFFF] to-[#87d5c7] text-transparent w-full">
        <div className="container  w-full lg:max-w-[1280px]  lg:mt-14 lg:h-[380px]">
        <header className="flex flex-col items-center justify-center gap-4 lg:flex-row">
            <div className='flex flex-col items-center justify-center lg:items-start  gap-6'> 
                <h1 className="text-[30px] text-start w-full tracking-[-5%] font-bold text-gray-900 lg:text-4xl lg:text-start ">
                    {'Transform your business with Settlo,'}
                    <br />
                    <span className="text-emerald-400 font-bold mt-4">the ultimate POS solution.</span>
                </h1>
                <p className="text-[18px] text-start tracking-[-5%] font-normal text-gray-900 lg:text-2xl lg:text-start lg:font-medium">
                    Streamline operations, boot sales, and gain insights effortlessly
                    <span>with Settlo&apos;s intuitive POS system.</span>   
                </p>
               
                <div className='flex flex-row gap-4 items-center justify-center '>
                {
                    buttons.map((item, index) => (
                        <Link key={index} className="flex flex-row gap-4" href={item.href}>
                            
                        <button className={buttons.length -1 === index ? "bg-white text-black border-1 rounded-full pl-5 pr-5 pt-3 pb-3 border-emerald-700 hover:bg-emerald-500 hover:text-white text-[14px] font-medium lg:text-[16px]" :"border-1 rounded-full pl-5 pr-5 pt-3 pb-3 bg-emerald-500 text-white text-[14px] font-medium lg:text-[16px]"  }>{item.label}</button>
                            
                        </Link>
                    ))
                }
                </div>
            </div>

            <div className='mt-4 justify-center items-center lg:mr-6'>
                <Image
                    className="rounded-lg mb-4 object-cover w-full"
                    src="/images/user/hero3.jpg"
                    alt="Hero Image"
                    loading='lazy'
                    width={600}
                    height={100}
                />
            </div>
        </header>
    </div>
        </section>
    
    );
}

export { Hero };
