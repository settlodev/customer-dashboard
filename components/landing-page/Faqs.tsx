"use client"
import { ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const questions = [
    {
        question: "What is Settlo?",
        answer: "Settlo is a mobile POS solution that allows businesses to accept payments, manage inventory, and track sales. It is a powerful tool that can help businesses increase their sales and customer base."
    },
    {
        question: "How does Settlo work?",
        answer: "Settlo works by allowing businesses to accept payments, manage inventory, and track sales. It is a powerful tool that can help businesses increase their sales and customer base."
    },
    {
        question: "What features does Settlo offer?",
        answer: "Settlo offers a range of features, including inventory management, sales reporting, and customer relationship management."
    },
    {
        question: "What payment methods does Settlo support?",
        answer: "Settlo supports multiple payment methods, including cash, cards, and mobile payments."
    },
    {
        question: "Can I use Settlo for my business?",
        answer: "Yes, Settlo is a powerful tool that can help businesses increase their sales and customer base. It is available for both online and in-store sales."
    },
]
export  const FAQS =()=>{
    const [openIndex, setOpenIndex] = useState<number | null>(null)
    return(
        <section className="py-12 px-4 flex flex-col lg:flex-row lg:gap-[210px] lg:justify-items-center w-full bg-gradient-to-tr from-[#FFFFFF] via-[#FFFFFF] to-[#87d5c7]">
            <div className=" flex lg:w-1/3 lg:flex-col mt-4 lg:gap-3">
            <h2 className="text-[30px] text-gray-900 text-center font-medium lg:text-[36px] lg:font-bold  lg:text-start">Frequently asked questions</h2>
            <p className="hidden lg:block text-[16px] font-normal text-start text-gray-900  lg:text-xl">We&apos;ve compiled answers to some of the most common questions to help you get started. If you can&apos;t find the information you&apos;sre looking for, feel free to reach out to our support team for assistance</p>
            <Link href='/contact' className='hidden  lg:flex flex-row items-center justify-start mt-6'>
                <button className="border-1 rounded-full pl-5 pr-5 pt-3 pb-3 border-emerald-700 text-black text-[14px] font-medium lg:text-[16px]">Talk to sales</button>
            </Link>
            </div>
            <div className="flex flex-col gap-2 items-center justify-center mt-6 lg:w-1/2">
                {questions.map((item, key) => (
                    <div key={key} className="flex flex-col items-center justify-center border-2 border-white rounded-md pl-5 pr-5 pt-3 pb-3 shadow-lg bg-white w-full gap-2">
                        <div className="flex flex-row gap-2 items-center justify-between w-full" onClick={() => setOpenIndex(openIndex === key ? null : key)}>
                        <p className="text-[18px] font-medium justify-center text-gray-900">{item.question}</p>
                        { openIndex === key ? (
                            <ChevronUp height={14} width={14} />
                        ):(
                            <ChevronDown height={14} width={14} />
                        )}
                        </div>
                        {openIndex === key && <p className="text-[16px] font-medium  text-gray-600">{item.answer}</p>}
                    </div>
                ))}
            </div>
        </section>
    )
}