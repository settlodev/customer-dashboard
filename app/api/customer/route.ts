import {NextResponse} from "next/server";
import {CustomerSchema} from "@/types/data-schemas";


export async function POST(request:Request){
    try {
        const body = await request.json();
        const parsedCustomer = CustomerSchema.safeParse(body);

        if(!parsedCustomer.success){
            return NextResponse.json({
                error:"Invalid customer details"
            },{status:400})
        }
        const savedCustomer = {...parsedCustomer.data}
        return NextResponse.json(savedCustomer,{status:201})

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    }catch (error){
        return NextResponse.json({error:"Failed to save customer"},{status:500})
    }
}
