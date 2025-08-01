import { EnhancedLoadingScreen } from './enhanced/SmartLoadingStates';

export const LoadingScreen = ({ message }: { message?: string } = {}) => {
  return <EnhancedLoadingScreen message={message} />;
};