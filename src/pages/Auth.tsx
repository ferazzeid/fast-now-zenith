import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Loader2, ChevronDown, Mail } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFormOpen, setEmailFormOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, signInWithGoogle, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !authLoading) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  // Show loading screen while auth is loading to prevent login form flash
  if (authLoading) {
    return <LoadingSpinner />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn(email, password);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signUp(email, password);
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Brand */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            FastNow
          </h1>
          <p className="text-muted-foreground">
            Your no-BS weight loss program
          </p>
        </div>

        <Card className="border-border/50 backdrop-blur-sm bg-card/80 shadow-elegant">
          <CardContent className="space-y-6 pt-6">
            {/* Primary Google Sign In */}
            <Button
              size="lg"
              className="w-full h-12 text-base bg-gradient-to-r from-primary to-primary-glow hover:from-primary/90 hover:to-primary-glow/90 shadow-lg"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              ) : (
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </Button>

            {/* Email Alternative - Collapsible */}
            <Collapsible open={emailFormOpen} onOpenChange={setEmailFormOpen}>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="bg-card px-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Use email instead
                      <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${emailFormOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
              
              <CollapsibleContent className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex gap-2 mt-4">
                  <Button
                    variant={!isSignUp ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setIsSignUp(false)}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant={isSignUp ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setIsSignUp(true)}
                  >
                    Sign Up
                  </Button>
                </div>

                <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder={isSignUp ? "Create a password" : "Enter your password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isSignUp ? 'Creating Account...' : 'Signing In...'}
                      </>
                    ) : (
                      isSignUp ? 'Create Account' : 'Sign In'
                    )}
                  </Button>
                  {!isSignUp && (
                    <div className="text-center">
                      <Link 
                        to="/reset-password" 
                        className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                  )}
                </form>
              </CollapsibleContent>
            </Collapsible>

            {/* Privacy Notice */}
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              By continuing, you agree to our{' '}
              <a
                href="https://fastnow.app/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-foreground hover:text-primary"
              >
                Terms of Service
              </a>{' '}and{' '}
              <a
                href="https://fastnow.app/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-foreground hover:text-primary"
              >
                Privacy Policy
              </a>.
              {' '}Your data is secured and never shared with third parties.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;