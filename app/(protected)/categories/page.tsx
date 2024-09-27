import {listCategories} from "@/lib/actions/category/list";
import {useCookies} from "next-client-cookies";

export default function CategoriesPage(){
    const cookies = useCookies();
    const categories = listCategories(cookies.get('businessId'));
    console.log("categories:", categories);
    return <></>
}
