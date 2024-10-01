import Link from 'next/link';

import { Button } from './Button';
import { CTABanner } from './CTABanner';
import { Section } from './Section';

const Banner = () => (
  <Section>
    <CTABanner
      title="Use Settlo to manage your business hassle-free."
      subtitle="Start 30 days free trial."
      button={
        <Link href="/register">
            <div className="rounded-full border-emerald-700 border-1 text-amber-50 bg-emerald-500 pl-10 pr-10 pt-3 pb-3">
                <Button>Get Started</Button>
            </div>
        </Link>
      }
    />
  </Section>
);

export { Banner };
