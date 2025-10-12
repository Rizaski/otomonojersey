# Firebase Authentication Troubleshooting Guide

## 🚨 Common Deployment Authentication Issues

### 1. **Firebase SDK Not Loading**
**Symptoms:** Console shows "Firebase SDK not detected"
**Solutions:**
- Check Firebase CDN links are accessible
- Verify network connectivity to `gstatic.com`
- Ensure HTTPS is used in production
- Check Content Security Policy (CSP) headers

### 2. **CORS Policy Errors**
**Symptoms:** Network requests blocked by CORS policy
**Solutions:**
- Add your domain to Firebase Console > Authentication > Settings > Authorized domains
- Check Firebase project configuration matches deployed domain
- Verify `authDomain` in Firebase config

### 3. **Authentication Timeout**
**Symptoms:** Login attempts timeout after 30 seconds
**Solutions:**
- Check network connectivity
- Verify Firebase project is active
- Check for firewall/proxy blocking Firebase APIs
- Test with different browsers/incognito mode

### 4. **Invalid Credentials Error**
**Symptoms:** "Invalid credentials" even with correct email/password
**Solutions:**
- Verify user exists in Firebase Console > Authentication > Users
- Check if user account is disabled
- Verify email format is correct
- Check for typos in email/password

### 5. **Firebase Services Not Available**
**Symptoms:** "Authentication service unavailable"
**Solutions:**
- Check Firebase initialization in console
- Verify `firebase-bootstrap.js` is loading
- Check for JavaScript errors preventing initialization
- Ensure Firebase project is not suspended

## 🔧 Debugging Steps

### Step 1: Enable Debug Mode
```javascript
// In browser console
localStorage.setItem('authDebug', 'true');
// Refresh page and check console for detailed logs
```

### Step 2: Use Debug Tool
1. Go to login page
2. Click "🔧 Debug Authentication" button
3. Review diagnosis results
4. Export logs for analysis

### Step 3: Check Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `jeysey-39fb6`
3. Check Authentication > Users for user accounts
4. Check Authentication > Settings > Authorized domains
5. Check Firestore > Rules for permission issues

### Step 4: Test Network Connectivity
```javascript
// Test Firebase API connectivity
fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=test')
  .then(response => console.log('Firebase API accessible:', response.status))
  .catch(error => console.error('Firebase API error:', error));
```

## 🛠️ Quick Fixes

### Fix 1: Update Authorized Domains
1. Firebase Console > Authentication > Settings
2. Add your deployed domain to "Authorized domains"
3. Remove any test domains if needed

### Fix 2: Check Firebase Configuration
```javascript
// Verify Firebase config in browser console
console.log('Firebase Config:', window.firebaseServices?.app?.options);
```

### Fix 3: Clear Browser Data
- Clear localStorage: `localStorage.clear()`
- Clear cookies for your domain
- Try incognito/private browsing mode

### Fix 4: Check Service Worker
```javascript
// Check if service worker is interfering
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Firebase project is active and not suspended
- [ ] Authorized domains include production domain
- [ ] Firebase rules allow authentication
- [ ] SSL certificate is valid
- [ ] Firebase SDK CDN links are accessible

### Post-Deployment
- [ ] Test login with valid credentials
- [ ] Check browser console for errors
- [ ] Verify Firebase services initialize
- [ ] Test on different browsers/devices
- [ ] Check network requests in DevTools

## 🚨 Emergency Recovery

### If Authentication Completely Fails
1. **Immediate Fix:**
   ```javascript
   // Disable authentication temporarily
   localStorage.setItem('bypassAuth', 'true');
   ```

2. **Create Test User:**
   - Firebase Console > Authentication > Users
   - Add user manually with email/password
   - Test login with new credentials

3. **Rollback:**
   - Revert to previous working version
   - Check git history for authentication changes
   - Deploy previous commit

## 📞 Support Resources

### Firebase Support
- [Firebase Documentation](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Status Page](https://status.firebase.google.com/)

### Debug Tools
- Browser DevTools > Network tab
- Browser DevTools > Console tab
- Firebase Debugger (built into login page)

### Log Analysis
```javascript
// Export authentication logs
if (window.AuthDebugger) {
  const debugger = new window.AuthDebugger();
  debugger.exportLogs();
}
```

## 🔍 Error Code Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `auth/user-not-found` | No account with this email | Create user account |
| `auth/wrong-password` | Incorrect password | Check password |
| `auth/invalid-email` | Invalid email format | Verify email format |
| `auth/user-disabled` | Account disabled | Contact admin |
| `auth/too-many-requests` | Rate limited | Wait and retry |
| `auth/network-request-failed` | Network error | Check connection |
| `auth/invalid-credential` | Invalid credentials | Verify email/password |

---

**⚠️ Important:** Always test authentication fixes in a staging environment before deploying to production.
