const axios = require('axios');

const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
const ONESIGNAL_API_URL = 'https://api.onesignal.com';

module.exports = async (req, res) => {
  const { action, websiteName, appId, title, message } = req.body;

  if (!ONESIGNAL_API_KEY) {
    return res.status(500).json({ error: 'OneSignal API key not configured' });
  }

  if (action === 'create_segment') {
    try {
      const response = await axios.post(
        `${ONESIGNAL_API_URL}/apps/${appId}/segments`,
        {
          name: websiteName,
          filters: [{ field: 'tag', key: 'website', relation: '=', value: websiteName }],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
          },
        }
      );
      res.status(200).json(response.data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (action === 'send_notification') {
    try {
      const response = await axios.post(
        `${ONESIGNAL_API_URL}/notifications`,
        {
          app_id: appId,
          included_segments: [websiteName],
          headings: { en: title },
          contents: { en: message },
          target_channel: 'push',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
          },
        }
      );
      res.status(200).json(response.data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (action === 'fetch_subscribers') {
    try {
      const response = await axios.get(
        `${ONESIGNAL_API_URL}/apps/${appId}/users`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
          },
        }
      );
      res.status(200).json({ users: response.data.users || [] });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(400).json({ error: 'Invalid action' });
  }
};