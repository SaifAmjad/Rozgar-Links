import { Copy } from 'lucide-react';
import type { PublicConfigResponse } from '@rozgar-links/shared';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../i18n/useLanguage';
interface FileFieldProps {
  accept: string;
  description: string;
  error?: string | undefined;
  file?: File | undefined;
  inputRef: (element: HTMLInputElement | null) => void;
  label: string;
  onChange: (file?: File) => void;
  required?: boolean | undefined;
}

export function FileField({
  accept,
  description,
  error,
  file,
  inputRef,
  label,
  onChange,
  required,
}: FileFieldProps) {
  const { t } = useLanguage();
  const id = `application-${label.toLowerCase().replaceAll(' ', '-')}`;
  return (
    <div className="space-y-2 rounded-xl border bg-surface p-4">
      <label className="block text-sm font-bold text-primary" htmlFor={id}>
        {t(label)}
        {required ? <span className="ms-1 text-error">*</span> : null}
      </label>
      <p className="text-sm text-muted" id={`${id}-description`}>
        {t(description)}
      </p>
      <input
        accept={accept}
        aria-describedby={`${id}-description${error ? ` ${id}-error` : ''}`}
        aria-invalid={error ? true : undefined}
        aria-required={required}
        className="block min-h-11 w-full rounded-xl border bg-bg p-2 text-sm file:me-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:font-bold file:text-white"
        id={id}
        onChange={(event) => onChange(event.target.files?.[0])}
        ref={inputRef}
        type="file"
      />
      {file ? (
        <p className="text-sm font-semibold text-brand-green">
          {t('Selected: {file}', { file: file.name })}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm font-semibold text-error" id={`${id}-error`}>
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}

interface PaymentStepProps {
  config: PublicConfigResponse;
  copyStatus: string;
  fileError?: string | undefined;
  fileInputRef: (element: HTMLInputElement | null) => void;
  onCopy: (label: string, value: string) => void;
  onFileChange: (file?: File) => void;
  paymentFile?: File | undefined;
  paymentPreviewUrl: string;
}

export function PaymentStep({
  config,
  copyStatus,
  fileError,
  fileInputRef,
  onCopy,
  onFileChange,
  paymentFile,
  paymentPreviewUrl,
}: PaymentStepProps) {
  const { t } = useLanguage();
  const paymentDetails = [
    ['Bank', config.bankName],
    ['Account title', config.bankAccountTitle],
    ['Account number', config.bankAccountNumber],
    ['IBAN', config.bankIban],
  ] as const;
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-surface p-5 text-sm leading-7">
        <h3 className="text-lg">
          {t('One-time CV preparation fee')}: {config.serviceFeeCurrency} {config.serviceFeeAmount}
        </h3>
        <p className="mt-2">
          {t(
            "If you don't already have a Rozgar Links CV, our team will prepare one for you. Upload your payment screenshot. Our team will manually review payment before preparing your CV.",
          )}
        </p>
        <p className="mt-2 font-semibold">
          {t(
            'This fee is for CV preparation only. It does not guarantee a job, interview, visa or placement.',
          )}
        </p>
      </div>
      <div className="rounded-xl border-2 border-warning bg-amber-50 p-5">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-warning">
          {t('Test payment details — do not pay')}
        </p>
        <p className="mt-2 text-sm text-muted">{t('Demo values only. Payment is not active.')}</p>
        <dl className="mt-4 space-y-3">
          {paymentDetails.map(([label, value]) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-bg p-3"
              key={label}
            >
              <div>
                <dt className="text-xs font-bold uppercase text-muted">{t(label)}</dt>
                <dd className="font-semibold text-primary" dir="ltr">
                  {value}
                </dd>
              </div>
              <Button
                aria-label={t('Copy {label}', { label: t(label) })}
                onClick={() => void onCopy(label, value)}
                variant="ghost"
              >
                <Copy aria-hidden="true" size={16} /> {t('Copy')}
              </Button>
            </div>
          ))}
        </dl>
        <p className="mt-4 font-bold text-primary">
          {t('Demo fee:')} {config.serviceFeeCurrency} {config.serviceFeeAmount.toLocaleString()}
        </p>
        <p aria-live="polite" className="mt-2 min-h-5 text-sm font-semibold text-brand-green">
          {copyStatus}
        </p>
      </div>

      <FileField
        accept=".jpg,.jpeg,.png"
        description="Required JPEG or PNG; maximum 5 MiB. The secure server validates its file signature again."
        error={fileError}
        file={paymentFile}
        inputRef={fileInputRef}
        label="Payment screenshot"
        onChange={onFileChange}
        required
      />
      {paymentPreviewUrl ? (
        <img
          alt={t('Payment screenshot preview')}
          className="max-h-72 rounded-xl border object-contain"
          src={paymentPreviewUrl}
        />
      ) : null}
    </div>
  );
}
