# Premium Feature Gating

Use the `AccessGate` component to wrap any UI that requires a premium subscription.
It handles access checks and upgrade prompts, so new features can share the same
gating logic.

## Basic Usage

```tsx
import { AccessGate } from '@/components/AccessGate';
import { Lock } from 'lucide-react';

<AccessGate feature="ai">
  {({ hasAccess, requestUpgrade }) =>
    hasAccess ? (
      <YourPremiumComponent />
    ) : (
      <button onClick={requestUpgrade} className="opacity-50">
        <Lock />
      </button>
    )
  }
</AccessGate>
```

`feature` accepts `"ai"`, `"food"`, or `"premium"` and determines which
subscription flag to check. The render prop receives:

- `hasAccess` – `true` when the user can use the feature
- `requestUpgrade` – call to show an upgrade prompt

Wrap future premium-only controls with `AccessGate` instead of creating new
`PremiumGated*` components.
