
// import React from 'react'
// import { Card, CardContent } from '@/components/ui/card'
// import { Loader2, RefreshCw } from 'lucide-react'
// import { Button } from '@/components/ui/button'
// import { AlertCircle, Clock } from 'lucide-react'
// const UnimplementedTabContent = ({ tabName }: { tabName: string }) => {
//   return (
//     <Card className="border-dashed border-2">
//       <CardContent className="h-64 flex flex-col items-center justify-center gap-4">
//         <div className="bg-amber-50 p-4 rounded-full">
//           <Clock className="w-8 h-8 text-amber-600" />
//         </div>
//         <div className="text-center">
//           <h3 className="font-semibold text-gray-900 mb-2">{tabName} Coming Soon</h3>
//           <p className="text-gray-600 mb-4 max-w-md">
//             We're working hard to bring you comprehensive {tabName.toLowerCase()} analytics. 
//             This feature will be available in an upcoming release.
//           </p>
//           <Button size="sm" variant="outline" className="gap-2">
//             <AlertCircle className="w-4 h-4" />
//             Request Early Access
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }

// export default UnimplementedTabContent

// // reports/LoadingCard.tsx


// const LoadingCard = () => {
//   return (
//     <Card>
//       <CardContent className="h-64 flex items-center justify-center">
//         <div className="flex flex-col items-center gap-4">
//           <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//           <div className="text-center">
//             <p className="text-gray-600 font-medium">Loading report data...</p>
//             <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }

// export default LoadingCard



// const ErrorCard = ({ onRetry }: { onRetry: () => void }) => {
//   return (
//     <Card className="border-red-200">
//       <CardContent className="h-64 flex flex-col items-center justify-center gap-4">
//         <div className="bg-red-50 p-4 rounded-full">
//           <AlertCircle className="w-8 h-8 text-red-600" />
//         </div>
//         <div className="text-center">
//           <h3 className="font-semibold text-gray-900 mb-2">Error Loading Report Data</h3>
//           <p className="text-gray-600 mb-4 max-w-md">
//             There was a problem loading your report data. Please check your connection and try again.
//           </p>
//           <Button onClick={onRetry} className="gap-2">
//             <RefreshCw className="w-4 h-4" />
//             Try Again
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   )
// }

// export default ErrorCard

// // reports/PurchaseReportComponent.tsx
// import React from 'react'
// import UnimplementedTabContent from './UnimplementedTabContent'

// const PurchaseReportComponent = () => {
//   return <UnimplementedTabContent tabName="Purchase Report" />
// }

// export default PurchaseReportComponent

// // reports/RequestReportComponent.tsx
// import React from 'react'
// import UnimplementedTabContent from './UnimplementedTabContent'

// const RequestReportComponent = () => {
//   return <UnimplementedTabContent tabName="Request Report" />
// }

// export default RequestReportComponent

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Clock } from 'lucide-react'

const UnimplementedTabContent = ({ tabName }: { tabName: string }) => {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="h-64 flex flex-col items-center justify-center gap-4">
        <div className="bg-amber-50 p-4 rounded-full">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-gray-900 mb-2">{tabName} Coming Soon</h3>
          <p className="text-gray-600 mb-4 max-w-md">
            We&apos;re working hard to bring you comprehensive {tabName.toLowerCase()} analytics. 
            This feature will be available in an upcoming release.
          </p>
          <Button size="sm" variant="outline" className="gap-2">
            <AlertCircle className="w-4 h-4" />
            Request Early Access
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default UnimplementedTabContent