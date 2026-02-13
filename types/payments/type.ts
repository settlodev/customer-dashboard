export type PaymentMethodType = {
  id: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
};

export type PaymentMethodCategory = {
  name: string;
  description: string | null;
  acceptedPaymentMethodTypes: PaymentMethodType[];
};

export type PaymentMethodsResponse = PaymentMethodCategory[];

export type UpdatePaymentMethodsRequest = {
  newAcceptedPaymentMethodTypeIds: string[];
};
