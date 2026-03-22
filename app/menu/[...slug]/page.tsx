import { notFound } from "next/navigation";
import { MenuPage } from "@/components/menu/menu-page";
import ApiClient from "@/lib/settlo-api-client";
import { MenuResolveResponse } from "@/types/online-menu/type";
import { parseStringify } from "@/lib/utils";

const API_KEY =
  "sk_menu_7f5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a5e3d1c9b7a";

type Params = Promise<{ slug: string[] }>;

export default async function MenuSlugPage({ params }: { params: Params }) {
  const { slug } = await params;
  const menuSlug = slug.join("/");

  try {
    const apiClient = new ApiClient();
    apiClient.isPlain = true;
    const data = await apiClient.get<MenuResolveResponse>(
      `/api/menu/resolve/${menuSlug}`,
      { headers: { "SETTLO-API-KEY": API_KEY } },
    );
    const menuData = parseStringify(data);
    return <MenuPage menuData={menuData} />;
  } catch {
    notFound();
  }
}
