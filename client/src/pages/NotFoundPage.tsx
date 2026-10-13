import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="shell">
      <h1>Page not found</h1>
      <p>The page you requested is not available.</p>
      <Link to="/">Return home</Link>
    </main>
  );
}
