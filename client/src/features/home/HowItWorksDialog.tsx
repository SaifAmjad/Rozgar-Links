import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  FileCheck2,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../i18n/useLanguage';

const processSteps = [
  {
    description: 'Choose a country and type of work that matches your experience.',
    icon: BriefcaseBusiness,
    title: 'Choose work',
  },
  {
    description: 'Keep your contact details, CNIC, CV and payment screenshot ready.',
    icon: FileCheck2,
    title: 'Prepare details',
  },
  {
    description: 'Follow the five clear application steps and review everything at the end.',
    icon: CheckCircle2,
    title: 'Check and finish',
  },
] as const;

const focusableSelector =
  'a[href], button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function HowItWorksDialog() {
  const { direction, t } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const step = processSteps[currentStep] ?? processSteps[0];
  const StepIcon = step.icon;

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function openDialog() {
    setCurrentStep(0);
    setIsOpen(true);
  }

  function closeDialog() {
    setIsOpen(false);
    triggerRef.current?.focus();
  }

  function moveStep(direction: -1 | 1) {
    setCurrentStep((value) => Math.min(processSteps.length - 1, Math.max(0, value + direction)));
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDialog();
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveStep(direction === 'rtl' ? 1 : -1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveStep(direction === 'rtl' ? -1 : 1);
      return;
    }

    if (event.key !== 'Tab') return;

    const focusableElements = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements.at(-1);
    if (!firstElement || !lastElement) return;

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  const dialog = isOpen ? (
    <div
      className="fixed inset-0 z-[90] flex justify-center overflow-y-auto bg-primary/70 p-4 backdrop-blur-sm"
      onMouseDown={closeDialog}
    >
      <section
        aria-describedby="how-it-works-description"
        aria-labelledby="how-it-works-title"
        aria-modal="true"
        className="my-auto w-full max-w-xl overflow-hidden rounded-2xl border bg-bg shadow-2xl"
        onKeyDown={handleDialogKeyDown}
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b bg-surface p-5 sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-green">
              {t('How it works')}
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl" id="how-it-works-title">
              {t('How Rozgar Links works')}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted" id="how-it-works-description">
              {t('Follow three simple stages from finding work to submitting your application.')}
            </p>
          </div>
          <button
            aria-label={t('Close how it works guide')}
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border bg-bg text-primary hover:bg-surface"
            onClick={closeDialog}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" size={22} />
          </button>
        </header>

        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-bold text-primary">
              {t('Step {current} of {total}', {
                current: currentStep + 1,
                total: processSteps.length,
              })}
            </p>
            <div className="flex gap-2" role="group" aria-label={t('Guide steps')}>
              {processSteps.map((item, index) => (
                <button
                  aria-current={index === currentStep ? 'step' : undefined}
                  aria-label={t('Go to step {step}: {title}', {
                    step: index + 1,
                    title: t(item.title),
                  })}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-surface"
                  key={item.title}
                  onClick={() => setCurrentStep(index)}
                  type="button"
                >
                  <span
                    aria-hidden="true"
                    className={`h-3 rounded-full transition-[width,background-color] ${
                      index === currentStep ? 'w-8 bg-primary' : 'w-3 bg-border'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface" aria-hidden="true">
            <div
              className="h-full rounded-full bg-brand-green transition-[width]"
              style={{ width: `${((currentStep + 1) / processSteps.length) * 100}%` }}
            />
          </div>

          <div aria-live="polite" className="mt-6 rounded-2xl border bg-surface p-6 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white shadow-soft">
              <StepIcon aria-hidden="true" size={30} />
            </span>
            <h3 className="mt-5 text-2xl">{t(step.title)}</h3>
            <p className="mx-auto mt-3 max-w-md text-base leading-7 text-muted">
              {t(step.description)}
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              className="w-full sm:w-auto"
              disabled={currentStep === 0}
              onClick={() => moveStep(-1)}
              variant="outline"
            >
              <ChevronLeft aria-hidden="true" className="rtl:rotate-180" size={18} />
              {t('Previous')}
            </Button>

            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                if (currentStep < processSteps.length - 1) {
                  moveStep(1);
                  return;
                }
                setIsOpen(false);
                navigate('/apply');
              }}
            >
              {t(currentStep < processSteps.length - 1 ? 'Next' : 'Start application')}
              {currentStep < processSteps.length - 1 ? (
                <ChevronRight aria-hidden="true" className="rtl:rotate-180" size={18} />
              ) : (
                <ArrowRight aria-hidden="true" className="rtl:rotate-180" size={18} />
              )}
            </Button>
          </div>
        </div>
      </section>
    </div>
  ) : null;

  return (
    <>
      <Button className="w-full sm:w-auto" onClick={openDialog} ref={triggerRef} variant="outline">
        <CircleHelp aria-hidden="true" size={18} />
        {t('How it works')}
      </Button>
      {dialog ? createPortal(dialog, document.body) : null}
    </>
  );
}
