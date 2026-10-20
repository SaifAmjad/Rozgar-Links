import { zodResolver } from '@hookform/resolvers/zod';
import {
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  LoaderCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  Controller,
  FormProvider,
  useForm,
  useWatch,
  type FieldErrors,
  type FieldPath,
} from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  applicationFieldsSchema,
  gulfCountries,
  type ApplicationFields,
  type ApplicationFieldsInput,
  type JobTaxonomy,
  type PublicConfigResponse,
} from '@rozgar-links/shared';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TextInput } from '../../components/ui/TextInput';
import { fetchApplicationSetup, submitApplication } from './api';
import { SelectField } from './FormControls';
import { formatCnic, formatExperience, formatPakistaniMobile } from './inputFormatting';
import {
  validateApplicationFile,
  validateApplicationFiles,
  type ApplicationFileKey,
  type ApplicationFiles,
} from './fileValidation';

const steps = ['Personal', 'Preferences', 'Documents', 'Payment', 'Review'] as const;

const stepDescriptions = [
  'Tell us who you are and how to contact you.',
  'Choose the countries and types of work you prefer.',
  'Select the test documents needed for this demonstration.',
  'Review the test payment example and upload the payment screenshot.',
  'Check every section before the final action.',
] as const;

const countryLabels: Record<(typeof gulfCountries)[number], string> = {
  'saudi-arabia': 'Saudi Arabia',
  'united-arab-emirates': 'United Arab Emirates',
  oman: 'Oman',
  qatar: 'Qatar',
  kuwait: 'Kuwait',
  bahrain: 'Bahrain',
};

const personalFields: FieldPath<ApplicationFieldsInput>[] = [
  'firstName',
  'lastName',
  'dateOfBirth',
  'nationalId',
  'email',
  'phone',
  'currentCity',
];

const preferenceFields: FieldPath<ApplicationFieldsInput>[] = [
  'countries',
  'field',
  'yearsExperience',
];

const defaultValues: ApplicationFieldsInput = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  nationalId: '',
  email: '',
  phone: '',
  currentCity: '',
  countries: [],
  field: '',
  yearsExperience: '',
};

type FileErrors = Partial<Record<ApplicationFileKey, string>>;

function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === 'string' ? message : undefined;
  }
  return undefined;
}

function collectErrorMessages(errors: FieldErrors<ApplicationFieldsInput>): string[] {
  const messages: string[] = [];
  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object') return;
    const directMessage = errorMessage(value);
    if (directMessage) {
      messages.push(directMessage);
      return;
    }
    Object.values(value).forEach(visit);
  };
  visit(errors);
  return [...new Set(messages)];
}

function maskIdentifier(value: unknown) {
  const text = typeof value === 'string' ? value : '';
  return text ? `••••${text.replace(/[^a-z0-9]/gi, '').slice(-4)}` : 'Not provided';
}

function checkboxClasses() {
  return 'h-5 w-5 rounded border-border text-brand-blue';
}

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

function FileField({
  accept,
  description,
  error,
  file,
  inputRef,
  label,
  onChange,
  required,
}: FileFieldProps) {
  const id = `application-${label.toLowerCase().replaceAll(' ', '-')}`;
  return (
    <div className="space-y-2 rounded-xl border bg-surface p-4">
      <label className="block text-sm font-bold text-primary" htmlFor={id}>
        {label}
        {required ? <span className="ml-1 text-error">*</span> : null}
      </label>
      <p className="text-sm text-muted" id={`${id}-description`}>
        {description}
      </p>
      <input
        accept={accept}
        aria-describedby={`${id}-description${error ? ` ${id}-error` : ''}`}
        aria-invalid={error ? true : undefined}
        className="block min-h-11 w-full rounded-xl border bg-bg p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:font-bold file:text-white"
        id={id}
        onChange={(event) => onChange(event.target.files?.[0])}
        ref={inputRef}
        type="file"
      />
      {file ? (
        <p className="text-sm font-semibold text-brand-green">Selected: {file.name}</p>
      ) : null}
      {error ? (
        <p className="text-sm font-semibold text-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface SetupState {
  config: PublicConfigResponse;
  taxonomy: JobTaxonomy;
}

export function ApplicationWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedCountry = searchParams.get('country');
  const requestedField = searchParams.get('field');
  const requestedJob = searchParams.get('job');
  const prefilledCountry = (
    Object.entries(countryLabels) as [(typeof gulfCountries)[number], string][]
  ).find(([slug, label]) => requestedCountry === slug || requestedCountry === label)?.[0];
  const methods = useForm<ApplicationFieldsInput, unknown, ApplicationFields>({
    defaultValues: {
      ...defaultValues,
      countries: prefilledCountry ? [prefilledCountry] : [],
    },
    mode: 'onChange',
    resolver: zodResolver(applicationFieldsSchema),
    shouldUnregister: false,
  });
  const {
    control,
    formState: { errors },
    getFieldState,
    handleSubmit,
    register,
    setValue,
    trigger,
  } = methods;
  const [currentStep, setCurrentStep] = useState(0);
  const [setup, setSetup] = useState<SetupState>();
  const [setupError, setSetupError] = useState('');
  const [setupAttempt, setSetupAttempt] = useState(0);
  const [files, setFiles] = useState<ApplicationFiles>({});
  const [fileErrors, setFileErrors] = useState<FileErrors>({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [website, setWebsite] = useState('');
  const [paymentPreviewUrl, setPaymentPreviewUrl] = useState('');
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const fileInputRefs = useRef<Partial<Record<ApplicationFileKey, HTMLInputElement | null>>>({});
  const paymentPreviewUrlRef = useRef('');
  const submissionLock = useRef(false);

  const selectedField = useWatch({ control, name: 'field' });
  const allValues = useWatch({ control });
  const applicationSubmissionEnabled = setup?.config.applicationSubmissionEnabled ?? false;

  useEffect(() => {
    const controller = new AbortController();
    fetchApplicationSetup(controller.signal)
      .then(setSetup)
      .catch(() => {
        if (!controller.signal.aborted) {
          setSetupError('Application setup could not be loaded. Please retry.');
        }
      });
    return () => controller.abort();
  }, [setupAttempt]);

  useEffect(() => {
    if (
      setup &&
      requestedField &&
      !selectedField &&
      setup.taxonomy.fields.some((field) => field.id === requestedField)
    ) {
      setValue('field', requestedField, { shouldDirty: true, shouldValidate: true });
    }
  }, [requestedField, selectedField, setValue, setup]);

  useEffect(() => {
    return () => {
      if (paymentPreviewUrlRef.current) URL.revokeObjectURL(paymentPreviewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [currentStep]);

  useEffect(() => {
    if (currentStep !== 4) return;

    void trigger(undefined, { shouldFocus: false }).then((valid) => {
      if (!valid) setShowErrorSummary(true);
    });
  }, [currentStep, trigger]);

  const currentFormErrors = collectErrorMessages(errors);
  const currentFileErrors = Object.values(fileErrors).filter((message): message is string =>
    Boolean(message),
  );
  const summaryErrors = [...new Set([...currentFormErrors, ...currentFileErrors])];

  function changeFile(key: ApplicationFileKey, file?: File) {
    setSubmissionError('');
    setFiles((current) => ({ ...current, [key]: file }));
    setFileErrors((current) => ({ ...current, [key]: validateApplicationFile(key, file) }));
    if (key === 'paymentScreenshot') {
      if (paymentPreviewUrlRef.current) URL.revokeObjectURL(paymentPreviewUrlRef.current);
      const nextUrl =
        file && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : '';
      paymentPreviewUrlRef.current = nextUrl;
      setPaymentPreviewUrl(nextUrl);
    }
  }

  function retrySetup() {
    setSetup(undefined);
    setSetupError('');
    setSetupAttempt((value) => value + 1);
  }

  async function validateFileStep(keys: ApplicationFileKey[]) {
    const nextErrors = keys.reduce<FileErrors>((result, key) => {
      const message = validateApplicationFile(key, files[key]);
      if (message) result[key] = message;
      return result;
    }, {});
    setFileErrors((current) => ({ ...current, ...nextErrors }));
    const firstInvalid = keys.find((key) => nextErrors[key]);
    if (firstInvalid) fileInputRefs.current[firstInvalid]?.focus();
    return !firstInvalid;
  }

  async function validateFields(fields: FieldPath<ApplicationFieldsInput>[]) {
    await trigger(fields, { shouldFocus: true });
    return fields.every((field) => !getFieldState(field).invalid);
  }

  async function nextStep() {
    setShowErrorSummary(true);
    setSubmissionError('');
    let valid = true;

    if (currentStep === 0) valid = await validateFields(personalFields);
    if (currentStep === 1) valid = await validateFields(preferenceFields);
    if (currentStep === 2) valid = await validateFileStep(['cv']);
    if (currentStep === 3) {
      valid = (await validateFileStep(['paymentScreenshot'])) && Boolean(setup);
    }

    if (!valid) return;
    setShowErrorSummary(false);
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  }

  function goToStep(step: number) {
    if (step <= currentStep) {
      setShowErrorSummary(false);
      setCurrentStep(step);
    }
  }

  async function copyValue(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(`${label} copied.`);
    } catch {
      setCopyStatus(`Could not copy ${label.toLowerCase()}.`);
    }
  }

  async function onValidSubmit(application: ApplicationFields) {
    if (!applicationSubmissionEnabled) {
      setSubmissionError('Application submission is disabled in this hosted demo.');
      return;
    }
    if (submissionLock.current) return;
    submissionLock.current = true;
    setIsSubmitting(true);
    setSubmissionError('');
    setShowErrorSummary(false);
    try {
      const result = await submitApplication(application, files, website);
      navigate('/success', { replace: true, state: result });
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : 'The application could not be submitted. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
      submissionLock.current = false;
    }
  }

  function onInvalidSubmit() {
    setShowErrorSummary(true);
  }

  const allFilesValid = Object.keys(validateApplicationFiles(files)).length === 0;
  const allFieldsValid = applicationFieldsSchema.safeParse(allValues).success;
  const canSubmit =
    currentStep === 4 && allFieldsValid && allFilesValid && applicationSubmissionEnabled;

  return (
    <FormProvider {...methods}>
      <div className="mx-auto max-w-4xl">
        <form
          className="min-w-0"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit(onValidSubmit, onInvalidSubmit)(event);
          }}
        >
          <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
            <label htmlFor="application-website">Website</label>
            <input
              autoComplete="off"
              id="application-website"
              onChange={(event) => setWebsite(event.target.value)}
              tabIndex={-1}
              type="text"
              value={website}
            />
          </div>
          {setup && !applicationSubmissionEnabled ? (
            <div
              className="mb-5 rounded-xl border border-warning/40 bg-amber-50 px-4 py-3 text-sm text-text"
              id="demo-submission-notice"
              role="status"
            >
              <strong className="text-primary">Demo only:</strong>{' '}
              <span className="text-muted">nothing is submitted. Use test details and files.</span>
            </div>
          ) : null}
          {requestedJob ? (
            <div className="mb-5 flex gap-3 rounded-xl border bg-surface p-4 text-sm leading-6">
              <BriefcaseBusiness
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-brand-green"
                size={21}
              />
              <p className="text-muted">
                <strong className="text-primary">Job selected.</strong> Preferences were filled when
                available and can be changed.
              </p>
            </div>
          ) : null}
          <div className="mb-5 rounded-xl border bg-surface p-4 lg:hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-green">
                  Step {currentStep + 1} of {steps.length}
                </p>
                <p className="mt-1 font-bold text-primary">{steps[currentStep]}</p>
              </div>
              <span className="text-sm font-bold text-muted">
                {Math.round(((currentStep + 1) / steps.length) * 100)}%
              </span>
            </div>
            <div
              aria-label={`Application progress: step ${currentStep + 1} of ${steps.length}`}
              aria-valuemax={steps.length}
              aria-valuemin={1}
              aria-valuenow={currentStep + 1}
              className="mt-3 h-2 overflow-hidden rounded-full bg-border"
              role="progressbar"
            >
              <div
                className="h-full rounded-full bg-brand-green transition-[width]"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <nav aria-label="Application progress" className="mb-6 hidden lg:block">
            <ol className="grid grid-cols-5 gap-2">
              {steps.map((step, index) => (
                <li className="min-w-0 flex-1" key={step}>
                  <button
                    aria-current={index === currentStep ? 'step' : undefined}
                    className={`flex min-h-12 w-full items-center gap-2 rounded-xl border px-3 text-left text-sm font-bold ${
                      index === currentStep
                        ? 'border-primary bg-primary text-white'
                        : index < currentStep
                          ? 'bg-surface text-primary'
                          : 'cursor-not-allowed bg-bg text-muted'
                    }`}
                    disabled={index > currentStep}
                    onClick={() => goToStep(index)}
                    type="button"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                        index === currentStep ? 'bg-white text-primary' : 'bg-border text-primary'
                      }`}
                    >
                      {index < currentStep ? <Check aria-hidden="true" size={14} /> : index + 1}
                    </span>
                    {step}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <Card className="p-4 sm:p-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-green">
              Step {currentStep + 1} of {steps.length}
            </p>
            <h2 className="mt-2 text-2xl" ref={stepHeadingRef} tabIndex={-1}>
              {steps[currentStep]}
            </h2>
            <p className="mt-2 text-sm text-muted">{stepDescriptions[currentStep]}</p>
            <p className="mt-2 text-xs font-semibold text-muted">
              <span className="text-error">*</span> Required
            </p>

            {showErrorSummary && summaryErrors.length > 0 ? (
              <div className="mt-5 rounded-xl border border-error bg-red-50 p-4" role="alert">
                <p className="font-bold text-error">Please fix the following:</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-error">
                  {summaryErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-6">
              {currentStep === 0 ? <PersonalStep errors={errors} register={register} /> : null}
              {currentStep === 1 && setup ? (
                <PreferencesStep
                  control={control}
                  errors={errors}
                  register={register}
                  taxonomy={setup.taxonomy}
                />
              ) : null}
              {currentStep === 1 && !setup ? (
                <SetupUnavailable error={setupError} onRetry={retrySetup} />
              ) : null}
              {currentStep === 2 ? (
                <DocumentsStep
                  errors={fileErrors}
                  files={files}
                  setInputRef={(key, element) => {
                    fileInputRefs.current[key] = element;
                  }}
                  onChange={changeFile}
                />
              ) : null}
              {currentStep === 3 && setup ? (
                <PaymentStep
                  config={setup.config}
                  copyStatus={copyStatus}
                  fileError={fileErrors.paymentScreenshot}
                  fileInputRef={(element) => {
                    fileInputRefs.current.paymentScreenshot = element;
                  }}
                  onCopy={copyValue}
                  onFileChange={(file) => changeFile('paymentScreenshot', file)}
                  paymentFile={files.paymentScreenshot}
                  paymentPreviewUrl={paymentPreviewUrl}
                />
              ) : null}
              {currentStep === 3 && !setup ? (
                <SetupUnavailable error={setupError} onRetry={retrySetup} />
              ) : null}
              {currentStep === 4 ? (
                <ReviewStep
                  files={files}
                  onEdit={goToStep}
                  taxonomy={setup?.taxonomy}
                  values={allValues as Record<string, unknown>}
                />
              ) : null}
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <Button
                className="w-full sm:w-auto"
                disabled={currentStep === 0 || isSubmitting}
                onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
                variant="outline"
              >
                <ChevronLeft aria-hidden="true" size={18} /> Back
              </Button>
              {currentStep < 4 ? (
                <Button className="w-full sm:w-auto" onClick={() => void nextStep()}>
                  Continue to {steps[currentStep + 1]} <ChevronRight aria-hidden="true" size={18} />
                </Button>
              ) : (
                <Button
                  aria-describedby={
                    applicationSubmissionEnabled ? undefined : 'demo-submission-notice'
                  }
                  disabled={!canSubmit || isSubmitting}
                  className="w-full sm:w-auto"
                  type="submit"
                >
                  {isSubmitting ? (
                    <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
                  ) : null}
                  {applicationSubmissionEnabled
                    ? 'Submit application'
                    : 'Submission disabled in demo'}
                </Button>
              )}
            </div>

            <div aria-live="polite" className="mt-4 min-h-6 text-sm font-semibold">
              {submissionError ? (
                <p className="rounded-xl border border-error bg-red-50 p-4 text-error" role="alert">
                  {submissionError} Your information and selected files remain available for retry.
                </p>
              ) : null}
            </div>
          </Card>
        </form>
      </div>
    </FormProvider>
  );
}

interface PersonalStepProps {
  errors: FieldErrors<ApplicationFieldsInput>;
  register: ReturnType<typeof useForm<ApplicationFieldsInput>>['register'];
}

function PersonalStep({ errors, register }: PersonalStepProps) {
  const nationalIdRegistration = register('nationalId');
  const phoneRegistration = register('phone');

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-lg font-bold text-primary">Basic details</legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <TextInput
            autoComplete="given-name"
            error={errorMessage(errors.firstName)}
            label="First name"
            maxLength={100}
            required
            {...register('firstName')}
          />
          <TextInput
            autoComplete="family-name"
            error={errorMessage(errors.lastName)}
            label="Last name"
            maxLength={100}
            required
            {...register('lastName')}
          />
          <TextInput
            error={errorMessage(errors.dateOfBirth)}
            label="Date of birth"
            required
            type="date"
            {...register('dateOfBirth')}
          />
          <SelectField error={errorMessage(errors.gender)} label="Gender" {...register('gender')}>
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </SelectField>
        </div>
      </fieldset>

      <fieldset className="border-t pt-7">
        <legend className="text-lg font-bold text-primary">Identification</legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <TextInput
            {...nationalIdRegistration}
            description="Pakistan CNIC format: 12345-1234567-1."
            error={errorMessage(errors.nationalId)}
            inputMode="numeric"
            label="CNIC"
            maxLength={15}
            onChange={(event) => {
              event.target.value = formatCnic(event.target.value);
              void nationalIdRegistration.onChange(event);
            }}
            pattern="[0-9]{5}-[0-9]{7}-[0-9]"
            placeholder="12345-1234567-1"
            required
          />
        </div>
      </fieldset>

      <fieldset className="border-t pt-7">
        <legend className="text-lg font-bold text-primary">Contact details</legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <TextInput
            autoComplete="email"
            description="We will use this for application updates."
            error={errorMessage(errors.email)}
            label="Email address"
            maxLength={254}
            placeholder="name@example.com"
            required
            type="email"
            {...register('email')}
          />
          <TextInput
            {...phoneRegistration}
            autoComplete="tel"
            description="11 digits, starting with 03."
            error={errorMessage(errors.phone)}
            inputMode="numeric"
            label="Phone / WhatsApp"
            maxLength={11}
            onChange={(event) => {
              event.target.value = formatPakistaniMobile(event.target.value);
              void phoneRegistration.onChange(event);
            }}
            pattern="03[0-9]{9}"
            placeholder="03001234567"
            required
            type="tel"
          />
          <TextInput
            autoComplete="address-level2"
            error={errorMessage(errors.currentCity)}
            label="Current city"
            maxLength={100}
            required
            {...register('currentCity')}
          />
        </div>
      </fieldset>
    </div>
  );
}

interface PreferencesStepProps {
  control: ReturnType<typeof useForm<ApplicationFieldsInput>>['control'];
  errors: FieldErrors<ApplicationFieldsInput>;
  register: ReturnType<typeof useForm<ApplicationFieldsInput>>['register'];
  taxonomy: JobTaxonomy;
}

function PreferencesStep({ control, errors, register, taxonomy }: PreferencesStepProps) {
  const yearsExperienceRegistration = register('yearsExperience');

  return (
    <div className="space-y-7">
      <fieldset>
        <legend className="text-sm font-bold text-primary">Preferred Gulf countries *</legend>
        <Controller
          control={control}
          name="countries"
          render={({ field }) => (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex min-h-11 items-center gap-3 rounded-xl border bg-surface px-4 py-2 font-semibold">
                <input
                  checked={field.value?.includes('all-gulf') ?? false}
                  className={checkboxClasses()}
                  onChange={(event) => field.onChange(event.target.checked ? ['all-gulf'] : [])}
                  type="checkbox"
                />
                All Gulf countries
              </label>
              {gulfCountries.map((country) => (
                <label
                  className="flex min-h-11 items-center gap-3 rounded-xl border px-4 py-2"
                  key={country}
                >
                  <input
                    checked={field.value?.includes(country) ?? false}
                    className={checkboxClasses()}
                    disabled={field.value?.includes('all-gulf')}
                    onChange={(event) => {
                      const withoutAll = (field.value ?? []).filter(
                        (value) => value !== 'all-gulf',
                      );
                      field.onChange(
                        event.target.checked
                          ? [...withoutAll, country]
                          : withoutAll.filter((value) => value !== country),
                      );
                    }}
                    type="checkbox"
                  />
                  {countryLabels[country]}
                </label>
              ))}
            </div>
          )}
        />
        {errorMessage(errors.countries) ? (
          <p className="mt-2 text-sm font-semibold text-error">{errorMessage(errors.countries)}</p>
        ) : null}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          error={errorMessage(errors.field)}
          label="Job field"
          required
          {...register('field')}
        >
          <option value="">Select a field</option>
          {taxonomy.fields.map((field) => (
            <option key={field.id} value={field.id}>
              {field.label}
            </option>
          ))}
        </SelectField>
        <TextInput
          {...yearsExperienceRegistration}
          error={errorMessage(errors.yearsExperience)}
          inputMode="decimal"
          label="Years of experience"
          maxLength={4}
          onChange={(event) => {
            event.target.value = formatExperience(event.target.value);
            void yearsExperienceRegistration.onChange(event);
          }}
          pattern="[0-9]{1,2}(\.[0-9])?"
          required
          type="text"
        />
      </div>
    </div>
  );
}

interface DocumentsStepProps {
  errors: FileErrors;
  files: ApplicationFiles;
  onChange: (key: ApplicationFileKey, file?: File) => void;
  setInputRef: (key: ApplicationFileKey, element: HTMLInputElement | null) => void;
}

function DocumentsStep({ errors, files, onChange, setInputRef }: DocumentsStepProps) {
  return (
    <div className="space-y-4">
      <FileField
        accept=".pdf,.doc,.docx"
        description="PDF, DOC or DOCX; maximum 5 MiB."
        error={errors.cv}
        file={files.cv}
        inputRef={(element) => setInputRef('cv', element)}
        label="CV"
        onChange={(file) => onChange('cv', file)}
        required
      />
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

function PaymentStep({
  config,
  copyStatus,
  fileError,
  fileInputRef,
  onCopy,
  onFileChange,
  paymentFile,
  paymentPreviewUrl,
}: PaymentStepProps) {
  const paymentDetails = [
    ['Bank', config.bankName],
    ['Account title', config.bankAccountTitle],
    ['Account number', config.bankAccountNumber],
    ['IBAN', config.bankIban],
  ] as const;
  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-warning bg-amber-50 p-5">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-warning">
          Test payment details — do not pay
        </p>
        <p className="mt-2 text-sm text-muted">Demo values only. Payment is not active.</p>
        <dl className="mt-4 space-y-3">
          {paymentDetails.map(([label, value]) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-bg p-3"
              key={label}
            >
              <div>
                <dt className="text-xs font-bold uppercase text-muted">{label}</dt>
                <dd className="font-semibold text-primary">{value}</dd>
              </div>
              <Button
                aria-label={`Copy ${label}`}
                onClick={() => void onCopy(label, value)}
                variant="ghost"
              >
                <Copy aria-hidden="true" size={16} /> Copy
              </Button>
            </div>
          ))}
        </dl>
        <p className="mt-4 font-bold text-primary">
          Demo fee: {config.serviceFeeCurrency} {config.serviceFeeAmount.toLocaleString()}
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
          alt="Payment screenshot preview"
          className="max-h-72 rounded-xl border object-contain"
          src={paymentPreviewUrl}
        />
      ) : null}
    </div>
  );
}

function SetupUnavailable({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border bg-surface p-5" role={error ? 'alert' : 'status'}>
      <p className="font-semibold text-primary">
        {error || 'Loading validated application options…'}
      </p>
      {error ? (
        <Button className="mt-4" onClick={onRetry} variant="outline">
          Retry setup
        </Button>
      ) : null}
    </div>
  );
}

function ReviewStep({
  files,
  onEdit,
  taxonomy,
  values,
}: {
  files: ApplicationFiles;
  onEdit: (step: number) => void;
  taxonomy?: JobTaxonomy | undefined;
  values: Record<string, unknown>;
}) {
  const textValue = (key: string) => (typeof values[key] === 'string' ? values[key] : '');
  const selectedCountries = Array.isArray(values.countries)
    ? values.countries.filter((value): value is string => typeof value === 'string')
    : [];
  const field = taxonomy?.fields.find((item) => item.id === textValue('field'));
  const countries = selectedCountries.includes('all-gulf')
    ? 'All Gulf countries'
    : selectedCountries
        .filter((country): country is (typeof gulfCountries)[number] => country in countryLabels)
        .map((country) => countryLabels[country])
        .join(', ');
  const sections: { title: string; step: number; items: [string, string | undefined][] }[] = [
    {
      title: 'Personal',
      step: 0,
      items: [
        ['Name', `${textValue('firstName')} ${textValue('lastName')}`.trim()],
        ['Date of birth', textValue('dateOfBirth')],
        ['National ID', maskIdentifier(values.nationalId)],
        ['Email', textValue('email')],
        ['Phone', textValue('phone')],
        ['Current city', textValue('currentCity')],
      ],
    },
    {
      title: 'Preferences',
      step: 1,
      items: [
        ['Countries', countries],
        ['Field', field?.label],
        ['Experience', `${textValue('yearsExperience')} years`],
      ],
    },
    {
      title: 'Documents',
      step: 2,
      items: [['CV', files.cv?.name]],
    },
    {
      title: 'Payment evidence',
      step: 3,
      items: [
        ['Screenshot', files.paymentScreenshot?.name],
        ['Status', 'Unverified demo evidence'],
      ],
    },
  ];
  return (
    <div className="space-y-5">
      <p className="rounded-xl bg-surface p-3 text-sm text-muted">
        Check your details. Sensitive identifiers are masked.
      </p>
      {sections.map((section) => (
        <section className="rounded-xl border p-5" key={section.title}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg">{section.title}</h3>
            <Button onClick={() => onEdit(section.step)} variant="ghost">
              Edit
            </Button>
          </div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {section.items
              .filter(([, value]) => value !== undefined && value !== '')
              .map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt>
                  <dd className="mt-1 break-words font-semibold text-text">{String(value)}</dd>
                </div>
              ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
