'use client'
import { fetchSubscriptions } from "@/lib/actions/subscriptions"
import { Subscription, SubscriptionFeature } from "@/types/subscription/type"
import { CheckIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface PricingCardProps {
    packageName: string;
    amount: number;
    discount: number;
    packageCode: string;
    subscriptionFeatures: string[];
}

export const Pricing = () => {
    const [subscription, setSubscription] = useState<Subscription[]>([])
    useEffect(() => {
        const getSubscription = async () => {
            try {
                const data = await fetchSubscriptions()
                setSubscription(data)
            } catch (error) {
                console.log(error)}
        }
        getSubscription()
    }, [])
    return(
        <section className="py-12 px-4 flex flex-col items-center justify-center bg-gradient-to-tr from-[#FFFFFF] via-[#FFFFFF] to-[#87d5c7] w-full">
            <div className='flex flex-col gap-3 lg:w-[44%]'>
            <h2 className="text-[30px] text-gray-900 text-center font-medium lg:text-3xl lg:font-bold">Choose plan that’s right for you.</h2>
            <p className="hidden text-[18px] font-normal text-center text-gray-900 lg:block lg:text-[22px]">Our plans cater to each stage of you growth journey, ensuring flexibility and scalability as you evolve.</p>
            </div>
            <div className="flex flex-col gap-6 items-center justify-center mt-6 lg:grid lg:grid-cols-3 lg:gap-8 lg:justify-center lg:items-center">
            {subscription.map((sub) => (
                    <PricingCard
                        key={sub.id}
                        packageName={sub.packageName}
                        amount={sub.amount}
                        discount={sub.discount}
                        packageCode={sub.packageCode}
                        subscriptionFeatures={sub.subscriptionFeatures.map((feature) => (feature as SubscriptionFeature).name)}
                        />
                ))}
            </div>
        </section>
    )

}

const PricingCard = ({ packageName, amount,subscriptionFeatures }: PricingCardProps) => {
    const formattedAmount = amount.toLocaleString('en-US', { style: 'currency', currency: 'TZS' });
    const [showAll, setShowAll] = useState(false);
    const featuresToShow = showAll ? subscriptionFeatures : subscriptionFeatures.slice(0, 10);
    const navigate = useRouter(); // Initialize useNavigate


    return (
        <div className="flex flex-col items-start justify-center bg-white w-[340px] border-2 rounded-md pl-5 pr-5 pt-3 pb-3 shadow-lg lg:w-[400px] lg:min-h-[500px] lg:p-6 gap-4">
            <div>
            <p className="text-[20px] font-medium text-center lg:text-start text-gray-900 uppercase">{packageName}</p>
            </div>
            <p className="text-[18px] font-bold text-gray-900 bg-red-100 rounded-md pl-3 pr-3 pt-2 pb-2">{formattedAmount} / mo</p>
            <div className="flex flex-col gap-2">
                {featuresToShow.map((feature, key) => (
                    <div key={key} className="flex flex-row gap-4 items-center">
                        <CheckIcon height={14} width={14}  strokeWidth={5} color="#10b981" />
                        <p className="text-[16px] font-normal text-gray-900">{feature}</p>
                    </div>
                ))}
            </div>
            <div className="flex flex-row gap-2 items-center justify-center">
            <button
                onClick={() => {
                    if (showAll) {
                        navigate.push("/register");
                    } else {
                        setShowAll(!showAll);
                    }
                }}
                className="text-[16px] font-semibold text-white bg-emerald-500 hover:bg-gray-700 py-3 px-6 rounded-full"
            >
                {showAll ? "Get Started" : "Show more"}
            </button>    
            
            </div>
        </div>
    );
};
