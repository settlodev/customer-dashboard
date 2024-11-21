import Image from "next/image";

const testimonials = [
    {
        id: 1,
        name: 'Jenny Willson',
        title: 'Small Business Owner',
        text:'Settlo POS has transformed the way I run my retail store! The user-friendly interface makes transactions a breeze, and the real-time inventory management keeps me organized. I cant imagine going back to my old system.',
        image: 'https://images.unsplash.com/photo-1499714608240-22fc6ad53fb2?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=76&q=80',
    },
    {
        id: 2,
        name: 'Mark Thomas',
        title: 'Restaurant Manager',
        text: 'With Settlo, our checkout process is faster than ever! The mobile POS feature allows my staff to take orders and payments right at the table, enhancing customer satisfaction. Highly recommend it!"',
        image: 'https://images.unsplash.com/photo-1499714608240-22fc6ad53fb2?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=76&q=80',
    },
    {
        id: 3,
        name: 'Jane Doe',
        title: 'Co-Founder, Company',
        text: 'The loyalty program feature has helped me build a loyal customer base! My clients love earning rewards, and it’s boosted my sales tremendously. Settlo is an essential part of my business.',
        image: 'https://images.unsplash.com/photo-1499714608240-22fc6ad53fb2?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=76&q=80',
    }
]
export const Testimonial = () => {
    return (
        <section className="py-12 px-4 flex flex-col items-center justify-center bg-gradient-to-bl from-[#F5F5F5] via-[#FFFFFF] to-[#87d5c7]">
            <div className=" flex flex-col items-center justify-center lg:h-[380px] ">
                <p className="text-[30px] text-gray-900 text-center font-medium  lg:text-[36px] lg:w-1/2 lg:font-bold ">Our beloved clients share their Settlo experience</p>
                <div className="flex flex-col gap-2 items-center justify-center mt-6 lg:grid lg:grid-cols-3">
                    {testimonials.map((item, key) => (
                        <div key={key} className="flex flex-col items-start h-50 w-[340px] justify-center border-2 border-white rounded-md pl-5 pr-5 pt-3 pb-3 shadow-lg bg-white lg:h-full lg:w-full lg:justify-start lg:items-start">
                            <p className="text-[14px] font-medium text-start text-gray-900 lg:text-start lg:text-[18px] lg:font-normal">{item.text}</p>

                            <p className="h-0.5 w-full bg-gray-500 m-3 "/>

                            <div className="flex flex-row gap-2 items-center justify-center mb-3">
                                <Image
                                    src={item.image}
                                    alt={item.name}
                                    className="w-14 h-14 rounded-full object-cover"
                                    width={60}
                                    height={60}
                                />
                                <div className='flex flex-col items-center justify-center '>
                                    <h3 className="text-[16px] text-gray-900 text-start font-bold">{item.name}</h3>
                                    <p className="text-[14px] font-medium text-center text-gray-900">{item.title}</p>
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
