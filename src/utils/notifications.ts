import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const setupNotifications = async (intervalMinutes: number) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('Notifications are only supported on native platforms.');
    return;
  }

  try {
    const permStatus = await LocalNotifications.requestPermissions();
    if (permStatus.display !== 'granted') return;

    if (Capacitor.getPlatform() === 'android') {
      await LocalNotifications.createChannel({
        id: 'high_priority',
        name: 'High Priority Notifications',
        description: 'Notifications for hard card reviews',
        importance: 5,
        visibility: 1,
        vibration: true,
      });
    }

    // Cancel existing notifications
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    if (intervalMinutes === 0) return;

    const savedHard = localStorage.getItem('minna_hard');
    const allHardCards: any[] = [];
    
    if (savedHard) {
      const hardCardsRecord = JSON.parse(savedHard);
      Object.values(hardCardsRecord).forEach((cards: any) => {
        if (Array.isArray(cards)) {
          allHardCards.push(...cards);
        }
      });
    }

    // Only schedule if there are hard cards
    if (allHardCards.length === 0) return;

    const notifications = [];
    const now = new Date().getTime();

    // Schedule up to 60 notifications (Capacitor iOS limit is 64)
    for (let i = 1; i <= 60; i++) {
      const randomCard = allHardCards[Math.floor(Math.random() * allHardCards.length)];
      
      const title = 'Review Time! 🎓';
      
      const bodyParts = [];
      if (randomCard.japanese) {
        bodyParts.push(randomCard.japanese);
      }
      if (randomCard.nepali) {
        bodyParts.push(randomCard.nepali);
      }
      if (randomCard.english) {
        bodyParts.push(randomCard.english);
      }
      
      const body = bodyParts.join('\n');
      
      notifications.push({
        id: i,
        title: title,
        body: body,
        schedule: { 
          at: new Date(now + i * intervalMinutes * 60 * 1000),
          allowWhileIdle: true 
        },
        channelId: 'high_priority',
      });
    }

    await LocalNotifications.schedule({ notifications });
  } catch (e) {
    console.error('Error setting up notifications:', e);
  }
};

export const sendTestNotification = async () => {
  if (!Capacitor.isNativePlatform()) {
    alert('Notifications are only supported on native mobile apps (Android/iOS).');
    return;
  }

  try {
    const permStatus = await LocalNotifications.requestPermissions();
    if (permStatus.display !== 'granted') {
      alert('Notification permission not granted.');
      return;
    }

    if (Capacitor.getPlatform() === 'android') {
      await LocalNotifications.createChannel({
        id: 'high_priority',
        name: 'High Priority Notifications',
        description: 'Notifications for hard card reviews',
        importance: 5,
        visibility: 1,
        vibration: true,
      });
    }
    
    await LocalNotifications.schedule({
      notifications: [{
        id: 999,
        title: 'Review Time! 🎓',
        body: 'じょせい\nमहिला / नारी\nfemale, woman',
        schedule: { 
          at: new Date(new Date().getTime() + 2000),
          allowWhileIdle: true
        }, // 2 seconds from now
        channelId: 'high_priority',
      }]
    });
  } catch (e) {
    console.error('Error sending test notification:', e);
    alert('Error sending notification: ' + (e as Error).message);
  }
};
