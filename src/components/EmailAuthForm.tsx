import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  rememberMe?: boolean;
  setRememberMe?: (rememberMe: boolean) => void;
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
  showResetPassword = false,
  rememberMe = false,
  setRememberMe
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
        {!isSignUp && setRememberMe && (
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              disabled={isLoading}
            />
            <Label 
              htmlFor="remember-me" 
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Remember me
            </Label>
          </div>
        )}
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