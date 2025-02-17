import React from 'react';

import { UUID } from "crypto";

import { getRefund } from '@/lib/actions/refund-actions';
import { OrderItemRefunds } from '@/types/refunds/type';
import RefundDetails from '@/components/widgets/refund-details';


const RefundDetailsPage = async ({ params }: { params: { id: string } }) => {
    const refund = await getRefund(params.id as UUID);
    const refundData: OrderItemRefunds | null = refund?.content[0];

    if (!refundData) {
        return <div>No refund data found</div>;
    }

    return <RefundDetails refund={refundData} />;
};

export default RefundDetailsPage;