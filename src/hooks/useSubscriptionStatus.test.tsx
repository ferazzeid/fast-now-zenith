import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect } from 'vitest';
import { useSubscriptionStatus } from './useSubscriptionStatus';
import { useAccess } from '@/hooks/useAccess';

vi.mock('@/hooks/useAccess');
const mockUseAccess = useAccess as unknown as ReturnType<typeof vi.fn>;

describe('useSubscriptionStatus', () => {
  it('returns admin status info', () => {
    mockUseAccess.mockReturnValue({
      hasPremiumFeatures: true,
      access_level: 'admin',
      isTrial: false,
      daysRemaining: null,
      openCustomerPortal: vi.fn(),
    });
    const { result } = renderHook(() => useSubscriptionStatus());
    expect(result.current.statusInfo).toEqual({
      status: 'Admin Account',
      description: 'Full access to all features',
      variant: 'default',
      showBilling: false,
    });
  });

  it('returns premium status info', () => {
    mockUseAccess.mockReturnValue({
      hasPremiumFeatures: true,
      access_level: 'premium',
      isTrial: false,
      daysRemaining: null,
      openCustomerPortal: vi.fn(),
    });
    const { result } = renderHook(() => useSubscriptionStatus());
    expect(result.current.statusInfo).toEqual({
      status: 'Active Subscription',
      description: 'Premium features enabled',
      variant: 'default',
      showBilling: true,
    });
  });

  it('returns trial status info', () => {
    mockUseAccess.mockReturnValue({
      hasPremiumFeatures: true,
      access_level: 'trial',
      isTrial: true,
      daysRemaining: 5,
      openCustomerPortal: vi.fn(),
    });
    const { result } = renderHook(() => useSubscriptionStatus());
    expect(result.current.statusInfo).toEqual({
      status: 'Free Trial',
      description: '5 days remaining',
      variant: 'secondary',
      showBilling: true,
    });
  });

  it('returns free status info', () => {
    mockUseAccess.mockReturnValue({
      hasPremiumFeatures: false,
      access_level: 'free',
      isTrial: false,
      daysRemaining: null,
      openCustomerPortal: vi.fn(),
    });
    const { result } = renderHook(() => useSubscriptionStatus());
    expect(result.current.statusInfo).toEqual({
      status: 'Free Account',
      description: 'Limited features available',
      variant: 'outline',
      showBilling: false,
    });
  });
});
