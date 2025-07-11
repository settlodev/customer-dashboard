import RequestStockPage from '@/components/widgets/warehouse/stock-request';
import { getWarehouseStockRequest } from '@/lib/actions/warehouse/request-actions';
import { UUID } from 'crypto';

type Params = Promise<{id: string}>

const RequestStockPageWrapper = async ({ params }: { params: Params }) => {
  const resolvedParams = await params;
  const request = await getWarehouseStockRequest(resolvedParams.id as UUID);
  
  return <RequestStockPage params={params} initialRequest={request} />;
};

export default RequestStockPageWrapper;