import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, useRouteError } from 'react-router-dom';
import { repo } from './data/instance';
import { Dashboard } from './features/dashboard/Dashboard';
import { Lessons } from './features/lessons/Lessons';
import { Reviews } from './features/reviews/Reviews';
import { ErrorBoundary, ErrorScreen, installGlobalErrorHandlers } from './ui/errors';
import { ThemeProvider } from './ui/theme-context';
import { applyTheme, readStoredTheme } from './ui/theme-dom';
import './styles/fonts.css';
import './styles/app.css';
import './styles/themes.css';

const router = createBrowserRouter([
  { path: '/', element: <Dashboard />, errorElement: <RouteError /> },
  { path: '/lessons', element: <Lessons />, errorElement: <RouteError /> },
  { path: '/reviews', element: <Reviews />, errorElement: <RouteError /> },
  { path: '*', element: <Dashboard />, errorElement: <RouteError /> },
]);

/** Render errors inside a screen land here (React Router catches them before ErrorBoundary). */
function RouteError() {
  return <ErrorScreen error={useRouteError()} />;
}

// Paint the saved theme before anything renders, so there is no flash of the default.
applyTheme(readStoredTheme());

const root = createRoot(document.getElementById('root')!);
installGlobalErrorHandlers();

async function start() {
  try {
    await repo.init(Date.now());
  } catch (error) {
    console.error(error);
    root.render(<ErrorScreen error={error} />);
    return;
  }
  // Ask the browser not to evict our data when storage runs low.
  navigator.storage?.persist?.().catch(() => undefined);
  root.render(
    <StrictMode>
      <ThemeProvider>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </ThemeProvider>
    </StrictMode>,
  );
}

start();
