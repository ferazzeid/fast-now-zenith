// Utility functions for admin settings stored in localStorage

export const getPhotoWorkflowUseConfirmation = (): boolean => {
  const stored = localStorage.getItem('admin_photo_workflow_confirmation');
  return stored !== null ? stored === 'true' : true; // Default to confirmation mode
};