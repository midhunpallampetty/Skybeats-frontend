'use client';
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

let socket: Socket;

const ClientChat = () => {
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<{ userId: string; text: string }[]>([]);

  useEffect(() => {
    socketInitializer();
  }, []);

  const socketInitializer = async () => {
    await fetch('/api/socket');
    socket = io();

    socket.on('connect', () => {
      console.log('Client connected');
    });

    // Listen to messages from the admin
    socket.on('admin_message', (msg: { adminId: string; text: string }) => {
      setMessages((prev) => [...prev, { userId: 'Admin', text: msg.text }]);
    });
  };

  const sendMessage = () => {
    if (message) {
      socket.emit('client_message', { userId: 'Client', text: message });
      setMessages((prev) => [...prev, { userId: 'Client', text: message }]);
      setMessage('');
    }
  };

  return (
    <div className="text-white">
      <div className="text-white">
        <h2>Client Chat</h2>
        <div className="text-white">
          {messages.map((msg, idx) => (
            <div key={idx}>
              <strong>{msg.userId}: </strong>
              {msg.text}
            </div>
          ))}
        </div>
      </div>
      <input className="text-black"
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default ClientChat;
