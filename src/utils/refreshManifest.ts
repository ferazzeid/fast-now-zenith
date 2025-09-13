import { forceManifestRefresh } from './forceManifestRefresh';

export const refreshManifest = async () => {
  try {
    // Use the new focused manifest refresh
    const success = await forceManifestRefresh();
    if (success) {
      console.log('PWA manifest and cache refreshed successfully');
    } else {
      console.warn('PWA refresh completed with some issues');
    }
    return success;
  } catch (error) {
    console.error('Failed to refresh PWA manifest:', error);
    return false;
  }
};
