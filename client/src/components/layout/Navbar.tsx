import { Menu, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { LanguageSelect } from '../../i18n/LanguageSelect';
import { useLanguage } from '../../i18n/useLanguage';
import { cn } from '../../lib/cn';
import { BrandLogo } from '../BrandLogo';
import { Button } from '../ui/Button';
import { PageContainer } from './PageContainer';

const navigationItems = [
  { label: 'Home', to: '/' },
  { label: 'Jobs', to: '/jobs' },
  { label: 'Apply Now', to: '/apply' },
];

function navLinkClasses(isActive: boolean) {
  return cn(
    'inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold transition-colors hover:bg-surface hover:text-primary',
    isActive ? 'bg-surface text-primary' : 'text-muted',
  );
}

export function Navbar() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  function openMenu() {
    setIsOpen(true);
    window.requestAnimationFrame(() => firstMobileLinkRef.current?.focus());
  }

  function toggleMenu() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    openMenu();
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-bg/95 backdrop-blur">
      <PageContainer>
        <div className="flex min-h-18 items-center justify-between gap-4">
          <Link className="rounded-xl" to="/" aria-label={`Rozgar Links — ${t('Home')}`}>
            <BrandLogo />
          </Link>

          <nav aria-label={t('Primary navigation')} className="hidden items-center gap-1 md:flex">
            {navigationItems.map((item) => (
              <NavLink
                className={({ isActive }) => navLinkClasses(isActive)}
                end={item.to === '/'}
                key={item.to}
                to={item.to}
              >
                {t(item.label)}
              </NavLink>
            ))}
            <LanguageSelect compact />
          </nav>

          <Button
            aria-controls={menuId}
            aria-expanded={isOpen}
            aria-label={t(isOpen ? 'Close navigation menu' : 'Open navigation menu')}
            className="min-w-11 px-3 md:hidden"
            onClick={toggleMenu}
            ref={menuButtonRef}
            variant="ghost"
          >
            {isOpen ? <X aria-hidden="true" size={24} /> : <Menu aria-hidden="true" size={24} />}
          </Button>
        </div>

        {isOpen ? (
          <nav aria-label={t('Mobile navigation')} className="border-t py-3 md:hidden" id={menuId}>
            <div className="grid gap-1">
              {navigationItems.map((item, index) => (
                <NavLink
                  className={({ isActive }) => navLinkClasses(isActive)}
                  end={item.to === '/'}
                  key={item.to}
                  onClick={() => setIsOpen(false)}
                  ref={index === 0 ? firstMobileLinkRef : undefined}
                  to={item.to}
                >
                  {t(item.label)}
                </NavLink>
              ))}
              <div className="mt-2 border-t pt-3">
                <LanguageSelect />
              </div>
            </div>
          </nav>
        ) : null}
      </PageContainer>
    </header>
  );
}
