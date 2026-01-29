import { createContext, useContext, ReactNode } from 'react';

// Mock user for frontend-only mode
const MOCK_USER = {
  id: 'demo-user',
  email: 'demo@financeiq.app',
  user_metadata: {
    full_name: 'Demo User',
    name: 'Demo User',
  },
};

interface AuthContextType {
  user: typeof MOCK_USER | null;
  session: null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string, type: 'email' | 'sms') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Always return mock user for frontend-only mode
  const user = MOCK_USER;
  const session = null;
  const loading = false;

  const signInWithGoogle = async () => ({ error: null });
  const signInWithEmail = async () => ({ error: null });
  const signInWithPhone = async () => ({ error: null });
  const verifyOtp = async () => ({ error: null });
  const signOut = async () => {};

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signInWithGoogle,
      signInWithEmail,
      signInWithPhone,
      verifyOtp,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
