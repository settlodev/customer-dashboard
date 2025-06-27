import { UUID } from "crypto";

// Type for a product within a purchase
export interface PurchaseProduct {
    product: string; // UUID of the product
    quantity: number;
    price: number;
  }
  
  // Purchase interface
  export interface Purchase {
    id: UUID; // UUID
    order_Id: string;
    date: string;
    supplier: string; 
    products: PurchaseProduct[]; 
    amount: number; 
    note?: string;
    status: "pending" | "completed" | "cancelled";
    created_at?: string;
    updated_at?: string;
  }