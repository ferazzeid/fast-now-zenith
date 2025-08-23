import React, { useState, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle, Clock, Smartphone, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TestLog {
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
  data?: any;
}

interface TestState {
  isRunning: boolean;
  phase: string;
  result?: 'success' | 'error';
  error?: string;
}

export default function OAuthTest() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<TestLog[]>([]);
  const [testState, setTestState] = useState<TestState>({ isRunning: false, phase: 'idle' });
  const [method, setMethod] = useState<'custom_scheme' | 'app_link'>('custom_scheme');
  
  const listenersRef = useRef<Array<() => void>>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const addLog = useCallback((level: TestLog['level'], message: string, data?: any) => {
    const log: TestLog = {
      timestamp: new Date().toISOString().split('T')[1].split('.')[0],
      level,
      message,
      data
    };
    setLogs(prev => [...prev, log]);
    console.log(`[OAuth Test] ${level.toUpperCase()}: ${message}`, data || '');
  }, []);

  const cleanup = useCallback(() => {
    listenersRef.current.forEach(remove => {
      try {
        remove();
      } catch (error) {
        addLog('warning', 'Failed to remove listener', error);
      }
    });
    listenersRef.current = [];
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    
    setTestState(prev => ({ ...prev, isRunning: false }));
  }, [addLog]);

  const clearLogs = () => {
    setLogs([]);
    setTestState({ isRunning: false, phase: 'idle' });
  };

  const testCustomSchemeOAuth = async () => {
    if (testState.isRunning) return;
    
    clearLogs();
    setTestState({ isRunning: true, phase: 'initializing' });
    
    try {
      addLog('info', 'Starting Custom Scheme OAuth Test');
      addLog('info', `Platform: ${Capacitor.getPlatform()}`);
      addLog('info', `Is Native: ${Capacitor.isNativePlatform()}`);
      
      if (!Capacitor.isNativePlatform()) {
        addLog('warning', 'Not on native platform - test may not work as expected');
      }

      // Step 1: Generate OAuth URL
      setTestState(prev => ({ ...prev, phase: 'generating_url' }));
      addLog('info', 'Generating OAuth URL...');
      
      const redirectUrl = 'com.fastnow.zenith://oauth/callback';
      addLog('info', `Using redirect URL: ${redirectUrl}`);
      
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
        throw new Error('No OAuth URL returned');
      }

      addLog('success', 'OAuth URL generated successfully');
      addLog('info', `OAuth URL: ${data.url.substring(0, 100)}...`);

      // Step 2: Setup listeners
      setTestState(prev => ({ ...prev, phase: 'setting_up_listeners' }));
      addLog('info', 'Setting up native listeners...');

      if (Capacitor.isNativePlatform()) {
        // App state listener
        const appStateListener = await App.addListener('appStateChange', (state) => {
          addLog('info', `App state changed: ${state.isActive ? 'active' : 'inactive'}`);
          if (state.isActive && testState.isRunning) {
            addLog('info', 'App became active - checking session...');
            checkSessionAfterReturn();
          }
        });
        listenersRef.current.push(() => appStateListener.remove());

        // Deep link listener
        const urlListener = await App.addListener('appUrlOpen', ({ url }) => {
          addLog('info', `Deep link received: ${url}`);
          if (url.includes('oauth/callback')) {
            handleDeepLinkCallback(url);
          }
        });
        listenersRef.current.push(() => urlListener.remove());
        
        addLog('success', 'Native listeners setup complete');
      }

      // Step 3: Set timeout
      timeoutRef.current = setTimeout(() => {
        addLog('error', 'OAuth test timed out (2 minutes)');
        setTestState(prev => ({ ...prev, result: 'error', error: 'Timeout' }));
        cleanup();
      }, 120000); // 2 minutes

      // Step 4: Open browser
      setTestState(prev => ({ ...prev, phase: 'opening_browser' }));
      addLog('info', 'Opening system browser...');
      
      if (Capacitor.isNativePlatform()) {
        await Browser.open({
          url: data.url,
          windowName: '_system',
        });
        addLog('success', 'Browser opened - waiting for user to complete OAuth...');
        setTestState(prev => ({ ...prev, phase: 'waiting_for_user' }));
      } else {
        addLog('info', 'Web platform - redirecting...');
        window.location.href = data.url;
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addLog('error', `Test failed: ${message}`);
      setTestState(prev => ({ ...prev, result: 'error', error: message }));
      cleanup();
    }
  };

  const handleDeepLinkCallback = async (url: string) => {
    try {
      addLog('info', 'Processing deep link callback...');
      setTestState(prev => ({ ...prev, phase: 'processing_callback' }));
      
      // Convert custom scheme to HTTPS for Supabase
      let processedUrl = url;
      if (url.startsWith('com.fastnow.zenith://')) {
        const urlObj = new URL(url);
        processedUrl = `https://texnkijwcygodtywgedm.supabase.co/auth/v1/callback${urlObj.pathname}${urlObj.search}`;
        addLog('info', `Converted URL: ${processedUrl.substring(0, 100)}...`);
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(processedUrl);

      if (error) {
        throw new Error(`Session exchange failed: ${error.message}`);
      }

      if (data.session) {
        addLog('success', 'Session exchange successful!');
        addLog('info', `User: ${data.session.user.email}`);
        setTestState(prev => ({ ...prev, result: 'success', phase: 'completed' }));
        
        // Close browser
        try {
          await Browser.close();
          addLog('info', 'Browser closed');
        } catch (e) {
          addLog('warning', 'Browser close failed (might already be closed)');
        }
      } else {
        throw new Error('No session returned from exchange');
      }

      cleanup();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addLog('error', `Callback processing failed: ${message}`);
      setTestState(prev => ({ ...prev, result: 'error', error: message }));
      cleanup();
    }
  };

  const checkSessionAfterReturn = async () => {
    try {
      addLog('info', 'Checking current session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        addLog('warning', `Session check error: ${error.message}`);
        return;
      }
      
      if (session) {
        addLog('success', 'Valid session found!');
        addLog('info', `User: ${session.user.email}`);
        setTestState(prev => ({ ...prev, result: 'success', phase: 'completed' }));
        
        // Close browser
        try {
          await Browser.close();
          addLog('info', 'Browser closed');
        } catch (e) {
          addLog('warning', 'Browser close failed (might already be closed)');
        }
        
        cleanup();
      } else {
        addLog('info', 'No session found yet, continuing to wait...');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addLog('error', `Session check failed: ${message}`);
    }
  };

  const testDirectSupabaseOAuth = async () => {
    if (testState.isRunning) return;
    
    clearLogs();
    setTestState({ isRunning: true, phase: 'direct_supabase' });
    
    try {
      addLog('info', 'Testing Direct Supabase OAuth (Web Flow)');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) {
        throw new Error(`Direct OAuth failed: ${error.message}`);
      }

      addLog('success', 'Direct OAuth initiated successfully');
      // This will redirect the page, so we won't see further logs

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      addLog('error', `Direct OAuth failed: ${message}`);
      setTestState(prev => ({ ...prev, result: 'error', error: message }));
      cleanup();
    }
  };

  const getLevelColor = (level: TestLog['level']) => {
    switch (level) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getLevelIcon = (level: TestLog['level']) => {
    switch (level) {
      case 'success': return <CheckCircle2 className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'warning': return <Clock className="h-4 w-4" />;
      case 'info': return <RefreshCw className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/auth')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Auth
          </Button>
          <h1 className="text-2xl font-bold">OAuth Test Laboratory</h1>
        </div>

        {/* Platform Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {Capacitor.isNativePlatform() ? <Smartphone className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
              Platform Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Platform:</span>
              <Badge variant="secondary">{Capacitor.getPlatform()}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Is Native:</span>
              <Badge variant={Capacitor.isNativePlatform() ? "default" : "destructive"}>
                {Capacitor.isNativePlatform() ? 'Yes' : 'No'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>OAuth Tests</CardTitle>
            <CardDescription>
              Test different OAuth approaches to identify what works consistently
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={testCustomSchemeOAuth}
                disabled={testState.isRunning}
                className="h-auto p-4 flex flex-col items-start gap-2"
              >
                <div className="font-semibold">Custom Scheme Test</div>
                <div className="text-sm opacity-80">
                  Test com.fastnow.zenith:// deep linking
                </div>
              </Button>
              
              <Button
                onClick={testDirectSupabaseOAuth}
                disabled={testState.isRunning}
                variant="secondary"
                className="h-auto p-4 flex flex-col items-start gap-2"
              >
                <div className="font-semibold">Direct Supabase Test</div>
                <div className="text-sm opacity-80">
                  Test standard web OAuth flow
                </div>
              </Button>
            </div>

            {testState.isRunning && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Test in progress: {testState.phase}</span>
                </div>
                <Button
                  onClick={cleanup}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}

            {testState.result && (
              <div className={`p-3 rounded-lg ${testState.result === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2">
                  {testState.result === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={testState.result === 'success' ? 'text-green-800' : 'text-red-800'}>
                    Test {testState.result === 'success' ? 'Passed' : 'Failed'}
                    {testState.error && `: ${testState.error}`}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Test Logs</CardTitle>
            <Button
              onClick={clearLogs}
              variant="outline"
              size="sm"
            >
              Clear Logs
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-muted-foreground text-center py-8">
                  No logs yet. Start a test to see detailed logging.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm font-mono">
                    <span className="text-muted-foreground shrink-0">
                      {log.timestamp}
                    </span>
                    <div className={`${getLevelColor(log.level)} shrink-0`}>
                      {getLevelIcon(log.level)}
                    </div>
                    <div className="flex-1">
                      <span className={getLevelColor(log.level)}>{log.message}</span>
                      {log.data && (
                        <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                          {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}