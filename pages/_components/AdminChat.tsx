'use client';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const AdminChat = () => {
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<{ userId: string; text: string }[]>([]);
  const [socket, setSocket] = useState<any>(null); // Use 'any' type here

  useEffect(() => {
    socketInitializer();
    return () => {
      socket?.disconnect(); // Cleanup socket connection on unmount
    };
  }, []);

  const socketInitializer = async () => {
    await fetch('/api/socket'); // Ensure the server-side socket setup if needed
    const newSocket = io(); // Initialize new socket connection
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Admin connected');
    });

    // Listen to messages from the clients
    newSocket.on('client_message', (msg: { userId: string; text: string }) => {
      setMessages((prev) => [...prev, { userId: msg.userId, text: msg.text }]);
    });
  };

  const sendMessage = () => {
    if (message && socket) {
      socket.emit('admin_message', { adminId: 'Admin', text: message });
      setMessages((prev) => [...prev, { userId: 'Admin', text: message }]);
      setMessage('');
    }
  };

  return (
    <div className="text-white">
      <div>
        <h2>Admin Chat</h2>
        <div>
          {messages.map((msg, idx) => (
            <div key={idx}>
              <strong>{msg.userId}: </strong>
              {msg.text}
            </div>
          ))}
        </div>
      </div>
      <input
        className="text-black"
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter message"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default AdminChat;
