import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface EmailAuthFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isSignUp: boolean;
  setIsSignUp: (isSignUp: boolean) => void;
  handleSignIn: (e: React.FormEvent) => Promise<void>;
  handleSignUp: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
  showResetPassword?: boolean;
}

export const EmailAuthForm = ({
  email,
  setEmail,
  password,
  setPassword,
  isSignUp,
  setIsSignUp,
  handleSignIn,
  handleSignUp,
  isLoading,
  showResetPassword = false
}: EmailAuthFormProps) => {
  return (
    <>
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
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isSignUp ? 'Creating Account...' : 'Signing In...'}
            </>
          ) : (
            isSignUp ? 'Create Account' : 'Sign In'
          )}
        </Button>
        {!isSignUp && showResetPassword && (
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
    </>
  );
};