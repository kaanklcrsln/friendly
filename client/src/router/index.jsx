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

const router = createBrowserRouter([
  // Auth routes
  { path: '/giris', element: <LoginPage /> },
  { path: '/kayit', element: <RegisterPage /> },

  // Protected routes
  {
    path: '/',
    element: (
      <PrivateRoute>
        <HomePage />
      </PrivateRoute>
    ),
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

  // Wildcard route - redirect to home
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default router;

