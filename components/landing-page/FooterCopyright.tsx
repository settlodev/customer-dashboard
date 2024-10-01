import { AppConfig } from './AppConfig';

const FooterCopyright = () => (
  <div className="footer-copyright">
    &copy; {new Date().getFullYear()} {AppConfig.copyRightTitle}.
    <style jsx>
      {`
        .footer-copyright :global(a) {
          @apply text-primary-500;
        }

        .footer-copyright :global(a:hover) {
          @apply underline;
        }
      `}
    </style>
  </div>
);

export { FooterCopyright };
