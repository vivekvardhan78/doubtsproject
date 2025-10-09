import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/auth/Login';
import { Signup } from './components/auth/Signup';
import { ProfileSetup } from './components/auth/ProfileSetup';
import { PostDoubt } from './components/student/PostDoubt';
import { StudentDashboard } from './components/student/StudentDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { Chatbot } from './components/shared/Chatbot';
import { LogOut, BookOpen, MessageSquare, Home } from 'lucide-react';

function AppContent() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [activeView, setActiveView] = useState<'home' | 'post' | 'dashboard'>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return authMode === 'login' ? (
      <Login onToggleMode={() => setAuthMode('signup')} />
    ) : (
      <Signup onToggleMode={() => setAuthMode('login')} />
    );
  }

  if (user && !profile) {
    return <ProfileSetup user={user} onComplete={refreshProfile} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Student Doubts Platform</h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {profile.full_name} ({profile.role})
              </span>
              <button
                onClick={() => signOut()}
                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {profile.role === 'student' && (
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 py-2">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                  activeView === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Home className="w-4 h-4 mr-2" />
                My Doubts
              </button>
              <button
                onClick={() => setActiveView('post')}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                  activeView === 'post'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Post Doubt
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {profile.role === 'student' ? (
          <>
            {activeView === 'dashboard' && <StudentDashboard />}
            {activeView === 'post' && <PostDoubt />}
          </>
        ) : (
          <TeacherDashboard />
        )}
      </main>

      <Chatbot />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
