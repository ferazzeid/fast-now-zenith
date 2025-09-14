import { useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  data: any;
}

/**
 * Standardized loading hook to replace manual useState loading patterns
 * Provides consistent loading states, error handling, and async action management
 */
export const useStandardizedLoading = <T = any>(initialData?: T) => {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    data: initialData || null
  });

  const execute = useCallback(async <R = T>(
    asyncFn: () => Promise<R>,
    options?: {
      onSuccess?: (data: R) => void;
      onError?: (error: Error) => void;
      resetError?: boolean;
    }
  ) => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: options?.resetError !== false ? null : prev.error 
    }));

    try {
      const result = await asyncFn();
      setState({ isLoading: false, error: null, data: result });
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }
      
      return { success: true, data: result, error: null };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorObj 
      }));
      
      if (options?.onError) {
        options.onError(errorObj);
      }
      
      return { success: false, data: null, error: errorObj };
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: initialData || null
    });
  }, [initialData]);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  const setError = useCallback((error: Error | string) => {
    const errorObj = error instanceof Error ? error : new Error(error);
    setState(prev => ({ ...prev, error: errorObj, isLoading: false }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
    // Convenience computed properties
    hasError: !!state.error,
    hasData: state.data !== null && state.data !== undefined,
    isIdle: !state.isLoading && !state.error,
  };
};

/**
 * Specialized loading hook for upload operations
 */
export const useUploadLoading = () => {
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'uploaded' | 'analyzing' | 'analyzed' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const startUpload = useCallback(() => {
    setUploadState('uploading');
    setProgress(0);
    setError(null);
  }, []);

  const startAnalysis = useCallback(() => {
    setUploadState('analyzing');
    setProgress(100);
  }, []);

  const completeUpload = useCallback(() => {
    setUploadState('uploaded');
    setProgress(100);
  }, []);

  const completeAnalysis = useCallback(() => {
    setUploadState('analyzed');
    setProgress(100);
  }, []);

  const setUploadError = useCallback((errorMessage: string) => {
    setUploadState('error');
    setError(errorMessage);
  }, []);

  const reset = useCallback(() => {
    setUploadState('idle');
    setProgress(0);
    setError(null);
  }, []);

  const updateProgress = useCallback((newProgress: number) => {
    setProgress(Math.max(0, Math.min(100, newProgress)));
  }, []);

  return {
    uploadState,
    progress,
    error,
    isUploading: uploadState === 'uploading',
    isAnalyzing: uploadState === 'analyzing',
    isComplete: uploadState === 'uploaded' || uploadState === 'analyzed',
    hasError: uploadState === 'error',
    isIdle: uploadState === 'idle',
    startUpload,
    startAnalysis,
    completeUpload,
    completeAnalysis,
    setUploadError,
    updateProgress,
    reset,
  };
};