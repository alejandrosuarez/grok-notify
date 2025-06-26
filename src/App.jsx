import React, { useEffect, useState } from 'react';
import axios from 'axios';

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error: error.message };
  }
  render() {
    if (this.state.error) {
      return <div className="text-red-500 p-4">Error: {this.state.error}</div>;
    }
    return this.props.children;
  }
}

const websites = [
  { name: 'Website A', appId: process.env.REACT_APP_ONESIGNAL_WEBSITE_A_APP_ID || 'missing-a-app-id' },
  { name: 'Website B', appId: process.env.REACT_APP_ONESIGNAL_WEBSITE_B_APP_ID || 'missing-b-app-id' },
];

const App = () => {
  const [selectedWebsite, setSelectedWebsite] = useState(websites[0]?.name || '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!process.env.REACT_APP_ONESIGNAL_DEFAULT_APP_ID || !process.env.REACT_APP_ONESIGNAL_SAFARI_WEB_ID) {
      setError('Missing OneSignal configuration (App ID or Safari Web ID). Check Vercel environment variables.');
      return;
    }
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    OneSignalDeferred.push(function(OneSignal) {
      OneSignal.init({
        appId: process.env.REACT_APP_ONESIGNAL_DEFAULT_APP_ID,
        safari_web_id: process.env.REACT_APP_ONESIGNAL_SAFARI_WEB_ID,
        autoResubscribe: true,
        notifyButton: { enable: true },
      }).catch(error => {
        console.error('OneSignal initialization failed:', error);
        setError('OneSignal initialization failed: ' + error.message);
      });
      OneSignal.User.addTag('website', selectedWebsite || window.location.hostname).catch(error => {
        console.error('OneSignal tagging failed:', error);
        setError('OneSignal tagging failed: ' + error.message);
      });
    });
    // Check manifest availability
    fetch('/manifest.json')
      .then(response => {
        if (!response.ok) throw new Error('Failed to load manifest.json');
        return response.json();
      })
      .catch(error => {
        console.error('Manifest error:', error);
        setError('Failed to load manifest.json: ' + error.message);
      });
  }, [selectedWebsite]);

  const createSegment = async () => {
    const website = websites.find((w) => w.name === selectedWebsite);
    if (website) {
      try {
        await axios.post('/api/notifications', {
          action: 'create_segment',
          websiteName: website.name,
          appId: website.appId,
        });
        alert('Segment created!');
      } catch (error) {
        alert('Error creating segment: ' + error.message);
        setError('Error creating segment: ' + error.message);
      }
    }
  };

  const sendNotification = async () => {
    const website = websites.find((w) => w.name === selectedWebsite);
    if (website) {
      try {
        await axios.post('/api/notifications', {
          action: 'send_notification',
          appId: website.appId,
          websiteName: website.name,
          title,
          message,
        });
        alert('Notification sent!');
      } catch (error) {
        alert('Error sending notification: ' + error.message);
        setError('Error sending notification: ' + error.message);
      }
    }
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4">
        {error && <div className="text-red-500 mb-4">Error: {error}</div>}
        <h1 className="text-2xl font-bold mb-4">Push Notification Manager</h1>
        <div className="mb-4">
          <label className="block mb-2">Select Website:</label>
          <select
            className="border p-2 w-full"
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
            className="mt-2 bg-blue-500 text-white p-2 rounded"
            onClick={createSegment}
          >
            Create Segment
          </button>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Send Test Notification</h2>
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
    </ErrorBoundary>
  );
};

export default App;