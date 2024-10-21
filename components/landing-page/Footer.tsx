import Link from 'next/link';

import { Background } from './Background';
import { CenteredFooter } from './CenteredFooter';
import { Section } from './Section';
import { Logo } from './Logo';

const Footer = () => (
  <Background color="bg-gray-50">
    <Section yPadding="py-16">
      <CenteredFooter
        logo={<Logo />}
        iconList={
          <>

          </>
        }>
        <li className="pl-3 pr-3 text-sm font-medium">
          <Link href="/">Home</Link>
        </li>
        <li className="pl-3 pr-3 text-sm font-medium">
          <Link href="/">Support</Link>
        </li>
        <li className="pl-3 pr-3 text-sm font-medium">
          <Link href="/">Contact</Link>
        </li>
        <li className="pl-3 pr-3 text-sm font-medium">
          <Link href="/">
            Feedback
          </Link>
        </li>
      </CenteredFooter>
    </Section>
  </Background>
);

export { Footer };
