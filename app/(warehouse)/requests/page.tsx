'use client'
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Download,Plus } from 'lucide-react';
// import React, { useState } from 'react';

const summaries = [
  {
    title: "Average Processing Time",
    value: "1.5",
    unit: "hrs",
    change: "+0.2",
    trend: "negative"
  },
  {
    title: "Request Approval Rate",
    value: "92.5",
    unit: "%",
    change: "+2.3",
    trend: "positive"
  },
  {
    title: "Requests This Month",
    value: "128",
    unit: "",
    change: "+12",
    trend: "positive"
  }
];

const requestList = [
  { id: 1, title: "Software License Request", requester: "Alex Kim", date: "Apr 20, 2025", status: "Pending" },
  { id: 2, title: "Hardware Replacement", requester: "Jordan Smith", date: "Apr 19, 2025", status: "Approved" },
  { id: 3, title: "Access Permission", requester: "Taylor Chen", date: "Apr 18, 2025", status: "Completed" },
  { id: 4, title: "Budget Approval", requester: "Morgan Lee", date: "Apr 17, 2025", status: "Rejected" }
];

function Requests() {
  // const [filter, setFilter] = useState("all");
  
  return (
    <div className="flex flex-col w-full p-6 mt-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Request Management</h2>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="hidden sm:flex gap-2">
            <Download size={16} />
            Export
          </Button>
          <Button className="flex gap-2">
            <Plus size={16} />
            New Request
          </Button>
        </div>
      </div>

      {/* Analytics Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <BarChart size={20} />
                Request Analytics
              </CardTitle>
              <CardDescription>
                Overview of request processing performance
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {summaries.map((item, index) => (
          <Card key={index} className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">{item.title}</p>
                  <p className="text-2xl font-bold mt-1">
                    {item.value}{item.unit}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs ${item.trend === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.change}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
        </CardContent>
      </Card>

      {/* Request List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Recent Requests</CardTitle>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="pb-2 font-medium">Title</th>
                  <th className="pb-2 font-medium">Requester</th>
                  <th className="pb-2 font-medium">Date</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {requestList.map((request) => (
                  <tr key={request.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">{request.title}</td>
                    <td className="py-3">{request.requester}</td>
                    <td className="py-3">{request.date}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Requests;