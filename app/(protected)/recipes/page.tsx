import {Button} from "@/components/ui/button";
import Link from "next/link";
import BreadcrumbsNav from "@/components/layouts/breadcrumbs-nav";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import NoItems from "@/components/layouts/no-items";
import {DataTable} from "@/components/tables/data-table";
import {columns} from '@/components/tables/recipe/column'
import { searchRecipe } from "@/lib/actions/recipe-actions";
import { Recipe } from "@/types/recipe/type";
import { SubscriptionGuard } from "@/components/subscription/SubscriptionGuard";

const breadCrumbItems = [{title:"Recipes",link:"/recipes"}];
type Params = { 
    searchParams: Promise<{ 
        search?: string; 
        page?: string; 
        limit?: string; 
    }> 
};
 async function Page({searchParams}:Params) {

    const resolvedSearchParams = await searchParams;
    
    const q = resolvedSearchParams.search || "";
    const page = Number(resolvedSearchParams.page) || 0;
    const pageLimit = Number(resolvedSearchParams.limit);

     const responseData = await searchRecipe(q,page,pageLimit);

     const data:Recipe[]=responseData.content;
     const total =responseData.totalElements;
     const pageCount = responseData.totalPages

    return (
       

<SubscriptionGuard requiredFeatures={['recipes']} featureName="Recipe Management">
<div className={`flex-1 space-y-4 md:p-8 pt-6 mt-10`}>
            <div className={`flex items-center justify-between mb-2`}>
                <div className={`relative flex-1 md:max-w-md`}>
                    <BreadcrumbsNav items={breadCrumbItems} />
                </div>
                <div className={`flex items-center space-x-2`}>
                    <Button>
                        <Link href={`/recipes/new`}>
                            Add Recipe
                        </Link>
                    </Button>
                </div>
            </div>
            {
                total > 0 || q != "" ? (
                    <Card x-chunk="data-table">
                        <CardHeader>
                            <CardTitle>Recipe</CardTitle>
                            <CardDescription>Manage recipes in your business location</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DataTable columns={columns}
                               data={data}
                               searchKey="name"
                               pageNo={page}
                               total={total}
                               pageCount={pageCount}
                            />
                        </CardContent>
                    </Card>
                ):
                (
                    <NoItems newItemUrl={`/recipes/new`} itemName={`recipes`}/>
                )
            }
        </div>
</SubscriptionGuard>
    );
}

export default Page
