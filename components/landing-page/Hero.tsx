import Link from 'next/link';

import { Background } from './Background';
import { Button } from './Button';
import { HeroOneButton } from './HeroOneButton';
import { Section } from './Section';
import { NavbarTwoColumns } from './NavbarTwoColumns';
import { Logo } from './Logo';
import {ChevronRightIcon} from "@nextui-org/shared-icons";

const Hero = () => (
  <Background color="bg-gray-100">
    <Section yPadding="py-6">
      <NavbarTwoColumns logo={<Logo xl />}>
        <li className='text-medium font-bold mr-3'>
          <Link href="/login">Sign in</Link>
        </li>
        <li className='text-medium font-bold border-1 rounded-full pl-4 pr-4 pt-2 pb-2 flex gap-1 items-center bg-emerald-500 text-lime-50'>
          <Link href="/register">Sign up</Link>
            <ChevronRightIcon fontSize={20} />
        </li>
      </NavbarTwoColumns>
    </Section>

    <Section yPadding="pt-20 pb-32">
      <HeroOneButton
        title={
          <>
            {'Start.Manage.Grow\n'}
            <span className="text-emerald-400 font-bold">Your business with Settlo</span>
          </>
        }
        description="The easiest way to manage and track your business"
        button={
          <Link className='rounded-full' href="https://play.google.com/store/app?id=tz.co.tality">
            <div className="flex items-center w-full justify-center">
                <div className="rounded-full border-1 border-emerald-700 bg-emerald-500 pl-10 pr-10 pt-3 pb-3 text-emerald-50 font-bold">
                  <Button xl>Get Started Today</Button>
                </div>
            </div>
          </Link>
        }
      />
    </Section>
  </Background>
);

export { Hero };
