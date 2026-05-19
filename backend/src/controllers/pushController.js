const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

exports.getPublicKey = (req, res) => {
  res.json({ success: true, data: { publicKey: process.env.VAPID_PUBLIC_KEY } });
};

exports.subscribe = async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, message: 'Suscripción inválida' });
    }

    const existing = await PushSubscription.findOne({ where: { endpoint } });
    if (existing) {
      await existing.update({ user_id: req.userId, p256dh: keys.p256dh, auth: keys.auth });
    } else {
      await PushSubscription.create({
        user_id: req.userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });
    }

    res.status(201).json({ success: true, message: 'Suscripción guardada' });
  } catch (err) {
    next(err);
  }
};

exports.unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.destroy({ where: { user_id: req.userId, endpoint } });
    res.json({ success: true, message: 'Suscripción eliminada' });
  } catch (err) {
    next(err);
  }
};
