import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Linkedin, Mail, MapPin, PhoneIcon, Twitter, Youtube } from 'lucide-react';

const socialMedia = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/settlo__?igsh=dmpzdXZudDJiNTFt&utm_source=qr',
    icon: <Instagram />
  },
  {
    name: 'Twitter',
    href: 'https://x.com/settloapp?s=21',
    icon: <Twitter />
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/settlo/',
    icon: <Linkedin />
  },

  {
    name: 'Youtube',
    href: 'https://youtube.com/@settloapp?si=RC0bk86QjDGaFrvK',
    icon: <Youtube />
  },

];

const businessType = [
  {
    name: 'Retails',
    href: '/'
  },
  {
    name: 'Restaurants',
    href: '/'
  },
  {
    name: 'Hotels',
    href: '/'
  },
  {
    name: 'Bars & Breweries',
    href: '/'
  },
];

const quickLinks = [
  {
    name: 'About Us',
    href: '/'
  },
  {
    name: 'Culture',
    href: '/'
  },
  {
    name: 'Join Our Team',
    href: '/'
  },

];

const LegalLinks = [
  {
    name: 'Privacy Policy',
    href: '/'
  },
  {
    name: 'Terms of Service',
    href: '/terms'
  },
  {
    name: 'FAQ',
    href: '/'
  },
];

const ContactLinks = [
  {

    to: 'support@settlo.co.tz',
    icon: <Mail height={18} width={18} size={20} />
  },
  {

    to: '(+255) 0759 229 777',
    icon: <PhoneIcon height={18} width={18} size={20} />
  },
  {

    to: '8th Floor Noble Centre Building, Bagamoyo Road, Dar es Salaam, Tanzania',
    icon: <MapPin height={18} width={18} size={20} />
  },
];


const Footer = () => {
  return (
    <section className='w-full '>
      <div className='flex flex-col gap-8 bg-[#161C28] text-white px-4 py-8 l'>
        
        <div className='flex flex-col lg:flex-row lg:justify-between lg:items-center lg:gap-10'>
        <div className='flex flex-col gap-4'>
          <div className='flex flex-row items-center justify-start gap-2'>
            <Link href="/">
              <Image src="/images/logo.png" alt="logo" width={25} height={25} />
            </Link>
            <span className='text-xl font-bold text-white'>SettloPro</span>
          </div>

          <div className="flex flex-col mb-4 w-full">
            {/* <h5 className="font-bold">Contact Us</h5> */}

            {
              ContactLinks.map((item, key) => (
                <Link key={key} href={item.to}>
                  <div className='flex flex-row items-center justify-start gap-2'>
                    <span className='text-[14px] font-normal text-white cursor-pointer'>{item.icon}</span>
                    <span className='text-[14px] font-normal text-white cursor-pointer'>{item.to}</span>
                  </div>
                </Link>
              ))
            }
          </div>
        </div>
        <div className='grid grid-cols-2 gap-4 lg:grid-cols-4 md:grid-cols-3'>
          
          <div className='flex flex-col gap-2'>
          <h3 className='font-bold'>Business Type</h3>
            {
              businessType.map((item, key) => (
                <Link key={key} href={item.href}>
                  <div className='flex flex-row items-center justify-start gap-2'>
                    <span className='text-[14px] font-normal text-white cursor-pointer hover:text-emerald-500'>{item.name}</span>
                  </div>
                </Link>
              ))
            }
          </div>

          <div className='flex flex-col gap-2'>
            <h3 className='font-bold'>Company</h3>
            {
              quickLinks.map((item, key) => (
                <Link key={key} href={item.href}>
                  <div className='flex flex-row items-center justify-start gap-2'>
                    <span className='text-[14px] font-normal text-white cursor-pointer hover:text-emerald-500'>{item.name}</span>
                  </div>
                </Link>
              ))
            }
          </div>
          <div className='flex flex-col gap-2'>
            <h3 className='font-bold'>Legal</h3>
            {
              LegalLinks.map((item, key) => (
                <Link key={key} href={item.href}>
                  <div className='flex flex-row items-center justify-start gap-2'>
                    <span className='text-[14px] font-normal text-white cursor-pointer hover:text-emerald-500'>{item.name}</span>
                  </div>
                </Link>
              ))}
          </div>
        

        </div>
        </div>

        <div className='flex flex-row items-center justify-center gap-10'>
          {
            socialMedia.map((item, key) => (
              <Link key={key} href={item.href} target="_blank" rel="noopener noreferrer">
                <div className='flex flex-row items-center justify-start gap-2'>
                  <span className='text-xl font-bold text-white cursor-pointer'>{item.icon}</span>
                  {/* <span className='text-xl font-bold text-black'>{item.name}</span> */}
                </div>
              </Link>
            ))
          }

        </div>

        <p className='text-[12px] font-normal text-white text-center mb-3'>
          &copy; 2024 Settlo Technologies Ltd. All rights reserved.
        </p>

      </div>
    </section>
  )
}


export { Footer };
