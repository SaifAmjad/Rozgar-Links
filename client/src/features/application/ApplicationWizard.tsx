import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronLeft, ChevronRight, Copy, LoaderCircle, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
  type FieldErrors,
  type FieldPath,
} from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  applicationFieldsSchema,
  gulfCountries,
  languageLevels,
  supportedCurrencies,
  type ApplicationFields,
  type ApplicationFieldsInput,
  type JobTaxonomy,
  type PublicConfigResponse,
} from '@rozgar-links/shared';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TextInput } from '../../components/ui/TextInput';
import { fetchApplicationSetup, submitApplication } from './api';
import { SelectField, TextareaField } from './FormControls';
import {
  validateApplicationFile,
  validateApplicationFiles,
  type ApplicationFileKey,
  type ApplicationFiles,
} from './fileValidation';

const steps = ['Personal', 'Preferences', 'Documents', 'Payment', 'Review'] as const;

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
  'nationality',
  'nationalId',
  'passportNumber',
  'passportExpiry',
  'email',
  'phone',
  'currentCity',
  'currentCountry',
];

const preferenceFields: FieldPath<ApplicationFieldsInput>[] = [
  'countries',
  'field',
  'roles',
  'otherRole',
  'yearsExperience',
  'highestEducation',
  'expectedSalaryMin',
  'expectedSalaryMax',
  'salaryCurrency',
  'languages',
  'licenceCountry',
];

const paymentFields: FieldPath<ApplicationFieldsInput>[] = [
  'transactionReference',
  'paymentDate',
  'acceptTerms',
  'confirmAccuracy',
  'acceptFeePolicy',
];

const defaultValues: ApplicationFieldsInput = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  nationality: '',
  nationalId: '',
  passportNumber: '',
  passportExpiry: '',
  email: '',
  phone: '',
  currentCity: '',
  currentCountry: '',
  maritalStatus: '',
  countries: [],
  field: '',
  roles: [],
  otherRole: '',
  yearsExperience: '',
  highestEducation: '',
  lastJobTitle: '',
  expectedSalaryMin: '',
  expectedSalaryMax: '',
  salaryCurrency: undefined,
  preferredJoiningDate: '',
  languages: [],
  hasDrivingLicence: false,
  licenceCountry: '',
  willingToRelocate: false,
  skills: [],
  notes: '',
  transactionReference: '',
  paymentDate: '',
  acceptTerms: false,
  confirmAccuracy: false,
  acceptFeePolicy: false,
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
      {file ? <p className="text-sm font-semibold text-brand-green">Selected: {file.name}</p> : null}
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
  const prefilledCountry = (Object.entries(countryLabels) as [(typeof gulfCountries)[number], string][])
    .find(([slug, label]) => requestedCountry === slug || requestedCountry === label)?.[0];
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
    formState: { errors, isValid },
    getFieldState,
    handleSubmit,
    register,
    setValue,
    trigger,
  } = methods;
  const { append, fields: languageFields, remove } = useFieldArray({ control, name: 'languages' });
  const [currentStep, setCurrentStep] = useState(0);
  const [setup, setSetup] = useState<SetupState>();
  const [setupError, setSetupError] = useState('');
  const [setupAttempt, setSetupAttempt] = useState(0);
  const [files, setFiles] = useState<ApplicationFiles>({});
  const [fileErrors, setFileErrors] = useState<FileErrors>({});
  const [roleSearch, setRoleSearch] = useState('');
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
  const selectedRoles = useWatch({ control, name: 'roles' }) ?? [];
  const hasDrivingLicence = useWatch({ control, name: 'hasDrivingLicence' });
  const allValues = useWatch({ control });

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
    return () => {
      if (paymentPreviewUrlRef.current) URL.revokeObjectURL(paymentPreviewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    stepHeadingRef.current?.focus();
  }, [currentStep]);

  const availableRoles = useMemo(() => {
    const field = setup?.taxonomy.fields.find((item) => item.id === selectedField);
    const query = roleSearch.trim().toLowerCase();
    return field?.roles.filter((role) => role.label.toLowerCase().includes(query)) ?? [];
  }, [roleSearch, selectedField, setup]);

  const currentFormErrors = collectErrorMessages(errors);
  const currentFileErrors = Object.values(fileErrors).filter(
    (message): message is string => Boolean(message),
  );
  const summaryErrors = [...new Set([...currentFormErrors, ...currentFileErrors])];

  function changeFile(key: ApplicationFileKey, file?: File) {
    setSubmissionError('');
    setFiles((current) => ({ ...current, [key]: file }));
    setFileErrors((current) => ({ ...current, [key]: validateApplicationFile(key, file) }));
    if (key === 'paymentScreenshot') {
      if (paymentPreviewUrlRef.current) URL.revokeObjectURL(paymentPreviewUrlRef.current);
      const nextUrl = file && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : '';
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
    if (currentStep === 2) valid = await validateFileStep(['cv', 'passportCopy', 'photo']);
    if (currentStep === 3) {
      const [fieldsValid, fileValid] = await Promise.all([
        validateFields(paymentFields),
        validateFileStep(['paymentScreenshot']),
      ]);
      valid = fieldsValid && fileValid && Boolean(setup);
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
  const canSubmit =
    currentStep === 4 && isValid && allFilesValid && Boolean(setup);

  return (
    <FormProvider {...methods}>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
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
          <nav aria-label="Application progress" className="mb-6 overflow-x-auto pb-2">
            <ol className="flex min-w-[38rem] gap-2">
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

          <Card>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-green">
              Step {currentStep + 1} of {steps.length}
            </p>
            <h2 className="mt-2 text-2xl" ref={stepHeadingRef} tabIndex={-1}>
              {steps[currentStep]}
            </h2>

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
              {currentStep === 0 ? (
                <PersonalStep errors={errors} register={register} />
              ) : null}
              {currentStep === 1 && setup ? (
                <PreferencesStep
                  appendLanguage={append}
                  availableRoles={availableRoles}
                  control={control}
                  errors={errors}
                  hasDrivingLicence={hasDrivingLicence}
                  languageFields={languageFields}
                  register={register}
                  removeLanguage={remove}
                  roleSearch={roleSearch}
                  selectedField={selectedField}
                  selectedRoles={selectedRoles}
                  setRoleSearch={setRoleSearch}
                  setValue={setValue}
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
                  errors={errors}
                  fileError={fileErrors.paymentScreenshot}
                  fileInputRef={(element) => {
                    fileInputRefs.current.paymentScreenshot = element;
                  }}
                  onCopy={copyValue}
                  onFileChange={(file) => changeFile('paymentScreenshot', file)}
                  paymentFile={files.paymentScreenshot}
                  paymentPreviewUrl={paymentPreviewUrl}
                  register={register}
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

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <Button
                disabled={currentStep === 0 || isSubmitting}
                onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
                variant="outline"
              >
                <ChevronLeft aria-hidden="true" size={18} /> Back
              </Button>
              {currentStep < 4 ? (
                <Button onClick={() => void nextStep()}>
                  Continue <ChevronRight aria-hidden="true" size={18} />
                </Button>
              ) : (
                <Button disabled={!canSubmit || isSubmitting} type="submit">
                  {isSubmitting ? <LoaderCircle aria-hidden="true" className="animate-spin" size={18} /> : null}
                  Submit application
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

        <aside className="space-y-4" aria-label="Application safety notes">
          <Card className="bg-surface">
            <ShieldAlert aria-hidden="true" className="text-warning" size={25} />
            <h2 className="mt-3 text-lg">Demo workflow only</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Applications are sent directly to the configured administrator by SMTP. Files remain
              in memory and are not written to public or persistent storage.
            </p>
          </Card>
          <Card>
            <h2 className="text-lg">Before you continue</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
              <li>Use test documents only during this demo stage.</li>
              <li>Bank details shown are explicitly fake demonstration values.</li>
              <li>No payment is verified and no placement is guaranteed.</li>
            </ul>
          </Card>
        </aside>
      </div>
    </FormProvider>
  );
}

interface PersonalStepProps {
  errors: FieldErrors<ApplicationFieldsInput>;
  register: ReturnType<typeof useForm<ApplicationFieldsInput>>['register'];
}

function PersonalStep({ errors, register }: PersonalStepProps) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextInput error={errorMessage(errors.firstName)} label="First name" required {...register('firstName')} />
      <TextInput error={errorMessage(errors.lastName)} label="Last name" required {...register('lastName')} />
      <TextInput error={errorMessage(errors.dateOfBirth)} label="Date of birth" required type="date" {...register('dateOfBirth')} />
      <SelectField error={errorMessage(errors.gender)} label="Gender" {...register('gender')}>
        <option value="">Prefer not to say</option>
        <option value="female">Female</option>
        <option value="male">Male</option>
        <option value="other">Other</option>
      </SelectField>
      <TextInput error={errorMessage(errors.nationality)} label="Nationality" required {...register('nationality')} />
      <TextInput
        description="Pakistani applicants must use #####-#######-#."
        error={errorMessage(errors.nationalId)}
        label="National ID / CNIC"
        required
        {...register('nationalId')}
      />
      <TextInput error={errorMessage(errors.passportNumber)} label="Passport number" required {...register('passportNumber')} />
      <TextInput error={errorMessage(errors.passportExpiry)} label="Passport expiry" required type="date" {...register('passportExpiry')} />
      <TextInput autoComplete="email" error={errorMessage(errors.email)} label="Email" required type="email" {...register('email')} />
      <div className="grid grid-cols-[8rem_1fr] gap-3">
        <SelectField label="Phone code" defaultValue="+92" aria-label="Phone country code">
          <option value="+92">PK +92</option>
          <option value="+966">SA +966</option>
          <option value="+971">AE +971</option>
          <option value="+968">OM +968</option>
          <option value="+974">QA +974</option>
          <option value="+965">KW +965</option>
          <option value="+973">BH +973</option>
        </SelectField>
        <TextInput
          autoComplete="tel"
          description="Include the selected code, for example +923001234567."
          error={errorMessage(errors.phone)}
          label="Phone / WhatsApp"
          placeholder="+923001234567"
          required
          type="tel"
          {...register('phone')}
        />
      </div>
      <TextInput error={errorMessage(errors.currentCity)} label="Current city" required {...register('currentCity')} />
      <TextInput error={errorMessage(errors.currentCountry)} label="Current country" required {...register('currentCountry')} />
      <SelectField error={errorMessage(errors.maritalStatus)} label="Marital status" {...register('maritalStatus')}>
        <option value="">Prefer not to say</option>
        <option value="single">Single</option>
        <option value="married">Married</option>
        <option value="other">Other</option>
      </SelectField>
    </div>
  );
}

interface PreferencesStepProps {
  appendLanguage: (value: { language: string; level: (typeof languageLevels)[number] }) => void;
  availableRoles: JobTaxonomy['fields'][number]['roles'];
  control: ReturnType<typeof useForm<ApplicationFieldsInput>>['control'];
  errors: FieldErrors<ApplicationFieldsInput>;
  hasDrivingLicence: boolean;
  languageFields: { id: string }[];
  register: ReturnType<typeof useForm<ApplicationFieldsInput>>['register'];
  removeLanguage: (index: number) => void;
  roleSearch: string;
  selectedField: string;
  selectedRoles: string[];
  setRoleSearch: (value: string) => void;
  setValue: ReturnType<typeof useForm<ApplicationFieldsInput>>['setValue'];
  taxonomy: JobTaxonomy;
}

function PreferencesStep({
  appendLanguage,
  availableRoles,
  control,
  errors,
  hasDrivingLicence,
  languageFields,
  register,
  removeLanguage,
  roleSearch,
  selectedField,
  selectedRoles,
  setRoleSearch,
  setValue,
  taxonomy,
}: PreferencesStepProps) {
  const fieldRegistration = register('field');
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
                <label className="flex min-h-11 items-center gap-3 rounded-xl border px-4 py-2" key={country}>
                  <input
                    checked={field.value?.includes(country) ?? false}
                    className={checkboxClasses()}
                    disabled={field.value?.includes('all-gulf')}
                    onChange={(event) => {
                      const withoutAll = (field.value ?? []).filter((value) => value !== 'all-gulf');
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
        {errorMessage(errors.countries) ? <p className="mt-2 text-sm font-semibold text-error">{errorMessage(errors.countries)}</p> : null}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          error={errorMessage(errors.field)}
          label="Job field"
          required
          {...fieldRegistration}
          onChange={(event) => {
            fieldRegistration.onChange(event);
            setValue('roles', [], { shouldDirty: true, shouldValidate: true });
            setValue('otherRole', '', { shouldDirty: true, shouldValidate: true });
            setRoleSearch('');
          }}
        >
          <option value="">Select a field</option>
          {taxonomy.fields.map((field) => (
            <option key={field.id} value={field.id}>{field.label}</option>
          ))}
        </SelectField>
        <TextInput error={errorMessage(errors.yearsExperience)} label="Years of experience" min="0" required step="0.5" type="number" {...register('yearsExperience')} />
      </div>

      <fieldset>
        <legend className="text-sm font-bold text-primary">Preferred roles *</legend>
        <TextInput
          className="mt-3"
          disabled={!selectedField}
          label="Search roles"
          onChange={(event) => setRoleSearch(event.target.value)}
          placeholder="Choose a field, then search"
          value={roleSearch}
        />
        <Controller
          control={control}
          name="roles"
          render={({ field }) => (
            <div className="mt-3 flex flex-wrap gap-2">
              {availableRoles.map((role) => {
                const selected = field.value?.includes(role.id) ?? false;
                return (
                  <label className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold ${selected ? 'border-primary bg-primary text-white' : 'bg-bg text-primary'}`} key={role.id}>
                    <input
                      checked={selected}
                      className="sr-only"
                      onChange={(event) => field.onChange(event.target.checked ? [...(field.value ?? []), role.id] : (field.value ?? []).filter((id) => id !== role.id))}
                      type="checkbox"
                    />
                    {role.label}
                  </label>
                );
              })}
            </div>
          )}
        />
        {errorMessage(errors.roles) ? <p className="mt-2 text-sm font-semibold text-error">{errorMessage(errors.roles)}</p> : null}
      </fieldset>

      {selectedRoles.includes('other') ? (
        <TextInput error={errorMessage(errors.otherRole)} label="Describe the other role" required {...register('otherRole')} />
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput error={errorMessage(errors.highestEducation)} label="Highest education" required {...register('highestEducation')} />
        <TextInput error={errorMessage(errors.lastJobTitle)} label="Last job title" {...register('lastJobTitle')} />
        <TextInput error={errorMessage(errors.expectedSalaryMin)} label="Expected salary minimum" min="0" type="number" {...register('expectedSalaryMin')} />
        <TextInput error={errorMessage(errors.expectedSalaryMax)} label="Expected salary maximum" min="0" type="number" {...register('expectedSalaryMax')} />
        <SelectField error={errorMessage(errors.salaryCurrency)} label="Salary currency" {...register('salaryCurrency')}>
          <option value="">Select currency</option>
          {supportedCurrencies.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
        </SelectField>
        <TextInput error={errorMessage(errors.preferredJoiningDate)} label="Preferred joining date" type="date" {...register('preferredJoiningDate')} />
      </div>

      <fieldset>
        <legend className="text-sm font-bold text-primary">Languages</legend>
        <div className="mt-3 space-y-3">
          {languageFields.map((language, index) => (
            <div className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_1fr_auto]" key={language.id}>
              <TextInput error={errorMessage(errors.languages?.[index]?.language)} label={`Language ${index + 1}`} required {...register(`languages.${index}.language`)} />
              <SelectField error={errorMessage(errors.languages?.[index]?.level)} label="Level" required {...register(`languages.${index}.level`)}>
                {languageLevels.map((level) => <option key={level} value={level}>{level}</option>)}
              </SelectField>
              <Button className="self-end" onClick={() => removeLanguage(index)} variant="ghost">Remove</Button>
            </div>
          ))}
          <Button onClick={() => appendLanguage({ language: '', level: 'basic' })} variant="outline">Add language</Button>
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex min-h-11 items-center gap-3 rounded-xl border px-4 py-3 font-semibold text-primary">
          <input className={checkboxClasses()} type="checkbox" {...register('hasDrivingLicence')} />
          I have a driving licence
        </label>
        {hasDrivingLicence ? <TextInput error={errorMessage(errors.licenceCountry)} label="Licence issuing country" required {...register('licenceCountry')} /> : null}
        <label className="flex min-h-11 items-center gap-3 rounded-xl border px-4 py-3 font-semibold text-primary">
          <input className={checkboxClasses()} type="checkbox" {...register('willingToRelocate')} />
          Willing to relocate
        </label>
      </div>

      <Controller
        control={control}
        name="skills"
        render={({ field }) => (
          <TextInput
            description="Separate up to 30 skills with commas."
            error={errorMessage(errors.skills)}
            label="Skills"
            onChange={(event) => field.onChange(event.target.value.split(',').map((skill) => skill.trim()).filter(Boolean))}
            value={(field.value ?? []).join(', ')}
          />
        )}
      />
      <TextareaField error={errorMessage(errors.notes)} label="Additional notes" maxLength={2000} {...register('notes')} />
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
      <p className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-warning">
        Use test files only. Files remain in browser memory and are not uploaded or stored in M6.
      </p>
      <FileField accept=".pdf,.doc,.docx" description="PDF, DOC or DOCX; maximum 5 MiB." error={errors.cv} file={files.cv} inputRef={(element) => setInputRef('cv', element)} label="CV" onChange={(file) => onChange('cv', file)} required />
      <FileField accept=".jpg,.jpeg,.png,.pdf" description="Optional JPG, PNG or PDF; maximum 5 MiB." error={errors.passportCopy} file={files.passportCopy} inputRef={(element) => setInputRef('passportCopy', element)} label="Passport copy" onChange={(file) => onChange('passportCopy', file)} />
      <FileField accept=".jpg,.jpeg,.png,.pdf" description="Optional JPG, PNG or PDF; maximum 5 MiB." error={errors.photo} file={files.photo} inputRef={(element) => setInputRef('photo', element)} label="Photo" onChange={(file) => onChange('photo', file)} />
    </div>
  );
}

interface PaymentStepProps {
  config: PublicConfigResponse;
  copyStatus: string;
  errors: FieldErrors<ApplicationFieldsInput>;
  fileError?: string | undefined;
  fileInputRef: (element: HTMLInputElement | null) => void;
  onCopy: (label: string, value: string) => void;
  onFileChange: (file?: File) => void;
  paymentFile?: File | undefined;
  paymentPreviewUrl: string;
  register: ReturnType<typeof useForm<ApplicationFieldsInput>>['register'];
}

function PaymentStep({ config, copyStatus, errors, fileError, fileInputRef, onCopy, onFileChange, paymentFile, paymentPreviewUrl, register }: PaymentStepProps) {
  const paymentDetails = [
    ['Bank', config.bankName],
    ['Account title', config.bankAccountTitle],
    ['Account number', config.bankAccountNumber],
    ['IBAN', config.bankIban],
  ] as const;
  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-warning bg-amber-50 p-5">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-warning">Fake / demo bank details — do not pay</p>
        <p className="mt-2 text-sm leading-6 text-muted">Displayed only to validate the form experience. Payment collection is not launched.</p>
        <dl className="mt-4 space-y-3">
          {paymentDetails.map(([label, value]) => (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-bg p-3" key={label}>
              <div><dt className="text-xs font-bold uppercase text-muted">{label}</dt><dd className="font-semibold text-primary">{value}</dd></div>
              <Button aria-label={`Copy ${label}`} onClick={() => void onCopy(label, value)} variant="ghost"><Copy aria-hidden="true" size={16} /> Copy</Button>
            </div>
          ))}
        </dl>
        <p className="mt-4 font-bold text-primary">Demo fee: {config.serviceFeeCurrency} {config.serviceFeeAmount.toLocaleString()}</p>
        <p aria-live="polite" className="mt-2 min-h-5 text-sm font-semibold text-brand-green">{copyStatus}</p>
      </div>

      <FileField accept=".jpg,.jpeg,.png" description="Required JPEG or PNG; maximum 5 MiB. The secure server validates its file signature again." error={fileError} file={paymentFile} inputRef={fileInputRef} label="Payment screenshot" onChange={onFileChange} required />
      {paymentPreviewUrl ? <img alt="Payment screenshot preview" className="max-h-72 rounded-xl border object-contain" src={paymentPreviewUrl} /> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextInput error={errorMessage(errors.transactionReference)} label="Transaction reference" required {...register('transactionReference')} />
        <TextInput error={errorMessage(errors.paymentDate)} label="Payment date" max={new Date().toISOString().slice(0, 10)} required type="date" {...register('paymentDate')} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-bold text-primary">Required confirmations</legend>
        <ConsentField error={errorMessage(errors.acceptTerms)} label="I accept the terms and conditions." registration={register('acceptTerms')} />
        <ConsentField error={errorMessage(errors.confirmAccuracy)} label="I confirm the information is complete and accurate." registration={register('confirmAccuracy')} />
        <ConsentField error={errorMessage(errors.acceptFeePolicy)} label="I accept the fee and refund policy and understand this demo does not verify payment." registration={register('acceptFeePolicy')} />
      </fieldset>
    </div>
  );
}

function ConsentField({ error, label, registration }: { error?: string | undefined; label: string; registration: ReturnType<ReturnType<typeof useForm<ApplicationFieldsInput>>['register']> }) {
  return (
    <div>
      <label className="flex min-h-11 items-start gap-3 rounded-xl border p-4 font-semibold text-primary">
        <input aria-invalid={error ? true : undefined} className={`${checkboxClasses()} mt-0.5 shrink-0`} type="checkbox" {...registration} />
        {label}
      </label>
      {error ? <p className="mt-1 text-sm font-semibold text-error">{error}</p> : null}
    </div>
  );
}

function SetupUnavailable({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border bg-surface p-5" role={error ? 'alert' : 'status'}>
      <p className="font-semibold text-primary">{error || 'Loading validated application options…'}</p>
      {error ? <Button className="mt-4" onClick={onRetry} variant="outline">Retry setup</Button> : null}
    </div>
  );
}

function ReviewStep({ files, onEdit, taxonomy, values }: { files: ApplicationFiles; onEdit: (step: number) => void; taxonomy?: JobTaxonomy | undefined; values: Record<string, unknown> }) {
  const textValue = (key: string) => (typeof values[key] === 'string' ? values[key] : '');
  const selectedRoles = Array.isArray(values.roles)
    ? values.roles.filter((value): value is string => typeof value === 'string')
    : [];
  const selectedCountries = Array.isArray(values.countries)
    ? values.countries.filter((value): value is string => typeof value === 'string')
    : [];
  const field = taxonomy?.fields.find((item) => item.id === textValue('field'));
  const roles = field?.roles.filter((role) => selectedRoles.includes(role.id)).map((role) => role.label).join(', ');
  const countries = selectedCountries.includes('all-gulf')
    ? 'All Gulf countries'
    : selectedCountries
        .filter((country): country is (typeof gulfCountries)[number] => country in countryLabels)
        .map((country) => countryLabels[country])
        .join(', ');
  const sections: { title: string; step: number; items: [string, string | undefined][] }[] = [
    { title: 'Personal', step: 0, items: [['Name', `${textValue('firstName')} ${textValue('lastName')}`.trim()], ['Date of birth', textValue('dateOfBirth')], ['Nationality', textValue('nationality')], ['National ID', maskIdentifier(values.nationalId)], ['Passport', maskIdentifier(values.passportNumber)], ['Passport expiry', textValue('passportExpiry')], ['Email', textValue('email')], ['Phone', textValue('phone')], ['Location', `${textValue('currentCity')}, ${textValue('currentCountry')}`]] },
    { title: 'Preferences', step: 1, items: [['Countries', countries], ['Field', field?.label], ['Roles', roles], ['Other role', textValue('otherRole')], ['Experience', `${textValue('yearsExperience')} years`], ['Education', textValue('highestEducation')], ['Last job', textValue('lastJobTitle')], ['Salary', textValue('salaryCurrency') ? `${textValue('salaryCurrency')} ${textValue('expectedSalaryMin') || '—'}–${textValue('expectedSalaryMax') || '—'}` : undefined], ['Joining date', textValue('preferredJoiningDate')], ['Relocation', values.willingToRelocate ? 'Yes' : 'No']] },
    { title: 'Documents', step: 2, items: [['CV', files.cv?.name], ['Passport copy', files.passportCopy?.name ?? 'Not provided'], ['Photo', files.photo?.name ?? 'Not provided']] },
    { title: 'Payment evidence', step: 3, items: [['Screenshot', files.paymentScreenshot?.name], ['Transaction reference', textValue('transactionReference')], ['Payment date', textValue('paymentDate')], ['Status', 'Unverified demo evidence']] },
  ];
  return (
    <div className="space-y-5">
      <p className="rounded-xl bg-surface p-4 text-sm leading-6 text-muted">Review the sanitized summary. Sensitive identifiers are masked and nothing has been submitted.</p>
      {sections.map((section) => (
        <section className="rounded-xl border p-5" key={section.title}>
          <div className="flex items-center justify-between gap-3"><h3 className="text-lg">{section.title}</h3><Button onClick={() => onEdit(section.step)} variant="ghost">Edit</Button></div>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            {section.items.filter(([, value]) => value !== undefined && value !== '').map(([label, value]) => (
              <div key={label}><dt className="text-xs font-bold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 break-words font-semibold text-text">{String(value)}</dd></div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
