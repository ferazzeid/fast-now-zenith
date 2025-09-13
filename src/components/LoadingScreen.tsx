import { LoadingSpinner } from './LoadingSpinner';

export const LoadingScreen = ({ message }: { message?: string } = {}) => {
  return <LoadingSpinner text={message} />;
};