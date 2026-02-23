import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Intake from './pages/Intake';
import Review from './pages/Review';
import UseCaseDetail from './pages/UseCaseDetail';
import SideNav from './components/SideNav';
import TopBar from './components/TopBar';
import Home from './pages/Home';
import UseCaseList from './pages/UseCaseList';
import UseCaseEdit from './pages/UseCaseEdit';
import UserAdministration from './pages/UserAdministration';
import DataAdministration from './pages/DataAdministration';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  return (
    <div className="modern-app">
      <SideNav />
      <div className="modern-app__content">
        <TopBar />
        <main className="modern-app__main">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/use-cases" element={<UseCaseList />} />
            <Route path="/intake" element={<Intake />} />
            <Route path="/review" element={<Review />} />
            <Route path="/usecase/:id" element={<UseCaseDetail />} />
            <Route path="/usecase/:id/edit" element={<UseCaseEdit />} />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <UserAdministration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/data"
              element={
                <ProtectedRoute>
                  <DataAdministration />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-panel">
          <h2>App Error</h2>
          <p>{String(this.state.error)}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

