import { createBrowserRouter, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import EventDetailPage from '../pages/EventDetailPage';
import ChatRoomPage from '../pages/ChatRoomPage';
import ProfilePage from '../pages/ProfilePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import PrivateRoute from './PrivateRoute';

const AboutPage = () => (
  <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
    <h1>Hakkında</h1>
    <p>Friendly WebGIS Platform</p>
  </div>
);

const router = createBrowserRouter(
  [
    // Auth routes
    { path: '/giris', element: <LoginPage /> },
    { path: '/kayit', element: <RegisterPage /> },

    // Main route (protected)
    {
      path: '/main',
      element: (
        <PrivateRoute>
          <HomePage />
        </PrivateRoute>
      ),
    },

    // Root route - redirect to main
    {
      path: '/',
      element: <Navigate to="/main" replace />,
    },
  {
    path: '/events',
    element: (
      <PrivateRoute>
        <EventDetailPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/events/:id',
    element: (
      <PrivateRoute>
        <EventDetailPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/chat/:id',
    element: (
      <PrivateRoute>
        <ChatRoomPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <PrivateRoute>
        <ProfilePage />
      </PrivateRoute>
    ),
  },
  {
    path: '/about',
    element: (
      <PrivateRoute>
        <AboutPage />
      </PrivateRoute>
    ),
  },

    // Root and wildcard routes - redirect to main
    { path: '/', element: <Navigate to="/main" replace /> },
    { path: '*', element: <Navigate to="/main" replace /> },
  ],
  { basename: '/friendly' }
);

export default router;

