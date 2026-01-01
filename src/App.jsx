import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { Suspense } from 'react';
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import React from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { appParams } from '@/lib/app-params';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { isSupabaseConfigured } from '@/api/supabaseClient';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const isDevBypass = !appParams.serverUrl || !appParams.appId;
const effectiveMainPageKey = isDevBypass ? 'Home' : mainPageKey;
const MainPage = effectiveMainPageKey ? Pages[effectiveMainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const navigate = useNavigate();
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated } = useAuth();
  React.useEffect(() => {
    if (isSupabaseConfigured && !isAuthenticated && !isLoadingAuth) {
      navigate(createPageUrl('Login'), { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth]);

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  // If redirecting to Login, render nothing here
  if (isSupabaseConfigured && !isAuthenticated) {
    return null;
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={effectiveMainPageKey}>
          <Suspense fallback={<div className="p-4">Loading...</div>}>
            <MainPage />
          </Suspense>
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([pageName, Page]) => (
        <Route
          key={pageName}
          path={createPageUrl(pageName)}
          element={
            <LayoutWrapper currentPageName={pageName}>
              <Suspense fallback={<div className="p-4">Loading...</div>}>
                <Page />
              </Suspense>
            </LayoutWrapper>
          }
        />
      ))}
      {/* Explicit Login route (without Layout) */}
      <Route path={createPageUrl('Login')} element={
        <Suspense fallback={<div className="p-4">Loading...</div>}>
          {Pages.Login ? <Pages.Login /> : <div>Login</div>}
        </Suspense>
      } />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <VisualEditAgent />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
