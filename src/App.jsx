import React, { useState } from 'react';

const App = () => {
  const [selectedWebsite, setSelectedWebsite] = useState('Website A');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Push Notification Manager</h1>
      <p className="mb-4">App loaded successfully!</p>
      <div className="mb-4">
        <label className="block mb-2">Select Website:</label>
        <select
          className="border p-2 w-full"
          value={selectedWebsite}
          onChange={(e) => setSelectedWebsite(e.target.value)}
        >
          <option value="Website A">Website A</option>
          <option value="Website B">Website B</option>
        </select>
        <button
          className="mt-2 bg-blue-500 text-white p-2 rounded"
          onClick={() => alert('Segment creation not implemented yet')}
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
          onClick={() => alert('Notification sending not implemented yet')}
        >
          Send Notification
        </button>
      </div>
    </div>
  );
};

export default App;