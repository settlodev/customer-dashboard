import {CategoriesTable} from "@/app/(protected)/categories/list";
import {getCategoriesAction} from "@/lib/actions/categories/category-list-actions";

export default async function CategoriesPage() {
    const categories = await getCategoriesAction();
    console.log("categories 1:", categories);
    return (
        <CategoriesTable categories={categories} />
    )
}
