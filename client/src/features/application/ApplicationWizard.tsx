import { zodResolver } from '@hookform/resolvers/zod';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  X,
  FileCheck2,
  FilePlus2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch, type FieldPath } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  applicationFieldsSchema,
  applicationOccupations,
  gulfCountries,
  occupationsForField,
  type ApplicationFields,
  type ApplicationFieldsInput,
  type CvVerificationResponse,
} from '@rozgar-links/shared';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ButtonLink } from '../../components/ui/ButtonLink';
import { TextInput } from '../../components/ui/TextInput';
import { useLanguage } from '../../i18n/useLanguage';
import { fetchApplicationSetup, submitApplication, verifyCv } from './api';
import { SelectField } from './FormControls';
import { formatPakistaniMobile } from './inputFormatting';
import { getJobPrefill } from './jobPrefill';
import {
  validateApplicationFile,
  validateApplicationFiles,
  type ApplicationFiles,
  type ApplicationFileKey,
} from './fileValidation';
import { FileField, PaymentStep } from './WizardControls';
import {
  BrowserAlreadySubmittedError,
  browserSubmissionKey,
  hasBrowserSubmitted,
  submitOncePerBrowser,
} from './browserSubmission';

const steps = ['Personal', 'Preferences', 'CV Status', 'Payment', 'Review'] as const;
const countryLabels: Record<string, string> = {
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
  'gender',
  'email',
  'phone',
  'field',
];
const preferenceFields: FieldPath<ApplicationFieldsInput>[] = ['countries', 'selectedJobIds'];

export function ApplicationWizard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [alreadySubmitted, setAlreadySubmitted] = useState(hasBrowserSubmitted);
  const requestedCountry = gulfCountries.find(
    (id) => params.get('country') === id || params.get('country') === countryLabels[id],
  );
  const methods = useForm<ApplicationFieldsInput, unknown, ApplicationFields>({
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: '',
      email: '',
      phone: '',
      field: '',
      countries: requestedCountry ? [requestedCountry] : [],
      selectedJobIds: [],
    },
    resolver: zodResolver(applicationFieldsSchema),
    mode: 'onChange',
    shouldUnregister: false,
  });
  const {
    register,
    control,
    setValue,
    trigger,
    getFieldState,
    handleSubmit,
    formState: { errors },
  } = methods;
  const values = useWatch({ control });
  const field = values.field ?? '';
  const countries = values.countries ?? [];
  const selected = values.selectedJobIds ?? [];
  const preselectedJob =
    selected.length === 1 && selected[0] === params.get('job')
      ? applicationOccupations.find((job) => job.id === selected[0])
      : undefined;
  const returning = values.cvPathType === 'existing_rozgar_cv';
  const [setup, setSetup] = useState<Awaited<ReturnType<typeof fetchApplicationSetup>>>();
  const [setupError, setSetupError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<ApplicationFiles>({});
  const [fileErrors, setFileErrors] = useState<Partial<Record<ApplicationFileKey, string>>>({});
  const [verification, setVerification] = useState<CvVerificationResponse>();
  const [checking, setChecking] = useState(false);
  const [search, setSearch] = useState('');
  const [selectionNotice, setSelectionNotice] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [website, setWebsite] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [preview, setPreview] = useState('');
  const previewRef = useRef('');
  const heading = useRef<HTMLHeadingElement>(null);
  const verificationRequest = useRef<AbortController | null>(null);
  const submissionLock = useRef(false);
  const prefilled = useRef(false);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const journeyInput = useRef<HTMLInputElement>(null);
  const countryInput = useRef<HTMLInputElement>(null);
  const occupationSearch = useRef<HTMLInputElement>(null);
  const activeSteps = returning ? [0, 1, 2, 4] : [0, 1, 2, 3, 4];
  const activeIndex = activeSteps.indexOf(step);
  const enabled = setup?.config.applicationSubmissionEnabled ?? false;
  const available = occupationsForField(field);
  const label = (job: { titleEn: string; titleUr: string }) =>
    language === 'ur' ? job.titleUr : job.titleEn;

  useEffect(() => {
    if (alreadySubmitted) return;
    const controller = new AbortController();
    void fetchApplicationSetup(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setSetup(result);
        setSetupError(false);
        if (!prefilled.current) {
          prefilled.current = true;
          const prefill = getJobPrefill(params, result.taxonomy);
          setValue('field', prefill.field);
          setValue('selectedJobIds', prefill.selectedJobIds);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setSetupError(true);
      });
    return () => controller.abort();
  }, [alreadySubmitted, attempt, params, setValue]);
  useEffect(() => {
    const sync = () => setAlreadySubmitted(hasBrowserSubmitted());
    const onStorage = (event: StorageEvent) => {
      if (event.key === browserSubmissionKey || event.key === null) sync();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', sync);
    window.addEventListener('pageshow', sync);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', sync);
      window.removeEventListener('pageshow', sync);
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [step]);
  useEffect(
    () => () => {
      verificationRequest.current?.abort();
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  function resetVerification() {
    verificationRequest.current?.abort();
    verificationRequest.current = null;
    setVerification(undefined);
    setChecking(false);
  }
  function switchJourney(value: ApplicationFields['cvPathType']) {
    if (values.cvPathType === value) return;
    resetVerification();
    setFiles({});
    setFileErrors({});
    setSubmissionError('');
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = '';
    setPreview('');
    setValue('cvPathType', value, { shouldValidate: true });
  }
  async function changeFile(key: ApplicationFileKey, file?: File) {
    setSubmissionError('');
    setFiles((current) => ({ ...current, [key]: file }));
    let error = validateApplicationFile(key, file);
    if (key === 'cv' && file && (file.type !== 'application/pdf' || !/\.pdf$/i.test(file.name)))
      error = 'Upload your official CV as a PDF.';
    setFileErrors((current) => ({ ...current, [key]: error }));
    if (key === 'paymentScreenshot') {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
      previewRef.current =
        file && !error && typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(file)
          : '';
      setPreview(previewRef.current);
      return;
    }
    resetVerification();
    if (!file || error) return;
    const controller = new AbortController();
    verificationRequest.current = controller;
    setChecking(true);
    try {
      const result = await verifyCv(file, controller.signal);
      if (!controller.signal.aborted) setVerification(result);
    } catch {
      if (!controller.signal.aborted)
        setVerification({
          valid: false,
          message: 'CV verification could not be completed. Please retry.',
        });
    } finally {
      if (!controller.signal.aborted) setChecking(false);
    }
  }
  function changeField(next: string) {
    setValue('field', next, { shouldValidate: true });
    const allowed = new Set(occupationsForField(next).map((job) => job.id));
    const reconciled = selected.filter((id) => allowed.has(id));
    if (reconciled.length !== selected.length) {
      setValue('selectedJobIds', reconciled, { shouldValidate: true });
      setSelectionNotice(true);
    }
    setSearch('');
  }
  async function next() {
    setShowErrors(true);
    setSubmissionError('');
    const fields: FieldPath<ApplicationFieldsInput>[] =
      step === 0 ? personalFields : step === 1 ? preferenceFields : ['cvPathType'];
    await trigger(fields, { shouldFocus: true });
    if (fields.some((name) => getFieldState(name).invalid)) {
      if (step === 1) {
        if (getFieldState('countries').invalid) countryInput.current?.focus();
        else occupationSearch.current?.focus();
      }
      if (step === 2) journeyInput.current?.focus();
      return;
    }
    if (!setup) return;
    if (step === 2 && returning && (!verification?.valid || !files.cv || checking)) {
      setFileErrors({ cv: 'A verified official PDF CV is required.' });
      fileInput.current?.focus();
      return;
    }
    if (step === 3) {
      const error = validateApplicationFile('paymentScreenshot', files.paymentScreenshot);
      if (error) {
        setFileErrors({ paymentScreenshot: error });
        fileInput.current?.focus();
        return;
      }
    }
    setShowErrors(false);
    setStep(step === 2 && returning ? 4 : step + 1);
  }
  async function onSubmit(application: ApplicationFields) {
    if (submissionLock.current || !enabled) return;
    const uploadErrors = validateApplicationFiles(files, application.cvPathType);
    if (Object.keys(uploadErrors).length || (returning && !verification?.valid)) {
      setFileErrors(uploadErrors);
      setSubmissionError('Please check your required uploads.');
      return;
    }
    submissionLock.current = true;
    setIsSubmitting(true);
    setSubmissionError('');
    try {
      const result = await submitOncePerBrowser(() =>
        submitApplication(application, files, website),
      );
      navigate('/success', { replace: true, state: result });
    } catch (error) {
      if (error instanceof BrowserAlreadySubmittedError) {
        setAlreadySubmitted(true);
        return;
      }
      setSubmissionError(
        error instanceof Error
          ? error.message
          : 'The application could not be submitted. Please try again.',
      );
    } finally {
      submissionLock.current = false;
      setIsSubmitting(false);
    }
  }
  const errorMessages = Object.values(errors)
    .map((error) => error?.message)
    .filter((message): message is string => typeof message === 'string');
  const canSubmit =
    step === 4 &&
    enabled &&
    applicationFieldsSchema.safeParse(values).success &&
    Object.keys(validateApplicationFiles(files, values.cvPathType)).length === 0 &&
    (!returning || verification?.valid === true) &&
    !checking;
  const phoneRegistration = register('phone');
  const fee = `${setup?.config.serviceFeeCurrency ?? 'PKR'} ${setup?.config.serviceFeeAmount ?? 250}`;
  const gender = typeof values.gender === 'string' ? values.gender : '';
  const reviewSections = [
    {
      title: 'Personal',
      index: 0,
      rows: [
        ['Name', `${values.firstName ?? ''} ${values.lastName ?? ''}`],
        ['Gender', gender ? t(gender.charAt(0).toUpperCase() + gender.slice(1)) : ''],
        ['Email', values.email],
        ['WhatsApp number', values.phone],
        ['Job field', t(setup?.taxonomy.fields.find((item) => item.id === field)?.label ?? '')],
      ],
    },
    {
      title: 'Preferences',
      index: 1,
      rows: [
        [
          'Countries',
          countries.includes('all-gulf')
            ? t('All Gulf countries')
            : countries.map((id) => t(countryLabels[id] ?? id)).join(', '),
        ],
        [
          'Jobs to apply for',
          selected
            .map((id) => applicationOccupations.find((job) => job.id === id))
            .filter((job) => job !== undefined)
            .map(label)
            .join(', '),
        ],
      ],
    },
    {
      title: 'CV Status',
      index: 2,
      rows: [
        [
          'Status',
          t(returning ? 'Official Rozgar Links CV: Verified' : 'CV preparation requested'),
        ],
        ['CV reference ID', verification?.valid ? verification.cvReference : ''],
        ['CV', files.cv?.name],
        ['CV preparation fee', returning ? 'PKR 0' : fee],
        ['Payment screenshot', returning ? t('Not required') : files.paymentScreenshot?.name],
        [
          'Payment verification',
          returning ? t('Not required') : t('Attached, awaiting manual verification'),
        ],
      ],
    },
  ];

  if (alreadySubmitted)
    return (
      <Card className="mx-auto max-w-2xl p-6 text-center sm:p-8">
        <Check aria-hidden="true" size={40} className="mx-auto text-brand-green" />
        <h2 className="mt-4 text-2xl">{t('Application already submitted')}</h2>
        <p className="mt-4 leading-7 text-muted">
          {t(
            'An application has already been submitted from this browser. You can submit only once from this browser. Our team will contact you about the next steps.',
          )}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink to="/contact">{t('Contact information')}</ButtonLink>
          <ButtonLink to="/" variant="outline">
            {t('Home')}
          </ButtonLink>
        </div>
      </Card>
    );

  return (
    <FormProvider {...methods}>
      <form
        className="mx-auto max-w-4xl"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (step === 4) void handleSubmit(onSubmit, () => setShowErrors(true))(event);
        }}
      >
        <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="application-website">Website</label>
          <input
            id="application-website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
          />
        </div>
        {setup && !enabled && (
          <p
            id="demo-submission-notice"
            role="status"
            className="mb-5 rounded-xl border border-warning bg-surface p-4 text-sm"
          >
            {t('Demo only:')} {t('nothing is submitted. Use test details and files.')}
          </p>
        )}
        <nav aria-label={t('Application progress')} className="mb-5 overflow-x-auto">
          <ol className="flex min-w-max gap-2">
            {activeSteps.map((index, position) => (
              <li key={index}>
                <Button
                  variant={index === step ? 'primary' : 'outline'}
                  disabled={index > step || isSubmitting}
                  aria-current={index === step ? 'step' : undefined}
                  onClick={() => {
                    setShowErrors(false);
                    setStep(index);
                  }}
                >
                  {index < step ? <Check aria-hidden="true" size={16} /> : position + 1}{' '}
                  {t(steps[index] ?? '')}
                </Button>
              </li>
            ))}
          </ol>
        </nav>
        <Card className="p-5 sm:p-8">
          <div
            role="progressbar"
            aria-label={t('Application progress')}
            aria-valuemin={1}
            aria-valuemax={activeSteps.length}
            aria-valuenow={activeIndex + 1}
            className="mb-5 h-2 overflow-hidden rounded-full bg-surface"
          >
            <div
              className="h-full bg-brand-green transition-[width]"
              style={{ width: `${((activeIndex + 1) / activeSteps.length) * 100}%` }}
            />
          </div>
          <p className="text-sm font-bold text-brand-green">
            {t('Step {current} of {total}', {
              current: activeIndex + 1,
              total: activeSteps.length,
            })}
          </p>
          <h2 className="mt-2 text-2xl" tabIndex={-1} ref={heading}>
            {t(steps[step] ?? '')}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {t('Required fields are marked with an asterisk.')}
          </p>
          {showErrors && errorMessages.length > 0 && (
            <div role="alert" className="mt-4 rounded-xl border border-error p-4 text-error">
              <p>{t('Please fix the following:')}</p>
              <ul className="list-inside list-disc">
                {errorMessages.map((message) => (
                  <li key={message}>{t(message)}</li>
                ))}
              </ul>
            </div>
          )}
          {!setup && (
            <div className="mt-4 rounded-xl bg-surface p-4" role={setupError ? 'alert' : 'status'}>
              {t(
                setupError
                  ? 'Application setup could not be loaded. Please retry.'
                  : 'Loading validated application options…',
              )}
              {setupError && (
                <Button onClick={() => setAttempt((value) => value + 1)}>{t('Retry setup')}</Button>
              )}
            </div>
          )}
          <fieldset disabled={isSubmitting} className="mt-6 min-w-0">
            {step === 0 && (
              <div className="grid gap-5 sm:grid-cols-2">
                <TextInput
                  label={t('First name')}
                  required
                  maxLength={100}
                  autoComplete="given-name"
                  error={errors.firstName?.message}
                  {...register('firstName')}
                />
                <TextInput
                  label={t('Last name')}
                  required
                  maxLength={100}
                  autoComplete="family-name"
                  error={errors.lastName?.message}
                  {...register('lastName')}
                />
                <SelectField
                  label={t('Gender')}
                  error={errors.gender?.message}
                  {...register('gender')}
                >
                  <option value="">{t('Prefer not to say')}</option>
                  <option value="female">{t('Female')}</option>
                  <option value="male">{t('Male')}</option>
                  <option value="other">{t('Other')}</option>
                </SelectField>
                <TextInput
                  label={t('Email address')}
                  type="email"
                  required
                  maxLength={254}
                  dir="ltr"
                  autoComplete="email"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <TextInput
                  {...phoneRegistration}
                  label={t('WhatsApp number')}
                  type="tel"
                  inputMode="numeric"
                  required
                  dir="ltr"
                  autoComplete="tel"
                  maxLength={11}
                  pattern="03[0-9]{9}"
                  description={t('11 digits, starting with 03.')}
                  error={errors.phone?.message}
                  onChange={(event) => {
                    event.target.value = formatPakistaniMobile(event.target.value);
                    void phoneRegistration.onChange(event);
                  }}
                />
                <SelectField
                  {...register('field')}
                  value={field}
                  label={t('Job field')}
                  required
                  disabled={!setup}
                  error={errors.field?.message}
                  onChange={(event) => changeField(event.target.value)}
                >
                  <option value="">{t('Select a field')}</option>
                  {setup?.taxonomy.fields.map((item) => (
                    <option key={item.id} value={item.id}>
                      {t(item.label)}
                    </option>
                  ))}
                </SelectField>
                {preselectedJob && (
                  <p className="rounded-xl border border-brand-green/20 bg-surface p-4 text-sm leading-6 text-primary sm:col-span-2">
                    {t('Preselected occupation: {job}. You can change it in step 2.', {
                      job: label(preselectedJob),
                    })}
                  </p>
                )}
              </div>
            )}
            {step === 1 && (
              <div className="space-y-7">
                <fieldset>
                  <legend className="font-bold text-primary">
                    {t('Preferred Gulf countries')} *
                  </legend>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {(['all-gulf', ...gulfCountries] as const).map((country) => (
                      <label
                        key={country}
                        className="flex min-h-12 items-center gap-3 rounded-xl border p-3"
                      >
                        <input
                          type="checkbox"
                          ref={country === 'all-gulf' ? countryInput : undefined}
                          className="size-5"
                          checked={countries.includes(country)}
                          disabled={country !== 'all-gulf' && countries.includes('all-gulf')}
                          onChange={(event) =>
                            setValue(
                              'countries',
                              country === 'all-gulf'
                                ? event.target.checked
                                  ? ['all-gulf']
                                  : []
                                : event.target.checked
                                  ? [...countries, country]
                                  : countries.filter((id) => id !== country),
                              { shouldValidate: true },
                            )
                          }
                        />
                        {t(
                          country === 'all-gulf'
                            ? 'All Gulf countries'
                            : (countryLabels[country] ?? country),
                        )}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <section aria-labelledby="jobs-to-apply">
                  <h3 id="jobs-to-apply" className="text-lg">
                    {t('Jobs to apply for')} *
                  </h3>
                  <p className="mt-3 rounded-xl bg-surface p-4 text-sm leading-6 text-primary">
                    {t('You selected {field} in step 1. These occupations match your job field.', {
                      field: t(
                        setup?.taxonomy.fields.find((item) => item.id === field)?.label ?? '',
                      ),
                    })}
                  </p>
                  {selectionNotice && (
                    <p role="status" className="mt-2 text-sm text-muted">
                      {t('Some selected jobs were removed because your job field changed.')}
                    </p>
                  )}
                  <p aria-live="polite" className="my-3 text-sm font-bold text-brand-green">
                    {t('{count} of 3 jobs selected', { count: selected.length })}
                  </p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {selected.map((id) => {
                      const job = applicationOccupations.find((item) => item.id === id);
                      return (
                        job && (
                          <button
                            type="button"
                            key={id}
                            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold text-primary"
                            aria-label={t('Remove {job}', { job: label(job) })}
                            onClick={() =>
                              setValue(
                                'selectedJobIds',
                                selected.filter((value) => value !== id),
                                { shouldValidate: true },
                              )
                            }
                          >
                            {label(job)}
                            <X aria-hidden="true" size={16} />
                          </button>
                        )
                      );
                    })}
                  </div>
                  <TextInput
                    label={t('Search occupations')}
                    ref={occupationSearch}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    type="search"
                  />
                  {!available.length && (
                    <p role="status" className="mt-4 rounded-xl bg-surface p-4 text-sm">
                      {t(
                        'No matching occupations are currently listed for this field. Choose another relevant field or contact us for guidance.',
                      )}
                    </p>
                  )}
                  <div className="mt-4 max-h-80 space-y-2 overflow-y-auto rounded-xl border p-3">
                    {available
                      .filter((job) =>
                        `${job.titleEn} ${job.titleUr}`
                          .toLocaleLowerCase()
                          .includes(search.trim().toLocaleLowerCase()),
                      )
                      .map((job) => (
                        <label
                          key={job.id}
                          className="flex min-h-12 items-center gap-3 rounded-lg bg-surface p-3 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="size-5 shrink-0"
                            checked={selected.includes(job.id)}
                            disabled={!selected.includes(job.id) && selected.length >= 3}
                            onChange={(event) =>
                              setValue(
                                'selectedJobIds',
                                event.target.checked
                                  ? [...selected, job.id]
                                  : selected.filter((id) => id !== job.id),
                                { shouldValidate: true },
                              )
                            }
                          />
                          {label(job)}
                        </label>
                      ))}
                  </div>
                </section>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-5">
                <fieldset>
                  <legend className="text-xl font-bold text-primary">
                    {t('Do you already have a Rozgar Links CV?')}
                  </legend>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {(['existing_rozgar_cv', 'new_cv_required'] as const).map((path, index) => {
                      const Icon = index === 0 ? FileCheck2 : FilePlus2;
                      return (
                        <label
                          key={path}
                          className={`cursor-pointer rounded-2xl border-2 p-5 ${values.cvPathType === path ? 'border-brand-blue bg-surface' : 'border-border'}`}
                        >
                          <input
                            ref={index === 0 ? journeyInput : undefined}
                            type="radio"
                            name="cv-journey"
                            checked={values.cvPathType === path}
                            onChange={() => switchJourney(path)}
                            className="me-3 size-5"
                          />
                          <Icon className="my-3 text-brand-green" aria-hidden="true" size={28} />
                          <span className="block font-bold text-primary">
                            {t(
                              index === 0
                                ? 'Yes, I already have a Rozgar Links CV'
                                : 'No, I need a new CV',
                            )}
                          </span>
                          <span className="mt-2 block text-sm leading-6 text-muted">
                            {index === 0
                              ? t(
                                  'I already have a CV prepared by Rozgar Links and want to use it to apply for more opportunities.',
                                )
                              : t(
                                  'Our team can prepare your CV for a one-time fee of {fee}, after submission and manual payment verification.',
                                  { fee },
                                )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                {returning && (
                  <>
                    <p className="text-sm leading-6 text-muted">
                      {t(
                        'Your CV is sent to the server for temporary verification, even in demo mode. Use test files only during this demonstration.',
                      )}
                    </p>
                    <FileField
                      accept=".pdf"
                      label="Official Rozgar Links CV"
                      description="PDF only; maximum 5 MiB. Upload the original issued file without editing or re-saving it."
                      file={files.cv}
                      error={fileErrors.cv}
                      required
                      inputRef={(element) => {
                        fileInput.current = element;
                      }}
                      onChange={(file) => void changeFile('cv', file)}
                    />
                    <div
                      role="status"
                      aria-live="polite"
                      className="rounded-xl bg-surface p-4 text-sm"
                    >
                      {checking ? (
                        <span className="flex items-center gap-2">
                          <LoaderCircle aria-hidden="true" size={18} className="animate-spin" />
                          {t('Checking your official CV…')}
                        </span>
                      ) : verification?.valid ? (
                        <>
                          <p className="font-bold text-brand-green">
                            {t(
                              'Your Rozgar Links CV has been verified. You can submit your application without paying the CV preparation fee again.',
                            )}
                          </p>
                          <p className="mt-2" dir="ltr">
                            {verification.cvReference}
                          </p>
                        </>
                      ) : verification ? (
                        <p className="text-error">{t(verification.message)}</p>
                      ) : (
                        t('Upload your official PDF CV to verify it.')
                      )}
                    </div>
                    {files.cv && !checking && !verification?.valid && (
                      <Button variant="outline" onClick={() => void changeFile('cv', files.cv)}>
                        {t('Retry verification')}
                      </Button>
                    )}
                  </>
                )}
                {values.cvPathType === 'new_cv_required' && (
                  <p className="rounded-xl bg-surface p-4 text-sm leading-7">
                    {t(
                      'No existing CV upload is needed. Our team will prepare your CV after manual payment review. This fee does not guarantee a job, interview, visa or placement.',
                    )}
                  </p>
                )}
              </div>
            )}
            {step === 3 && !returning && setup && (
              <PaymentStep
                config={setup.config}
                copyStatus={copyStatus}
                fileError={fileErrors.paymentScreenshot}
                fileInputRef={(element) => {
                  fileInput.current = element;
                }}
                onCopy={(name, value) => {
                  void navigator.clipboard
                    .writeText(value)
                    .then(() => setCopyStatus(t('{label} copied.', { label: t(name) })))
                    .catch(() => setCopyStatus(t('Could not copy {label}.', { label: t(name) })));
                }}
                onFileChange={(file) => void changeFile('paymentScreenshot', file)}
                paymentFile={files.paymentScreenshot}
                paymentPreviewUrl={preview}
              />
            )}
            {step === 4 && (
              <div className="space-y-4">
                {reviewSections.map((section) => (
                  <section key={section.title} className="rounded-xl border p-5">
                    <div className="flex items-center justify-between">
                      <h3>{t(section.title)}</h3>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowErrors(false);
                          setStep(section.index);
                        }}
                      >
                        {t('Edit')}
                      </Button>
                    </div>
                    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                      {section.rows
                        .filter(([, value]) => value)
                        .map(([name, value]) => (
                          <div key={name}>
                            <dt className="text-xs font-bold text-muted">{t(name ?? '')}</dt>
                            <dd className="mt-1 break-words text-sm font-semibold">{value}</dd>
                          </div>
                        ))}
                    </dl>
                  </section>
                ))}
                {!returning && (
                  <Button variant="outline" onClick={() => setStep(3)}>
                    {t('Edit payment screenshot')}
                  </Button>
                )}
              </div>
            )}
          </fieldset>
          {showErrors && Object.values(fileErrors).some(Boolean) && (
            <div role="alert" className="mt-4 text-sm text-error">
              {Object.values(fileErrors)
                .filter(Boolean)
                .map((message) => (
                  <p key={message}>{t(message ?? '')}</p>
                ))}
            </div>
          )}
          <div className="mt-8 flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              disabled={step === 0 || isSubmitting}
              onClick={() => {
                setShowErrors(false);
                setStep(activeSteps[Math.max(0, activeIndex - 1)] ?? 0);
              }}
            >
              <ChevronLeft aria-hidden="true" className="rtl:rotate-180" size={18} />
              {t('Back')}
            </Button>
            {step < 4 ? (
              <Button disabled={isSubmitting || checking || !setup} onClick={() => void next()}>
                {t('Continue to {step}', {
                  step: t(steps[activeSteps[activeIndex + 1] ?? 4] ?? ''),
                })}
                <ChevronRight aria-hidden="true" className="rtl:rotate-180" size={18} />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                aria-describedby={!enabled ? 'demo-submission-notice' : undefined}
              >
                {isSubmitting && (
                  <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
                )}
                {t(enabled ? 'Submit application' : 'Submission disabled in demo')}
              </Button>
            )}
          </div>
          {submissionError && (
            <p role="alert" className="mt-5 rounded-xl border border-error p-4 text-sm text-error">
              {t(submissionError)}{' '}
              {t('Your information and selected files remain available for retry.')}
            </p>
          )}
        </Card>
      </form>
    </FormProvider>
  );
}
