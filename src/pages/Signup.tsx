import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Package } from 'lucide-react';
import { PasswordSchema, firstError } from '@/lib/validation';

function safeNext(next: string | null): string {
  if (!next) return '/';
  if (!next.startsWith('/') || next.startsWith('//')) return '/';
  return next;
}

const Signup = () => {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const nextPath = safeNext(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={nextPath} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    const pwResult = PasswordSchema.safeParse(password);
    if (!pwResult.success) {
      toast({ title: 'Weak password', description: firstError(pwResult.error), variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    const emailRedirectTo = window.location.origin + nextPath;
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });

    if (signUpError) {
      toast({ title: 'Signup Error', description: signUpError.message, variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    // Auto sign-in after creation
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      toast({
        title: 'Account Created',
        description: 'Account created successfully! Please sign in with your email and password.',
      });
    } else {
      toast({ title: 'Welcome!', description: 'Account created and signed in successfully.' });
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-md border shadow-md">
        <CardHeader className="text-center p-4 sm:p-6">
          <div className="flex justify-center mb-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Package className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Get started with Stockist inventory management</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 sm:h-9 text-base sm:text-sm"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 sm:h-9 text-base sm:text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">
                Min 12 characters with uppercase, lowercase, number, and symbol.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 sm:h-9 text-base sm:text-sm"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 p-4 sm:p-6 pt-0 sm:pt-0">
            <Button type="submit" className="w-full h-11 sm:h-9 text-base sm:text-sm" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link
                to={nextPath !== '/' ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'}
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
