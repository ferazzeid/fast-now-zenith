import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Mic } from 'lucide-react';
import { checkVoiceCapabilities, checkMicrophonePermission } from '@/utils/voiceUtils';
import type { VoiceCapabilities } from '@/utils/voiceUtils';

interface DiagnosticResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export const VoiceDiagnostic: React.FC = () => {
  const [capabilities, setCapabilities] = useState<VoiceCapabilities | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const caps = checkVoiceCapabilities();
    setCapabilities(caps);

    const diagnosticResults: DiagnosticResult[] = [];

    // Check MediaRecorder support
    diagnosticResults.push({
      name: 'MediaRecorder Support',
      status: caps.hasMediaRecorder ? 'pass' : 'fail',
      message: caps.hasMediaRecorder 
        ? 'MediaRecorder is supported' 
        : 'MediaRecorder is not supported in this browser'
    });

    // Check getUserMedia support
    diagnosticResults.push({
      name: 'Microphone API Support',
      status: caps.hasGetUserMedia ? 'pass' : 'fail',
      message: caps.hasGetUserMedia 
        ? 'getUserMedia is supported' 
        : 'getUserMedia is not supported in this browser'
    });

    // Check supported MIME types
    diagnosticResults.push({
      name: 'Audio Format Support',
      status: caps.supportedMimeTypes.length > 0 ? 'pass' : 'warning',
      message: caps.supportedMimeTypes.length > 0 
        ? `${caps.supportedMimeTypes.length} audio formats supported: ${caps.supportedMimeTypes.slice(0, 2).join(', ')}${caps.supportedMimeTypes.length > 2 ? '...' : ''}` 
        : 'No specific audio formats detected, using browser default'
    });

    // Check microphone permission
    try {
      const permCheck = await checkMicrophonePermission();
      setPermissionStatus(permCheck.granted ? 'granted' : 'denied');
      diagnosticResults.push({
        name: 'Microphone Permission',
        status: permCheck.granted ? 'pass' : 'fail',
        message: permCheck.granted 
          ? 'Microphone permission is granted' 
          : permCheck.error || 'Microphone permission is denied'
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'Microphone Permission',
        status: 'fail',
        message: 'Could not check microphone permission'
      });
    }

    // Check HTTPS/secure context
    diagnosticResults.push({
      name: 'Secure Context',
      status: window.isSecureContext ? 'pass' : 'fail',
      message: window.isSecureContext 
        ? 'Running in secure context (HTTPS)' 
        : 'Not running in secure context - microphone access requires HTTPS'
    });

    setResults(diagnosticResults);
  };

  const testMicrophone = async () => {
    setIsTestingMic(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Test recording briefly
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        console.log('🎤 Test recording completed, blob size:', blob.size);
      };
      
      mediaRecorder.start();
      
      // Stop after 2 seconds
      setTimeout(() => {
        mediaRecorder.stop();
        stream.getTracks().forEach(track => track.stop());
        
        // Update results
        setResults(prev => [
          ...prev.filter(r => r.name !== 'Microphone Test'),
          {
            name: 'Microphone Test',
            status: 'pass',
            message: 'Microphone test completed successfully'
          }
        ]);
      }, 2000);
      
    } catch (error) {
      console.error('Microphone test failed:', error);
      setResults(prev => [
        ...prev.filter(r => r.name !== 'Microphone Test'),
        {
          name: 'Microphone Test',
          status: 'fail',
          message: `Microphone test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      ]);
    } finally {
      setIsTestingMic(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-green-500">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500">Warning</Badge>;
      default:
        return null;
    }
  };

  const overallStatus = results.every(r => r.status === 'pass') 
    ? 'pass' 
    : results.some(r => r.status === 'fail') 
      ? 'fail' 
      : 'warning';

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Voice Input Diagnostics</h3>
        <div className="flex items-center gap-2">
          {getStatusIcon(overallStatus)}
          {getStatusBadge(overallStatus)}
        </div>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => (
          <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
            <div className="flex items-start gap-3 flex-1">
              {getStatusIcon(result.status)}
              <div>
                <div className="font-medium text-sm">{result.name}</div>
                <div className="text-sm text-muted-foreground">{result.message}</div>
              </div>
            </div>
            {getStatusBadge(result.status)}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button onClick={runDiagnostics} variant="outline" size="sm">
          Run Diagnostics Again
        </Button>
        <Button 
          onClick={testMicrophone} 
          disabled={isTestingMic || !capabilities?.isSupported}
          size="sm"
        >
          <Mic className="h-4 w-4 mr-2" />
          {isTestingMic ? 'Testing...' : 'Test Microphone'}
        </Button>
      </div>

      {overallStatus === 'fail' && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-medium text-red-800 mb-2">Troubleshooting Tips:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• Make sure you're using a supported browser (Chrome, Firefox, Safari)</li>
            <li>• Ensure the site is loaded over HTTPS</li>
            <li>• Check that your microphone is connected and working</li>
            <li>• Grant microphone permissions when prompted</li>
            <li>• Close other applications that might be using your microphone</li>
            <li>• Try refreshing the page and allowing permissions again</li>
          </ul>
        </div>
      )}
    </Card>
  );
};

