import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  FileCheck2,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { adminLoginSchema, type AuthenticatedAdminSession } from '@rozgar-links/shared';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { getButtonClasses } from '../../components/ui/buttonStyles';
import { AdminApiError, fetchAdminSession, issueAdminCv, loginAdmin, logoutAdmin } from './api';

type Session = AuthenticatedAdminSession | null;
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'The request could not be completed. Please try again.';

export function AdminPanel() {
  const { pathname } = useLocation();
  const [session, setSession] = useState<Session>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const version = useRef(0);
  const changeSession = useCallback((next: Session) => {
    version.current++;
    setSession(next);
    setError('');
    setChecking(false);
  }, []);
  const refresh = useCallback(async () => {
    const requestVersion = ++version.current;
    try {
      const next = await fetchAdminSession();
      if (requestVersion === version.current) {
        setSession(next);
        setError('');
      }
    } catch (error) {
      if (requestVersion === version.current) setError(errorMessage(error));
    } finally {
      if (requestVersion === version.current) setChecking(false);
    }
  }, []);
  const cancelPendingCheck = useCallback(() => {
    version.current++;
  }, []);
  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void refresh();
    });
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onFocus);
    return () => {
      active = false;
      cancelPendingCheck();
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onFocus);
    };
  }, [refresh, cancelPendingCheck]);
  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(
      () => changeSession(null),
      Math.max(0, Date.parse(session.expiresAt) - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [session, changeSession]);

  const loginPage = pathname === '/admin/login';
  let content;
  if (checking)
    content = (
      <p role="status" className="flex items-center gap-2 text-muted">
        <LoaderCircle
          aria-hidden="true"
          className="animate-spin motion-reduce:animate-none"
          size={18}
        />
        Checking admin session…
      </p>
    );
  else if (error)
    content = (
      <div role="alert" className="rounded-xl border bg-bg p-6">
        <p className="text-error">{error}</p>
        <Button
          className="mt-4"
          onClick={() => {
            setChecking(true);
            void refresh();
          }}
        >
          Retry session check
        </Button>
      </div>
    );
  else if (pathname !== '/admin/login' && pathname !== '/admin/cv')
    content = <Navigate to="/admin/login" replace />;
  else if (!session && !loginPage) content = <Navigate to="/admin/login" replace />;
  else if (session && loginPage) content = <Navigate to="/admin/cv" replace />;
  else
    content = session ? (
      <CvIssuance session={session} onSessionChange={changeSession} />
    ) : (
      <AdminLoginForm onSessionChange={changeSession} />
    );

  return (
    <div className="min-h-screen bg-surface font-sans text-text" dir="ltr" lang="en">
      <header className="border-b bg-bg">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6">
          <Link to="/" className="text-xl font-black tracking-wide text-primary">
            ROZGAR <span className="text-brand-green">LINKS</span>
          </Link>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-muted">
            <ShieldCheck aria-hidden="true" size={17} />
            Private admin workspace
          </span>
        </div>
      </header>
      <main
        className={`mx-auto px-4 py-10 sm:px-6 sm:py-14 ${loginPage ? 'max-w-lg' : 'max-w-3xl'}`}
      >
        {content}
      </main>
    </div>
  );
}

function AdminLoginForm({ onSessionChange }: { onSessionChange: (session: Session) => void }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    const credentials = adminLoginSchema.safeParse({ username, password });
    if (!credentials.success) {
      setError('Enter your username and password.');
      return;
    }
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const session = await loginAdmin(credentials.data);
      setPassword('');
      onSessionChange(session);
      navigate('/admin/cv', { replace: true });
    } catch (error) {
      setError(errorMessage(error));
      setPassword('');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section
      className="rounded-2xl border bg-bg p-6 shadow-soft sm:p-8"
      aria-labelledby="admin-login-title"
    >
      <span className="grid size-12 place-items-center rounded-xl bg-primary/5 text-primary">
        <LockKeyhole aria-hidden="true" size={24} />
      </span>
      <h1 id="admin-login-title" className="mt-5 text-3xl">
        Admin login
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Sign in to issue official Rozgar Links CVs.
      </p>
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
        noValidate
        className="mt-6 space-y-5"
      >
        {error && (
          <p
            role="alert"
            className="rounded-xl border border-error/25 bg-error/5 p-3 text-sm text-error"
          >
            {error}
          </p>
        )}
        <TextInput
          label="Username"
          required
          autoComplete="username"
          maxLength={100}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          disabled={busy}
        />
        <div className="space-y-2">
          <TextInput
            label="Password"
            required
            type={visible ? 'text' : 'password'}
            autoComplete="current-password"
            maxLength={256}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={busy}
          />
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-surface"
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? (
              <EyeOff aria-hidden="true" size={17} />
            ) : (
              <Eye aria-hidden="true" size={17} />
            )}
            {visible ? 'Hide password' : 'Show password'}
          </button>
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && (
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin motion-reduce:animate-none"
              size={17}
            />
          )}
          {busy ? 'Signing in…' : 'Log in'}
        </Button>
      </form>
    </section>
  );
}

function CvIssuance({
  session,
  onSessionChange,
}: {
  session: AuthenticatedAdminSession;
  onSessionChange: (session: Session) => void;
}) {
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<{ url: string; reference: string }>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const url = useRef('');
  const input = useRef<HTMLInputElement>(null);
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (url.current) URL.revokeObjectURL(url.current);
    };
  }, []);
  function resetResult() {
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = '';
    setResult(undefined);
  }
  function choose(next?: File) {
    resetResult();
    setError('');
    setFile(undefined);
    if (!next) return;
    if (
      next.size === 0 ||
      next.size > session.maxUploadBytes ||
      next.type !== 'application/pdf' ||
      !/\.pdf$/i.test(next.name)
    ) {
      setError(`Choose a PDF up to ${session.maxUploadBytes / 1024 / 1024} MiB.`);
      return;
    }
    setFile(next);
  }
  async function generate(event: FormEvent) {
    event.preventDefault();
    if (lock.current || !file || result) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const issued = await issueAdminCv(file, session.csrfToken);
      if (!mounted.current) return;
      resetResult();
      url.current = URL.createObjectURL(issued.pdf);
      setResult({ url: url.current, reference: issued.reference });
      setFile(undefined);
      if (input.current) input.current.value = '';
    } catch (error) {
      if (!mounted.current) return;
      if (error instanceof AdminApiError && error.status === 401) onSessionChange(null);
      else setError(errorMessage(error));
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function logout() {
    if (loggingOut || busy) return;
    setLoggingOut(true);
    setError('');
    try {
      await logoutAdmin(session.csrfToken);
      onSessionChange(null);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      if (mounted.current) setLoggingOut(false);
    }
  }
  return (
    <section aria-labelledby="admin-cv-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green">
          <FileCheck2 aria-hidden="true" size={18} />
          Official CV issuance
        </span>
        <Button
          variant="outline"
          disabled={busy || loggingOut}
          onClick={() => {
            void logout();
          }}
        >
          <LogOut aria-hidden="true" size={16} />
          {loggingOut ? 'Logging out…' : 'Logout'}
        </Button>
      </div>
      <h1 id="admin-cv-title" className="mt-4 text-3xl sm:text-4xl">
        Issue Official Rozgar Links CV
      </h1>
      <p className="mt-3 max-w-2xl leading-7 text-muted">
        Upload a completed CV to generate an official Rozgar Links CV with a unique reference and
        secure verification.
      </p>
      <form
        onSubmit={(event) => {
          void generate(event);
        }}
        className="mt-6 rounded-2xl border bg-bg p-5 shadow-soft sm:p-8"
      >
        {error && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-error/25 bg-error/5 p-3 text-sm text-error"
          >
            {error}
          </p>
        )}
        <label htmlFor="admin-cv-upload" className="block font-bold text-primary">
          Completed CV upload (PDF only) <span aria-hidden="true">*</span>
        </label>
        <p id="admin-upload-help" className="mt-2 text-sm leading-6 text-muted">
          Use the original, unsigned PDF, up to {session.maxUploadBytes / 1024 / 1024} MiB.
          Documents are processed privately without saving them on the server. Leave a small
          bottom-right margin on the last page for the reference.
        </p>
        <input
          ref={input}
          id="admin-cv-upload"
          type="file"
          accept=".pdf,application/pdf"
          aria-describedby="admin-upload-help"
          className="mt-4 block w-full min-w-0 rounded-xl border bg-surface p-3 text-sm file:me-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:font-semibold file:text-primary"
          disabled={busy || loggingOut}
          onChange={(event) => choose(event.target.files?.[0])}
        />
        <Button
          type="submit"
          className="mt-5 w-full sm:w-auto"
          disabled={!file || busy || loggingOut || !!result}
        >
          {busy ? (
            <LoaderCircle
              aria-hidden="true"
              className="animate-spin motion-reduce:animate-none"
              size={18}
            />
          ) : (
            <Upload aria-hidden="true" size={18} />
          )}
          {busy ? 'Generating official CV…' : 'Generate Official CV'}
        </Button>
        {result && (
          <div className="mt-6 rounded-xl border border-brand-green/20 bg-brand-green/5 p-4 sm:p-5">
            <p role="status" className="flex items-center gap-2 font-bold text-primary">
              <CheckCircle2 aria-hidden="true" className="shrink-0 text-brand-green" size={20} />
              Official CV generated and verified.
            </p>
            <p className="mt-3 text-sm text-muted">CV reference</p>
            <p className="mt-1 break-all font-bold text-primary">
              <bdi>{result.reference}</bdi>
            </p>
            <a
              className={getButtonClasses('secondary', 'mt-4 w-full sm:w-auto')}
              href={result.url}
              download={`${result.reference}.pdf`}
            >
              <Download aria-hidden="true" size={18} />
              Download Official CV
            </a>
            <p className="mt-3 text-sm leading-6 text-muted">
              Send the downloaded original to the applicant. Editing or re-saving the PDF will
              invalidate its verification. Choose another PDF above to issue the next CV.
            </p>
          </div>
        )}
      </form>
    </section>
  );
}
