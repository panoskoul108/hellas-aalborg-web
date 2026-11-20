'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  saveAdminPushSubscription,
  removeAdminPushSubscription,
} from '@/app/actions/storeActions';

export type PushStatus = 'checking' | 'enabled' | 'disabled' | 'unsupported';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useAdminPush() {
  const [pushStatus, setPushStatus] = useState<PushStatus>('checking');
  const [pushLoading, setPushLoading] = useState(false);

  // Δυναμικό admin manifest όσο είμαστε στο /admin
  useEffect(() => {
    const existingLink = document.querySelector('link[rel="manifest"]');
    const prevHref = existingLink?.getAttribute('href') || '/manifest.json';

    if (existingLink) {
      existingLink.setAttribute('href', '/admin-manifest.json');
    } else {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/admin-manifest.json';
      document.head.appendChild(link);
    }

    return () => {
      const currentLink = document.querySelector('link[rel="manifest"]');
      if (currentLink) {
        currentLink.setAttribute('href', prevHref);
      }
    };
  }, []);

  const checkPushSubscription = useCallback(async () => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !('Notification' in window)
    ) {
      setPushStatus('unsupported');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const sub = await reg.pushManager.getSubscription();
      if (sub && Notification.permission === 'granted') {
        setPushStatus('enabled');
      } else {
        setPushStatus('disabled');
      }
    } catch (err) {
      console.error('Push check error:', err);
      setPushStatus('disabled');
    }
  }, []);

  useEffect(() => {
    checkPushSubscription();
  }, [checkPushSubscription]);

  const handleTogglePushNotifications = async () => {
    if (pushStatus === 'unsupported') {
      alert('Αυτός ο browser δεν υποστηρίζει Web Push Notifications. Χρησιμοποίησε Chrome / Edge / PWA.');
      return;
    }

    setPushLoading(true);
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const existingSub = await reg.pushManager.getSubscription();

      if (pushStatus === 'enabled' && existingSub) {
        const endpoint = existingSub.endpoint;
        await existingSub.unsubscribe();
        await removeAdminPushSubscription(endpoint);
        setPushStatus('disabled');
        alert('Οι Push ειδοποιήσεις απενεργοποιήθηκαν σε αυτή τη συσκευή.');
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        alert('Λείπει το NEXT_PUBLIC_VAPID_PUBLIC_KEY από τις μεταβλητές περιβάλλοντος στο Vercel (και κάνε Redeploy).');
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushStatus('disabled');
        alert('Δεν δόθηκε άδεια ειδοποιήσεων. Ενεργοποίησέ τις από τις ρυθμίσεις του browser/κινητού.');
        return;
      }

      const subscription =
        existingSub ||
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error('Μη έγκυρα δεδομένα Push Subscription.');
      }

      await saveAdminPushSubscription(
        {
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          },
        },
        'Hellas Shop Mobile'
      );

      setPushStatus('enabled');
      alert('Επιτυχία! Το κινητό του μαγαζιού θα λαμβάνει Push ειδοποιήσεις για νέες παραγγελίες.');
    } catch (error: any) {
      console.error('Push toggle error:', error);
      alert('Σφάλμα Push: ' + (error?.message || 'Άγνωστο σφάλμα'));
    } finally {
      setPushLoading(false);
    }
  };

  return {
    pushStatus,
    pushLoading,
    handleTogglePushNotifications,
  };
}
