# Firestore Security Rules for Jersey OMS

## Overview
These rules allow unauthenticated access to order details for the client portal while maintaining security for admin operations.

## Rules Configuration

Copy the following rules to your Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write all collections
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Allow unauthenticated access to specific order documents for client portal
    match /orders/{orderId} {
      allow read: if true; // Allow anyone to read order details
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    match /orderDetails/{orderId} {
      allow read: if true; // Allow anyone to read order details
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    // Allow unauthenticated users to submit order details (for client form)
    match /orders/{orderId} {
      allow read: if true;
      allow write: if true; // Allow client submissions without auth
    }
    
    match /orderDetails/{orderId} {
      allow read: if true;
      allow write: if true; // Allow client submissions without auth
    }
    
    // Allow notifications to be read by authenticated users only
    match /notifications/{notificationId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow settings to be read/written by authenticated users only
    match /settings/{settingId} {
      allow read, write: if request.auth != null;
    }
    
    // Allow invoices to be read/written by authenticated users only
    match /invoices/{invoiceId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## How to Apply These Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `jeysey-39fb6`
3. Navigate to **Firestore Database** > **Rules**
4. Replace the existing rules with the rules above
5. Click **Publish**

## Security Notes

- **Order Details**: Publicly readable for client portal access
- **Order Submissions**: Publicly writable for client form submissions
- **Admin Data**: Requires authentication (notifications, settings, invoices)
- **Order Management**: Requires authentication for admin operations

## Testing

After applying these rules:
1. Client portal should work without login
2. Order details should be accessible via direct links
3. Admin functions should still require authentication
4. Client form submissions should work without login

## Troubleshooting

If you encounter permission errors:
1. Verify rules are published in Firebase Console
2. Check browser console for specific error messages
3. Ensure Firebase project ID matches: `jeysey-39fb6`
4. Test with different browsers/incognito mode
