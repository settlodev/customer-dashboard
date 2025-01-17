'use client'
import { fetchSubscriptions } from "@/lib/actions/subscriptions"
import { Subscription, SubscriptionFeature } from "@/types/subscription/type"
import {ArrowRight, CheckIcon, Sparkles} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface PricingCardProps {
    packageName: string;
    amount: number;
    discount: number;
    packageCode: string;
    subscriptionFeatures: string[];
    isPopular?: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({
                                                     packageName,
                                                     amount,
                                                     subscriptionFeatures,
                                                     isPopular = false,
                                                 }) => {
    const router = useRouter();
    const [showAll, setShowAll] = useState(false);
    const shouldShowMoreButton = subscriptionFeatures.length > 10;
    const displayedFeatures = showAll ? subscriptionFeatures : subscriptionFeatures.slice(0, 10);
    const formattedAmount = amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

    return (
        <div className={`relative flex flex-col bg-white rounded-2xl p-6 transition-all duration-300 hover:shadow-xl border 
      ${isPopular ? 'border-emerald-200 shadow-lg scale-105' : 'border-gray-100'}`}>

            {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Most Popular
                </div>
            )}

            <div className="space-y-4 mb-6">
                <h3 className="text-xl font-bold text-gray-900 uppercase">{packageName}</h3>
                <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900">{formattedAmount}</span>
                        <span className="text-gray-600">/month</span>
                    </div>
                </div>
            </div>

            <div className="flex-grow space-y-3 mb-6">
                {displayedFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <div className="rounded-full p-1 bg-emerald-100 mt-0.5">
                            <CheckIcon className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                        </div>
                        <span className="text-gray-600">{feature}</span>
                    </div>
                ))}
            </div>

            <div className="space-y-3">
                {shouldShowMoreButton && !showAll ? (
                    <button
                        onClick={() => setShowAll(true)}
                        className="w-full px-6 py-3 text-emerald-600 bg-emerald-50 rounded-xl font-medium hover:bg-emerald-100 transition-colors duration-200"
                    >
                        Show All Features
                    </button>
                ) : (
                    <button
                        onClick={() => router.push('/register')}
                        className={`w-full px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2
              ${isPopular
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                    >
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export const Pricing: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

    useEffect(() => {
        const getSubscriptions = async () => {
            try {
                const data = await fetchSubscriptions();
                const filteredPlans = data.filter(plan => !plan.packageName.toLowerCase().includes('trial'));
                setSubscriptions(filteredPlans);
            } catch (error) {
                console.error('Error fetching subscriptions:', error);
            }
        };
        getSubscriptions();
    }, []);

    return (
        <section className="relative w-full overflow-hidden py-24">
            {/* Background with gradients */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-white" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(16,185,129,0.15),transparent_50%)]" />
            </div>

            <div className="relative container mx-auto px-4">
                <div className="max-w-3xl mx-auto text-center space-y-6 mb-16">
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
                        Choose the Perfect Plan for Your Business
                    </h2>
                    <p className="text-xl text-gray-600">
                        Our flexible pricing options are designed to grow with your business,
                        ensuring you have all the tools you need at every stage.
                    </p>
                </div>

                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                        {subscriptions.map((sub, index) => (
                            <PricingCard
                                key={sub.id}
                                packageName={sub.packageName}
                                amount={sub.amount}
                                discount={sub.discount}
                                packageCode={sub.packageCode}
                                subscriptionFeatures={sub.subscriptionFeatures.map(
                                    (feature) => (feature as SubscriptionFeature).name
                                )}
                                isPopular={index === Math.floor(subscriptions.length / 2) - 1} // Make second plan popular
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};
