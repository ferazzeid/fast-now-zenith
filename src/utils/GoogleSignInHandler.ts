import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { supabase } from '@/integrations/supabase/client';

// Generate a cryptographically secure nonce for Google Sign-In
function generateNonce(): string {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._';
  let result = '';
  const cryptoObj = window.crypto || (window as any).msCrypto;
  
  if (cryptoObj) {
    const randomValues = new Uint8Array(32);
    cryptoObj.getRandomValues(randomValues);
    randomValues.forEach(value => {
      result += charset[value % charset.length];
    });
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < 32; i++) {
      result += charset[Math.floor(Math.random() * charset.length)];
    }
  }
  
  return result;
}

interface OAuthResult {
  success: boolean;
  error?: string;
  session?: any;
}

export class GoogleSignInHandler {
  private isAuthInProgress = false;

  constructor() {
    // No initialization needed for Firebase Authentication plugin
    console.log('✅ Firebase Authentication handler initialized');
  }

  /**
   * Check if we're running on a native mobile platform
   */
  private isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Start Google Sign-In flow using Firebase Authentication
   */
  public async signInWithGoogle(): Promise<OAuthResult> {
    if (this.isAuthInProgress) {
      console.log('🔄 Google Sign-In already in progress, skipping new request');
      return { success: false, error: 'Sign-in already in progress' };
    }

    this.isAuthInProgress = true;

    try {
      console.log('🚀 Starting Firebase Google Sign-In flow');

      if (!this.isNativePlatform()) {
        // Fallback to web OAuth for web platform
        return await this.signInWithGoogleWeb();
      }

      // Generate nonce for enhanced security
      const nonce = generateNonce();
      console.log('🔐 Generated nonce for secure authentication');

      // Native platform - use Firebase Authentication plugin
      const result = await FirebaseAuthentication.signInWithGoogle();
      
      if (!result.credential?.idToken) {
        throw new Error('No ID token received from Firebase Authentication');
      }

      console.log('✅ Firebase Google Sign-In successful, exchanging token with Supabase');

      // Exchange Firebase ID token with Supabase using nonce
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: result.credential.idToken,
        nonce: nonce,
      });

      if (error) {
        throw new Error(`Supabase token exchange failed: ${error.message}`);
      }

      if (!data.session?.user?.id) {
        throw new Error('No valid session received from Supabase');
      }

      console.log('✅ Authentication completed successfully:', {
        userId: data.session.user.id,
        email: data.session.user.email,
      });

      this.isAuthInProgress = false;
      return { success: true, session: data.session };

    } catch (error) {
      console.error('❌ Firebase Google Sign-In failed:', error);
      this.isAuthInProgress = false;
      
      const errorMessage = error instanceof Error ? error.message : 'Google Sign-In failed';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Fallback web OAuth flow for web platform
   */
  private async signInWithGoogleWeb(): Promise<OAuthResult> {
    try {
      console.log('🌐 Using web OAuth flow');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://go.fastnow.app/auth/callback',
        },
      });

      if (error) {
        throw new Error(`Web OAuth failed: ${error.message}`);
      }

      this.isAuthInProgress = false;
      return { success: true };

    } catch (error) {
      console.error('❌ Web OAuth failed:', error);
      this.isAuthInProgress = false;
      
      const errorMessage = error instanceof Error ? error.message : 'Web OAuth failed';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sign out from Firebase Authentication
   */
  public async signOut(): Promise<void> {
    try {
      if (this.isNativePlatform()) {
        await FirebaseAuthentication.signOut();
      }
      console.log('✅ Firebase Sign-Out completed');
    } catch (error) {
      console.error('❌ Firebase Sign-Out failed:', error);
    }
  }

  /**
   * Cancel ongoing authentication process
   */
  public async cancelAuth(): Promise<void> {
    if (this.isAuthInProgress) {
      console.log('🚫 Cancelling Firebase Sign-In process');
      this.isAuthInProgress = false;
    }
  }
}