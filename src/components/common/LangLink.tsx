import Link, { LinkProps } from 'next/link';
import { useI18n } from '../../context/I18nContext';
import React from 'react';

export function useLangHref(href: string | { pathname: string; [key: string]: any }) {
  const { lang, availableLangs } = useI18n();
  const isLang = (s: string) => availableLangs.includes(s.toLowerCase());
  if (typeof href === 'string') {
    if (href.startsWith('/')) {
      const segments = href.split('/').filter(Boolean);
      if (segments[0] && isLang(segments[0])) {
        segments[0] = lang;
        return '/' + segments.join('/');
      }
      return '/' + [lang, ...segments].join('/');
    }
    return href;
  }
  if (href && typeof href === 'object' && href.pathname) {
    const segments = href.pathname.split('/').filter(Boolean);
    if (segments[0] && isLang(segments[0])) {
      segments[0] = lang;
      return { ...href, pathname: '/' + segments.join('/') };
    }
    return { ...href, pathname: '/' + [lang, ...segments].join('/') };
  }
  return href;
}

type LangLinkProps = LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode };
const LangLink = React.forwardRef<HTMLAnchorElement, LangLinkProps>(
  function LangLink({ href, children, ...props }, ref) {
    const langHref = useLangHref(href);
    return (
      <Link ref={ref} href={langHref} {...props}>
        {children}
      </Link>
    );
  }
);

export default LangLink;
