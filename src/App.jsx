import React, { useEffect, useState } from 'react';
import axios from 'axios';

const websites = [
  { name: 'Website A', appId: process.env.REACT_APP_ONESIGNAL_WEBSITE_A_APP_ID || 'missing-a-app-id' },
  { name: 'Website B', appId: process.env.REACT_APP_ONESIGNAL_WEBSITE_B_APP_ID || 'missing-b-app-id' },
];

const App = () => {
  const [selectedWebsite, setSelectedWebsite] = useState(websites[0]?.name || '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [subscribers, setSubscribers] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState(null);
  const [isOneSignalLoaded, setIsOneSignalLoaded] = useState(false);

  useEffect(() => {
    if (!process.env.REACT_APP_ONESIGNAL_DEFAULT_APP_ID) {
      setError('Missing OneSignal App ID. Check Vercel environment variables.');
      console.error('Missing REACT_APP_ONESIGNAL_DEFAULT_APP_ID');
      return;
    }

    // Initialize OneSignal only once
    if (!window.OneSignalDeferred) {
      window.OneSignalDeferred = [];
      const initializeOneSignal = async (OneSignal) => {
        try {
          console.log('Starting OneSignal initialization with appId:', process.env.REACT_APP_ONESIGNAL_DEFAULT_APP_ID);

          // Pre-register service worker
          if ('serviceWorker' in navigator) {
            console.log('Pre-registering service worker: /OneSignalSDKWorker.js');
            try {
              const registration = await navigator.serviceWorker.register('/OneSignalSDKWorker.js', { scope: '/' });
              console.log('Service worker registered successfully:', registration);
            } catch (swError) {
              console.error('Service worker registration failed:', swError);
              throw new Error(`Service worker registration failed: ${swError.message}`);
            }
          } else {
            console.warn('Service workers not supported in this browser');
            setError('Service workers not supported in this browser.');
            return;
          }

          await OneSignal.init({
            appId: process.env.REACT_APP_ONESIGNAL_DEFAULT_APP_ID,
            safari_web_id: process.env.REACT_APP_ONESIGNAL_SAFARI_WEB_ID || '',
            autoResubscribe: true,
            notifyButton: { enable: true },
            serviceWorkerParam: { scope: '/' },
            serviceWorkerPath: 'OneSignalSDKWorker.js',
            serviceWorkerUpdaterPath: 'OneSignalSDKWorker.js',
          });
          console.log('OneSignal.init called with serviceWorkerPath: OneSignalSDKWorker.js');
          // Wait for initialization
          await new Promise((resolve) => setTimeout(resolve, 3000));
          if (!window.OneSignal) {
            throw new Error('OneSignal SDK failed to load properly.');
          }
          console.log('OneSignal SDK loaded:', window.OneSignal);
          setIsOneSignalLoaded(true);
          const isPushSupported = OneSignal.Notifications.isPushSupported();
          console.log('Push notifications supported:', isPushSupported);
          if (!isPushSupported) {
            setError('Push notifications not supported in this browser.');
            return;
          }
          const permission = OneSignal.Notifications.permission;
          console.log('Notification permission:', permission);
          setIsSubscribed(permission === 'granted');
        } catch (error) {
          console.error('OneSignal initialization error:', error);
          setError('OneSignal initialization failed: ' + error.message);
        }
      };
      window.OneSignalDeferred.push(initializeOneSignal);
      console.log('Pushed initializeOneSignal to OneSignalDeferred');
    }

    // Update tag when selectedWebsite changes
    if (isOneSignalLoaded && window.OneSignal) {
      window.OneSignal.User.addTag('website', selectedWebsite || window.location.hostname).catch((error) => {
        console.error('Failed to set website tag:', error);
        setError('Failed to set website tag: ' + error.message);
      });
    }
  }, [selectedWebsite, isOneSignalLoaded]);

  const handleSubscribe = async () => {
    if (!isOneSignalLoaded || !window.OneSignal) {
      setError('OneSignal SDK not loaded. Please try again later or check your network.');
      console.error('handleSubscribe: OneSignal not loaded');
      return;
    }
    try {
      const OneSignal = window.OneSignal;
      if (!OneSignal.Notifications) {
        setError('OneSignal Notifications API not available. SDK may have failed to initialize.');
        console.error('handleSubscribe: Notifications API unavailable');
        return;
      }
      console.log('Requesting notification permission');
      await OneSignal.Notifications.requestPermission();
      const permission = OneSignal.Notifications.permission;
      console.log('Permission after request:', permission);
      setIsSubscribed(permission === 'granted');
      if (permission === 'granted') {
        await OneSignal.User.addTag('website', selectedWebsite);
        console.log('Added website tag:', selectedWebsite);
        alert('Subscribed successfully!');
      }
    } catch (error) {
      console.error('Subscription failed:', error);
      setError('Subscription failed: ' + error.message);
    }
  };

  const createSegment = async () => {
    const website = websites.find((w) => w.name === selectedWebsite);
    if (website) {
      try {
        console.log('Creating segment for:', website.name);
        await axios.post('/api/notifications', {
          action: 'create_segment',
          websiteName: website.name,
          appId: website.appId,
        });
        alert('Segment created!');
      } catch (error) {
        console.error('Create segment failed:', error);
        setError('Error creating segment: ' + error.message);
      }
    }
  };

  const fetchSubscribers = async () => {
    const website = websites.find((w) => w.name === selectedWebsite);
    if (website) {
      try {
        console.log('Fetching subscribers for appId:', website.appId);
        const response = await axios.post('/api/notifications', {
          action: 'fetch_subscribers',
          appId: website.appId,
        });
        setSubscribers(response.data.users || []);
      } catch (error) {
        console.error('Fetch subscribers failed:', error);
        setError('Error fetching subscribers: ' + error.message);
      }
    }
  };

  const sendNotification = async () => {
    const website = websites.find((w) => w.name === selectedWebsite);
    if (website) {
      try {
        console.log('Sending notification for:', website.name, { title, message });
        await axios.post('/api/notifications', {
          action: 'send_notification',
          appId: website.appId,
          websiteName: website.name,
          title,
          message,
        });
        alert('Notification sent!');
      } catch (error) {
        console.error('Send notification failed:', error);
        setError('Error sending notification: ' + error.message);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      <h1 className="text-2xl font-bold mb-4">Push Notification Manager Playground</h1>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Subscription</h2>
        <p className="mb-2">
          Status: {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
        </p>
        <button
          className="bg-purple-500 text-white p-2 rounded"
          onClick={handleSubscribe}
          disabled={isSubscribed || !isOneSignalLoaded}
        >
          {isSubscribed ? 'Subscribed' : isOneSignalLoaded ? 'Subscribe to Notifications' : 'Loading OneSignal...'}
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Manage Segments</h2>
        <label className="block mb-2">Select Website:</label>
        <select
          className="border p-2 w-full mb-2"
          value={selectedWebsite}
          onChange={(e) => setSelectedWebsite(e.target.value)}
        >
          {websites.map((website) => (
            <option key={website.appId} value={website.name}>
              {website.name}
            </option>
          ))}
        </select>
        <button
          className="bg-blue-500 text-white p-2 rounded"
          onClick={createSegment}
        >
          Create Segment
        </button>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Subscribers</h2>
        <button
          className="bg-gray-500 text-white p-2 rounded mb-2"
          onClick={fetchSubscribers}
        >
          Fetch Subscribers
        </button>
        {subscribers.length > 0 ? (
          <ul className="border p-2">
            {subscribers.map((subscriber) => (
              <li key={subscriber.id} className="py-1">
                ID: {subscriber.id} (Subscribed: {subscriber.subscription_status})
              </li>
            ))}
          </ul>
        ) : (
          <p>No subscribers found.</p>
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Send Test Notification</h2>
        <input
          type="text"
          placeholder="Title"
          className="border p-2 w-full mb-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Message"
          className="border p-2 w-full mb-2"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          className="bg-green-500 text-white p-2 rounded"
          onClick={sendNotification}
        >
          Send Notification
        </button>
      </div>
    </div>
  );
};

export default App;