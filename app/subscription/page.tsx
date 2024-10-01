import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const plans = [
    {
        name: "Point of Sale App",
        price: 25000,
        description: "Get started with your 1 month free trial.",
        features: [
            "Get started with your 1 month free trial.",
            "Get started with your 1 month free trial.",
            "Get started with your 1 month free trial.",
        ],
    },
    {
        name: "Sell Online",
        price: 0,
        description: "Free",
        features: [
            "Get started with your 1 month free trial.",
            "Get started with your 1 month free trial.",
            "Get started with your 1 month free trial.",
        ],
    },
    {
        name: "Business",
        price: 2500,
        description: "Just 2.5%",
        features: [
            "Get started with your 1 month free trial.",
            "Get started with your 1 month free trial.",
            "Get started with your 1 month free trial.",
        ],
    }
]
function SubscriptionPage() {
    return (
        <div className="p-10 flex flex-col gap-2 items-center lg:p-20">
            <h1 className="flex text-xl font-semibold justify-center items-center lg:text-[28px] capitalize">Choose the plan that’s right for you.</h1>

            <p className="text-[14px] font-medium lg:text-[22px] capitalize">No commitment, no monthly contract. Only pay when you use. Cancel anytime.</p>
            <div className="flex flex-col lg:grid grid-cols-3 gap-4">
               {
                   plans.map((plan, index) => (
                       <Card key={index}>
                           <CardHeader>
                               <CardTitle className="text-xl">{plan.name}</CardTitle>
                               <CardDescription className="text-[25px] font-semibold text-black ">TZS {plan.price}</CardDescription>
                           </CardHeader>
                           <CardContent className="">
                               <p>{plan.description}</p>
                               <ul>
                                   {
                                       plan.features.map((feature, index) => (
                                           <li key={index} className="flex items-center gap-2">
                                               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                               </svg>
                                               {feature}
                                           </li>
                                       ))
                                   }
                               </ul>
                           </CardContent>
                           <CardFooter className="text-center">
                               <Button className="w-full text-xl capitalize">
                                   Subscribe now
                               </Button>
                           </CardFooter>
                       </Card>
                   ))
               }
               
            </div>
            <div>
                
            </div>
        </div>
    )
}

export default SubscriptionPage