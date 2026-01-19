import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Wallet, Loader2 } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { user, signInWithGoogle, loading: authLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    
    if (error) {
      toast.error('Failed to sign in with Google. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Login | FinanceFlow</title>
        <meta name="description" content="Sign in to FinanceFlow to manage your personal finances" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
              <Wallet className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">FinanceFlow</h1>
              <p className="text-sm text-muted-foreground">Personal Finance Intelligence</p>
            </div>
          </div>

          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Welcome</CardTitle>
              <CardDescription>
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Authentication is currently disabled.
              </p>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default Auth;
