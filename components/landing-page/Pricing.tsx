import { CheckIcon } from "lucide-react"

const plans = [
    {
        name: "Free",
        price: 0,
        description: "Free within 30 days, with no credit card required.",
        itemFounds: [
            "Basic Inventory Management: Track stock levels and receive low-stock alerts.",
            "Sales Tracking: Monitor daily sales with basic reporting.",
            "Payment Processing: Accept cash and card payments.",
            "Customer Support: Basic email support.",
        ]},
        {
            name: "Business",
            price: 5,
            description: "For small businesses",
            itemFounds: [
                "Advanced Inventory Management: Real-time inventory tracking and multi-location support.",
                "Detailed Sales Reporting: Access to comprehensive sales reports and analytics.",
                "Customer Relationship Management (CRM): Store customer profiles and purchase histories.",
                "Loyalty Programs: Create and manage simple loyalty programs.",
                "Employee Management: Track employee hours and sales performance."
            ]
        },
        {
            name: "Pro",
            price: 10,
            description: "For small teams or office",
            itemFounds: [
                "Advanced Inventory Management: Real-time inventory tracking and multi-location support.",
                "Detailed Sales Reporting: Access to comprehensive sales reports and analytics.",
                "Customer Relationship Management (CRM): Store customer profiles and purchase histories.",
                "Loyalty Programs: Create and manage simple loyalty programs.",
                "Employee Management: Track employee hours and sales performance."
            ]
        }
]
export const Pricing = () => {
    return(
        <section className="py-12 px-4 flex flex-col items-center justify-center bg-gradient-to-tr from-[#FFFFFF] via-[#FFFFFF] to-[#87d5c7] w-full">
            <div className='flex flex-col gap-3 lg:w-[44%]'>
            <h2 className="text-[30px] text-gray-900 text-center font-medium lg:text-3xl lg:font-bold">Choose plan that’s right for you.</h2>
            <p className="hidden text-[18px] font-normal text-center text-gray-900 lg:block lg:text-[22px]">Our plans cater to each stage of you growth journey, ensuring flexibility and scalability as you evolve.</p>
            </div>
            <div className="flex flex-col gap-2 items-center justify-center mt-6 lg:grid lg:grid-cols-3 lg:justify-center lg:items-center">
                {plans.map((item, key) => (
                    <PricingCard key={key} {...item} />
                ))}
            </div>
        </section>
    )

}

const PricingCard = (props: any) => {
    return(
        <div className="flex flex-col  items-center justify-center bg-white w-[340px] border-2  rounded-md pl-5 pr-5 pt-3 pb-3 shadow-lg  lg:items-start lg:justify-start lg:w-full lg:h-full gap-4">
            <div className="">
                <p className="text-[20px] font-medium justify-center text-center lg:text-start text-gray-900">{props.name}</p>
                <p className="text-[16px] font-normal justify-center text-gray-900 text-start">{props.description}</p>    
            </div>
            <p className="text-[16px] font-bold  text-gray-900 text-start bg-red-100 rounded-md pl-3 pr-3 pt-2 pb-2">{props.price} USD / mo</p>
            <div className="flex flex-col gap-2 ">
                {props.itemFounds.map((item: string, key: number) => (
                    <div key={key} className="flex flex-row gap-2 items-center">
                        <CheckIcon height={18} width={18} size={28} strokeWidth={5} />
                        <p className="text-[14px] font-normal  text-gray-900">{item}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-row gap-2 items-center justify-center">
                <button className="text-[16px] font-semibold  text-white text-center bg-emerald-500 hover:bg-gray-700 py-2 px-4 rounded-full">Get Started</button>
            
            </div>
                
            </div>
        
    )
}