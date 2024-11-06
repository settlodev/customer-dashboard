'use client'
import { useState } from 'react';
import { VerticalFeatureRow } from './VerticalFeatureRow';
import { Activity, BadgeDollarSign, ChartSpline, Store, Users, Workflow } from 'lucide-react';


const features = [
  {
    title: "Inventory Management",
    description: "Stay on top of your stock! Effortlessly track inventory levels in real-time, receive alerts for low stock, and manage multiple locations—all from one intuitive dashboard.",
    image: '/images/features/dashboard.png',
    imageAlternative: "Inventory Management",
    icon:<ChartSpline />
    
  },
  {
    title: "Sales Monitoring and Reporting",
    description: "Unlock valuable insights! Our robust reporting tools let you analyze sales trends and performance metrics, helping you make data-driven decisions to boost your business.",
    image: '/images/features/dashboard2.png',
    imageAlternative: "Sales Monitoring",
    icon:<Activity />
  },
  {
    title: "Payment Processing",
    description: "Simplify transactions! Accept all major payment methods—cash, cards, and mobile payments—ensuring a fast and flexible checkout experience for your customers.",
    image: '',
    imageAlternative: "Payment",
    icon: <BadgeDollarSign />,
  },
  {
    title: "Customer Relation Management",
    description: "Build lasting relationships! Capture customer data to create personalized experiences, send timely updates, and foster loyalty with tailored rewards programs.",
    image: "/images/features/dashboard.png",
    imageAlternative: 'Customer',
    icon:<Users />
  },
  {
    title: "Employee Management",
    description: "Empower your team! Track employee performance, manage schedules, and streamline payroll processes—all integrated within your POS system for maximum efficiency.",
    image: "/images/features/employees.jpg",
    imageAlternative: 'Employee',
    icon:<Users />
  },
  {
    title: "Omnichannel Integration",
    description: "Sell anywhere! Seamlessly connect your in-store and online sales channels, ensuring real-time inventory updates and a unified customer experience across platforms.",
    image: '',
    imageAlternative: 'Omnichannel',
    icon:<Workflow />
  },
  {
    title: "Multi-Store Management",
    description: "Manage all your stores from a single dashboard, simplifying operations and providing real-time visibility into sales, inventory, and customer data across locations.",
    image: '',
    imageAlternative: 'Multi Store',
    icon:<Store />
  },
  {
    title: "Mobile POS",
    description: "Go mobile! Process sales anywhere with our mobile POS capabilities, enhancing customer interactions and reducing wait times on the shop floor.",
    image: "/images/features/devices.png",
    imageAlternative: 'Devices',
  },
];

const VerticalFeatures = () => {
  const [showAll, setShowAll] = useState(false);

  // Determine the features to display
  const featuresToShow = showAll ? features : features.slice(0, 6);

  return (
    <section className="py-12 px-4 flex flex-col items-center justify-center bg-white w-full lg:flex-row">
      <div className='flex flex-col justify-center items-center '>
        <div className='flex flex-col items-center justify-center gap-1 mb-3 lg:w-[44%]'>
          <h2 className="text-[30px] font-medium text-gray-900 text-center lg:font-bold lg:text-3xl">On this platform, we offer various benefits for your use.</h2>
          <p className='hidden text-[18px] font-normal text-center text-gray-900 mt-3 lg:block lg:text-[22px]'>Experience features designed to simplify your workflow: from customer insights to sales tracking.</p>
        </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 w-full mt-2">  
      {featuresToShow.map((feature, key) => (
        <VerticalFeatureRow
          key={key}
          title={feature.title}
          description={feature.description}
          icon={feature.icon}
          image={feature.image}
          imageAlt={feature.imageAlternative}
          reverse={key % 2 !== 0}
        />
      ))}
      </div>
      
      
      <div className="text-center mt-6">
        <button
          onClick={() => setShowAll(!showAll)}
          className="px-4 py-2 bg-emerald-500 text-white rounded-full font-medium"
        >
          {showAll ? 'Show Less' : 'View All Features'}
        </button>
      </div>
      </div>
    </section>
  );
};

export { VerticalFeatures };
