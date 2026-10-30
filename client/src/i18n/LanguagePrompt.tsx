import { Languages } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { useLanguage } from './useLanguage';

export function LanguagePrompt() {
  const { hasChosenLanguage, setLanguage } = useLanguage();
  const englishButtonRef = useRef<HTMLButtonElement>(null);
  const urduButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (hasChosenLanguage) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    englishButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [hasChosenLanguage]);

  if (hasChosenLanguage) return null;

  function keepFocusInDialog(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Tab') return;

    if (event.shiftKey && document.activeElement === englishButtonRef.current) {
      event.preventDefault();
      urduButtonRef.current?.focus();
    } else if (!event.shiftKey && document.activeElement === urduButtonRef.current) {
      event.preventDefault();
      englishButtonRef.current?.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-center overflow-y-auto bg-primary/70 p-4 backdrop-blur-sm">
      <section
        aria-describedby="language-dialog-description"
        aria-labelledby="language-dialog-title"
        aria-modal="true"
        className="my-auto w-full max-w-lg rounded-2xl border bg-bg p-6 text-center shadow-2xl sm:p-8"
        onKeyDown={keepFocusInDialog}
        role="dialog"
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
          <Languages aria-hidden="true" size={25} />
        </span>
        <h1 className="mt-5 text-2xl sm:text-3xl" id="language-dialog-title">
          Select your language
        </h1>
        <p className="mt-2 font-urdu text-2xl leading-loose text-primary" dir="rtl" lang="ur">
          اپنی زبان منتخب کریں
        </p>
        <p className="mx-auto mt-3 max-w-md leading-7 text-muted" id="language-dialog-description">
          Choose the language you understand best. You can change it later from the navigation bar.
        </p>
        <p
          className="mx-auto mt-2 max-w-md font-urdu text-lg leading-loose text-muted"
          dir="rtl"
          lang="ur"
        >
          وہ زبان منتخب کریں جو آپ بہتر سمجھتے ہیں۔ آپ بعد میں اوپر موجود مینو سے زبان تبدیل کر سکتے
          ہیں۔
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            className="min-h-14 rounded-xl bg-primary px-5 py-3 text-lg font-bold text-white hover:bg-brand-blue"
            onClick={() => setLanguage('en')}
            ref={englishButtonRef}
            type="button"
          >
            English
          </button>
          <button
            className="min-h-14 rounded-xl bg-brand-green px-5 py-3 font-urdu text-xl font-bold text-white hover:bg-primary"
            dir="rtl"
            lang="ur"
            onClick={() => setLanguage('ur')}
            ref={urduButtonRef}
            type="button"
          >
            اردو
          </button>
        </div>
      </section>
    </div>
  );
}
