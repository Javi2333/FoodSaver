const cron = require('node-cron');
const webpush = require('web-push');
const { Op } = require('sequelize');
const PushSubscription = require('../models/PushSubscription');
const Product = require('../models/Product');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

const sendExpiryNotifications = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);

    const products = await Product.findAll({
      where: {
        status: 'active',
        expiration_date: {
          [Op.between]: [
            today.toISOString().split('T')[0],
            in3Days.toISOString().split('T')[0],
          ],
        },
      },
      attributes: ['user_id', 'name', 'expiration_date'],
    });

    if (products.length === 0) return;

    // Agrupar por usuario
    const byUser = {};
    products.forEach(p => {
      if (!byUser[p.user_id]) byUser[p.user_id] = [];
      byUser[p.user_id].push(p);
    });

    for (const [userId, userProducts] of Object.entries(byUser)) {
      const subscriptions = await PushSubscription.findAll({ where: { user_id: userId } });
      if (subscriptions.length === 0) continue;

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const labels = userProducts.map(p => {
        const exp = new Date(p.expiration_date);
        exp.setHours(0, 0, 0, 0);
        const diff = Math.round((exp - now) / (1000 * 60 * 60 * 24));
        return diff === 0 ? `${p.name} (caduca hoy)` : `${p.name} (${diff} día${diff !== 1 ? 's' : ''})`;
      });

      const payload = JSON.stringify({
        title: '⏰ FoodSaver — Productos próximos a caducar',
        body: labels.join(', '),
        url: '/notifications',
        tag: 'expiry-alert',
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          );
        } catch (err) {
          // Suscripción expirada o inválida → eliminar
          if (err.statusCode === 410 || err.statusCode === 404) {
            await sub.destroy();
          }
        }
      }
    }
  } catch (err) {
    console.error('[PushCron] Error:', err.message);
  }
};

const startPushCron = () => {
  // Ejecutar cada día a las 9:00
  cron.schedule('0 9 * * *', sendExpiryNotifications);
  console.log('✅ Cron de notificaciones push iniciado (diario a las 9:00)');
};

module.exports = { startPushCron };
