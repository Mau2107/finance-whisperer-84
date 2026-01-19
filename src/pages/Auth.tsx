import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Wallet, Loader2, Mail, Phone, ArrowLeft } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { user, signInWithEmail, signInWithPhone, verifyOtp, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [authType, setAuthType] = useState<'email' | 'phone'>('email');

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleEmailSignIn = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    
    setIsLoading(true);
    const { error } = await signInWithEmail(email);
    setIsLoading(false);
    
    if (error) {
      toast.error('Failed to send verification code. Please try again.');
    } else {
      setOtpSent(true);
      setAuthType('email');
      toast.success('Verification code sent to your email!');
    }
  };

  const handlePhoneSignIn = async () => {
    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    
    setIsLoading(true);
    const { error } = await signInWithPhone(phone);
    setIsLoading(false);
    
    if (error) {
      toast.error('Failed to send verification code. Please try again.');
    } else {
      setOtpSent(true);
      setAuthType('phone');
      toast.success('Verification code sent to your phone!');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }
    
    setIsLoading(true);
    const { error } = await verifyOtp(
      authType === 'email' ? email : phone,
      otp,
      authType === 'email' ? 'email' : 'sms'
    );
    setIsLoading(false);
    
    if (error) {
      toast.error('Invalid verification code. Please try again.');
    } else {
      toast.success('Successfully signed in!');
      navigate('/', { replace: true });
    }
  };

  const handleBack = () => {
    setOtpSent(false);
    setOtp('');
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
              <CardTitle className="text-xl">
                {otpSent ? 'Enter Verification Code' : 'Welcome'}
              </CardTitle>
              <CardDescription>
                {otpSent 
                  ? `We sent a code to ${authType === 'email' ? email : phone}`
                  : 'Sign in to your account to continue'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {otpSent ? (
                <div className="space-y-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="mb-2"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  
                  <Button 
                    onClick={handleVerifyOtp}
                    className="w-full h-12 text-base"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      'Verify & Sign In'
                    )}
                  </Button>
                </div>
              ) : (
                <Tabs defaultValue="email" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="phone">
                      <Phone className="h-4 w-4 mr-2" />
                      Phone
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="email" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEmailSignIn()}
                      />
                    </div>
                    <Button 
                      onClick={handleEmailSignIn}
                      className="w-full h-12 text-base"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Mail className="h-5 w-5 mr-2" />
                          Continue with Email
                        </>
                      )}
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="phone" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handlePhoneSignIn()}
                      />
                    </div>
                    <Button 
                      onClick={handlePhoneSignIn}
                      className="w-full h-12 text-base"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Phone className="h-5 w-5 mr-2" />
                          Continue with Phone
                        </>
                      )}
                    </Button>
                  </TabsContent>
                </Tabs>
              )}
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
