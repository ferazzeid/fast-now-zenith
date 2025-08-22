import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';

interface OAuthResult {
  success: boolean;
  error?: string;
  session?: any;
}

export class MobileOAuthHandler {
  private listeners: Array<() => void> = [];
  private isAuthInProgress = false;
  private authTimeout?: NodeJS.Timeout;
  private authStartTime = 0;
  private readonly TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.cleanup = this.cleanup.bind(this);
  }

  /**
   * Check if we're running on a native mobile platform
   */
  private isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Generate OAuth URL with mobile-specific configuration
   */
  private async generateOAuthUrl(): Promise<string> {
    const redirectUrl = this.isNativePlatform() 
      ? 'com.fastnow.zenith://oauth/callback'
      : `${window.location.origin}/oauth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        skipBrowserRedirect: true,
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      throw new Error(`OAuth URL generation failed: ${error.message}`);
    }

    if (!data.url) {
      throw new Error('OAuth URL not generated');
    }

    return data.url;
  }

  /**
   * Handle app state changes (when user returns from browser)
   */
  private async handleAppStateChange(state: { isActive: boolean }) {
    if (!this.isAuthInProgress) return;
    
    console.log(`🔄 [${new Date().toISOString()}] App state changed:`, state.isActive);
    
    if (state.isActive) {
      console.log(`📱 [${new Date().toISOString()}] App resumed - checking for new session`);
      await this.checkForNewSession();
    }
  }

  /**
   * Handle deep link fallback
   */
  private async handleDeepLink(data: { url: string }) {
    if (!this.isAuthInProgress) return;
    
    console.log(`🔗 [${new Date().toISOString()}] Deep link received:`, data.url);
    
    if (data.url.includes('oauth/callback')) {
      await this.handleOAuthCallback(data.url);
    }
  }

  /**
   * Check for new session after app resume with retry logic
   */
  private async checkForNewSession(): Promise<void> {
    const maxRetries = 5;
    const initialDelay = 2000; // Start with 2 seconds
    
    console.log(`🔍 [${new Date().toISOString()}] Starting session check with retry logic (${maxRetries} attempts)`);
    
    const attemptSessionCheck = async (attempt: number): Promise<void> => {
      try {
        const delay = initialDelay * Math.pow(1.5, attempt - 1); // Exponential backoff
        console.log(`🔍 [${new Date().toISOString()}] Attempt ${attempt}/${maxRetries} - waiting ${delay}ms before checking session`);
        
        setTimeout(async () => {
          try {
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              console.error(`❌ [${new Date().toISOString()}] Session check failed on attempt ${attempt}:`, error.message);
              
              // Handle invalid refresh token errors
              if (error.message.includes('Invalid Refresh Token') || error.message.includes('refresh_token_not_found')) {
                console.log(`🧹 [${new Date().toISOString()}] Clearing invalid session state`);
                await supabase.auth.signOut();
              }
              
              // Only fail if it's the last attempt
              if (attempt >= maxRetries) {
                await this.handleAuthError(`Session validation failed after ${maxRetries} attempts: ${error.message}`);
              } else {
                console.log(`🔄 [${new Date().toISOString()}] Retrying session check (attempt ${attempt + 1})`);
                await attemptSessionCheck(attempt + 1);
              }
              return;
            }

            if (session?.user?.id) {
              console.log(`✅ [${new Date().toISOString()}] Valid session found on attempt ${attempt}:`, {
                userId: session.user.id,
                email: session.user.email,
                totalTime: `${(Date.now() - this.authStartTime)}ms`
              });
              
              // Clear the timeout since we found a session
              if (this.authTimeout) {
                clearTimeout(this.authTimeout);
                this.authTimeout = undefined;
              }
              
              await this.handleAuthSuccess();
            } else {
              console.log(`🔍 [${new Date().toISOString()}] No session found on attempt ${attempt}/${maxRetries}`);
              
              if (attempt >= maxRetries) {
                console.log(`⚠️ [${new Date().toISOString()}] No session found after ${maxRetries} attempts, trying fallback`);
                await this.attemptSessionFallback();
              } else {
                console.log(`🔄 [${new Date().toISOString()}] Retrying session check (attempt ${attempt + 1})`);
                await attemptSessionCheck(attempt + 1);
              }
            }
          } catch (sessionError) {
            console.error(`❌ [${new Date().toISOString()}] Session check error on attempt ${attempt}:`, sessionError);
            
            if (attempt >= maxRetries) {
              await this.handleAuthError('Session validation failed');
            } else {
              console.log(`🔄 [${new Date().toISOString()}] Retrying after error (attempt ${attempt + 1})`);
              await attemptSessionCheck(attempt + 1);
            }
          }
        }, delay);
      } catch (error) {
        console.error(`❌ [${new Date().toISOString()}] Retry logic error:`, error);
        if (attempt >= maxRetries) {
          await this.handleAuthError('Session check retry logic failed');
        }
      }
    };

    await attemptSessionCheck(1);
  }

  /**
   * Fallback mechanism to try refreshing session manually
   */
  private async attemptSessionFallback(): Promise<void> {
    try {
      console.log(`🔄 [${new Date().toISOString()}] Attempting session fallback - manual refresh`);
      
      // Try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error(`❌ [${new Date().toISOString()}] Session refresh failed:`, error.message);
        await this.handleAuthError('Session refresh failed - please try signing in again');
        return;
      }
      
      if (data.session?.user?.id) {
        console.log(`✅ [${new Date().toISOString()}] Session recovered via fallback refresh:`, {
          userId: data.session.user.id,
          email: data.session.user.email
        });
        await this.handleAuthSuccess();
      } else {
        console.log(`❌ [${new Date().toISOString()}] Fallback refresh returned no session`);
        await this.handleAuthError('Unable to establish session - please try signing in again');
      }
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] Session fallback failed:`, error);
      await this.handleAuthError('Session recovery failed - please try signing in again');
    }
  }

  /**
   * Handle OAuth callback URL (deep link fallback)
   */
  private async handleOAuthCallback(url: string): Promise<void> {
    try {
      console.log('🔄 Processing OAuth callback:', url);
      
      // Convert custom scheme URL to HTTPS format if needed
      let processedUrl = url;
      if (url.startsWith('com.fastnow.zenith://')) {
        const urlObj = new URL(url);
        processedUrl = `https://go.fastnow.app${urlObj.pathname}${urlObj.search}`;
        console.log('✅ Converted URL:', processedUrl);
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(processedUrl);

      if (error) {
        console.error('❌ OAuth session exchange failed:', error.message);
        await this.handleAuthError(`Session exchange failed: ${error.message}`);
        return;
      }

      if (data.session?.user?.id) {
        console.log('✅ OAuth session exchanged successfully:', {
          userId: data.session.user.id,
          email: data.session.user.email
        });
        // Let the auth state change listener handle the session
        // We just need to signal success
        await this.handleAuthSuccess();
      } else {
        console.error('❌ Session exchange returned no valid session');
        await this.handleAuthError('Session exchange returned invalid session');
      }
    } catch (error) {
      console.error('❌ OAuth callback processing error:', error);
      await this.handleAuthError('OAuth callback processing failed');
    }
  }

  /**
   * Handle successful authentication
   */
  private async handleAuthSuccess(): Promise<void> {
    console.log(`✅ [${new Date().toISOString()}] OAuth flow completed successfully`);
    this.cleanup();
    
    // Close browser if still open
    try {
      await Browser.close();
    } catch {
      // Browser might already be closed
    }

    // Trigger auth success callback - let auth store handle session
    if (this.onAuthComplete) {
      this.onAuthComplete({ success: true });
    }
  }

  /**
   * Handle authentication error
   */
  private async handleAuthError(error: string): Promise<void> {
    console.error(`❌ [${new Date().toISOString()}] OAuth authentication failed:`, error);
    this.cleanup();
    
    // Close browser if still open
    try {
      await Browser.close();
    } catch {
      // Browser might already be closed
    }

    // Trigger auth error callback
    if (this.onAuthComplete) {
      this.onAuthComplete({ success: false, error });
    }
  }

  /**
   * Set up listeners for app state and deep links
   */
  private async setupListeners(): Promise<void> {
    if (!this.isNativePlatform()) {
      console.log('🌐 Web platform detected - using web OAuth flow');
      return;
    }

    try {
      // Listen for app state changes
      const appStateListener = await App.addListener('appStateChange', this.handleAppStateChange.bind(this));
      this.listeners.push(() => appStateListener.remove());

      // Listen for deep links as fallback
      const urlListener = await App.addListener('appUrlOpen', this.handleDeepLink.bind(this));
      this.listeners.push(() => urlListener.remove());

      console.log('🎧 Mobile OAuth listeners setup complete');
    } catch (error) {
      console.error('❌ Failed to setup OAuth listeners:', error);
    }
  }

  /**
   * Cleanup listeners and timeouts
   */
  private cleanup(): void {
    console.log('🧹 Cleaning up OAuth handlers');
    
    this.isAuthInProgress = false;
    
    // Remove all listeners
    this.listeners.forEach(remove => {
      try {
        remove();
      } catch (error) {
        console.warn('Warning: Failed to remove listener:', error);
      }
    });
    this.listeners = [];

    // Clear timeout
    if (this.authTimeout) {
      clearTimeout(this.authTimeout);
      this.authTimeout = undefined;
    }
  }

  private onAuthComplete?: (result: OAuthResult) => void;

  /**
   * Start Google OAuth flow
   */
  public async signInWithGoogle(): Promise<OAuthResult> {
    if (this.isAuthInProgress) {
      console.log(`🔄 [${new Date().toISOString()}] OAuth already in progress, skipping new request`);
      return { success: false, error: 'OAuth already in progress' };
    }

    return new Promise(async (resolve) => {
      this.onAuthComplete = resolve;
      this.isAuthInProgress = true;
      this.authStartTime = Date.now(); // Record start time for performance tracking

      try {
        console.log(`🚀 [${new Date().toISOString()}] Starting Google OAuth flow`);

        // Setup listeners first
        await this.setupListeners();

        // Set timeout for auth process  
        this.authTimeout = setTimeout(() => {
          console.log(`⏰ [${new Date().toISOString()}] OAuth timeout reached`);
          this.handleAuthError('Authentication timeout - please try again');
        }, this.TIMEOUT_MS);

        // Generate OAuth URL
        const oauthUrl = await this.generateOAuthUrl();
        console.log(`🔗 [${new Date().toISOString()}] Generated OAuth URL`);

        if (this.isNativePlatform()) {
          // Open system browser on mobile
          console.log(`📱 [${new Date().toISOString()}] Opening system browser for OAuth`);
          await Browser.open({
            url: oauthUrl,
            windowName: '_system',
          });
          
          console.log(`🎯 [${new Date().toISOString()}] Waiting for user to complete OAuth and return to app...`);
        } else {
          // Fallback to web flow
          console.log(`🌐 [${new Date().toISOString()}] Redirecting to OAuth in web browser`);
          window.location.href = oauthUrl;
        }

      } catch (error) {
        console.error(`❌ [${new Date().toISOString()}] OAuth initialization failed:`, error);
        await this.handleAuthError(
          error instanceof Error ? error.message : 'OAuth initialization failed'
        );
      }
    });
  }

  /**
   * Cancel ongoing OAuth process
   */
  public cancelAuth(): void {
    if (this.isAuthInProgress) {
      console.log('🚫 Cancelling OAuth process');
      this.handleAuthError('Authentication cancelled by user');
    }
  }
}