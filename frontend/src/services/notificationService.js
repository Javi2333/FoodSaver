// ── Servicio de notificaciones del navegador ──────────────────────
// Registra el SW, gestiona permisos y suscripción Web Push

import { subscribeWebPush } from './pushService';

const SW_PATH = '/sw.js';

/**
 * Registra el service worker. Devuelve el registration o null si no soportado.
 */
export const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register(SW_PATH);
    return registration;
  } catch (err) {
    console.warn('[FoodSaver SW] Error al registrar:', err);
    return null;
  }
};

/**
 * Solicita permiso de notificaciones al usuario.
 * Devuelve true si se concede.
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

/**
 * Muestra una notificación del navegador con el SW si está disponible,
 * o con la API Notification directamente como fallback.
 */
const showNotification = async (title, body, url = '/notifications') => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, {
      body,
      icon: '/images/logo.png',
      badge: '/favicon.ico',
      image: '/images/logo.png',
      tag: 'foodsaver-expiry',
      data: { url },
      vibrate: [200, 100, 200],
    });
  } else {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
};

/**
 * Convierte una clave VAPID base64url a Uint8Array para PushManager.subscribe
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

/**
 * Suscribe el navegador a Web Push y envía la suscripción al backend.
 * Solo actúa si el permiso está concedido y el SW está activo.
 */
export const subscribeToWebPush = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      // Ya suscrito; reenviar al backend por si no se guardó
      await subscribeWebPush(existing.toJSON()).catch(() => {});
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    await subscribeWebPush(subscription.toJSON());
  } catch (err) {
    console.warn('[FoodSaver Push] Error al suscribirse:', err.message);
  }
};

/**
 * Comprueba los productos del usuario y dispara notificaciones
 * si hay productos caducados o próximos a caducar.
 *
 * @param {Array} products - lista de productos del usuario
 */
export const checkAndNotifyExpiring = async (products) => {
  const granted = await requestNotificationPermission();
  if (!granted) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expired = [];
  const expiringSoon = [];

  products.forEach(p => {
    if (!p.expiration_date) return;
    const exp = new Date(p.expiration_date);
    exp.setHours(0, 0, 0, 0);
    const diff = Math.round((exp - today) / (1000 * 60 * 60 * 24));

    if (diff < 0) expired.push(p.name);
    else if (diff <= 3) expiringSoon.push({ name: p.name, days: diff });
  });

  if (expired.length > 0) {
    const body =
      expired.length === 1
        ? `${expired[0]} ha caducado.`
        : `${expired.length} productos han caducado: ${expired.slice(0, 3).join(', ')}${expired.length > 3 ? '...' : ''}`;
    await showNotification('⚠️ Productos caducados', body);
  }

  if (expiringSoon.length > 0) {
    const hoy = expiringSoon.filter(p => p.days === 0);
    const proximos = expiringSoon.filter(p => p.days > 0);

    if (hoy.length > 0) {
      const names = hoy.map(p => p.name).join(', ');
      await showNotification('🕐 Caduca hoy', `${names} caduca${hoy.length > 1 ? 'n' : ''} hoy.`);
    }
    if (proximos.length > 0) {
      const first = proximos[0];
      const body =
        proximos.length === 1
          ? `${first.name} caduca en ${first.days} día${first.days > 1 ? 's' : ''}.`
          : `${proximos.length} productos caducan en los próximos 3 días.`;
      await showNotification('⏰ Próximos a caducar', body);
    }
  }
};
