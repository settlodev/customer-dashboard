import React from 'react';

import { UUID } from "crypto";

import { getRefund } from '@/lib/actions/refund-actions';
import { OrderItemRefunds } from '@/types/refunds/type';
import RefundDetails from '@/components/widgets/refund-details';

type Params = Promise<{ id: string }>;
const RefundDetailsPage = async ({params}: {params: Params}) => {

    const resolvedParams = await params;
    const refund = await getRefund(resolvedParams.id as UUID);
    const refundData: OrderItemRefunds | null = refund?.content[0];

    if (!refundData) {
        return <div>No refund data found</div>;
    }

    return <RefundDetails refund={refundData} />;
};

export default RefundDetailsPage;