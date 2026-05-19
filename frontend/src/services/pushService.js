import api from './api';

export const subscribeWebPush = (subscription) =>
  api.post('/push/subscribe', subscription);

export const unsubscribeWebPush = (endpoint) =>
  api.post('/push/unsubscribe', { endpoint });
