import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { repo } from './data/instance';
import { Dashboard } from './features/dashboard/Dashboard';
import { Lessons } from './features/lessons/Lessons';
import { Reviews } from './features/reviews/Reviews';
import './styles/tokens.css';
import './styles/app.css';

const router = createBrowserRouter([
  { path: '/', element: <Dashboard /> },
  { path: '/lessons', element: <Lessons /> },
  { path: '/reviews', element: <Reviews /> },
  { path: '*', element: <Dashboard /> },
]);

async function start() {
  await repo.init(Date.now());
  // Ask the browser not to evict our data when storage runs low.
  navigator.storage?.persist?.().catch(() => undefined);
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
}

start();
