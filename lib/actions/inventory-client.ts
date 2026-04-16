/**
 * Shared URL helper for the Inventory Service.
 *
 * All catalogue server actions (brands, categories, products, suppliers, etc.)
 * use this to build full URLs. The ApiClient sees the "http" prefix and skips
 * its own baseURL, while still injecting auth, X-Location-Id, and X-Business-Id
 * headers automatically.
 */

const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || "";

export function inventoryUrl(path: string): string {
  return `${INVENTORY_SERVICE_URL}${path}`;
}

export function isInventoryConfigured(): boolean {
  return !!INVENTORY_SERVICE_URL;
}
