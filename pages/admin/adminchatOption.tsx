import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import socketIOClient from 'socket.io-client';
import adminAxios from '../api/utils/adminAxiosInstance';

// Define the type for the message data structure
interface MessageData {
    from: string;
    to: string;
    message: string;
}

// Define the socket URL
const socket: Socket = socketIOClient('https://skybeats.upskillr.online/'); // Ensure this matches your server URL

const AdminChat: React.FC = () => {
    const [message, setMessage] = useState<string>('');  // State to hold the message
    const [selectedUser, setSelectedUser] = useState<string>('');  // State to hold selected userId
    const [chat, setChat] = useState<MessageData[]>([]);  // State to hold chat messages
    const [users, setUsers] = useState<string[]>(['user1', 'user2']); // Example user list

    useEffect(() => {

        // Listen for incoming messages
        socket.on('incoming_message', (data: MessageData) => {
            console.log('Message received:', data);
            setChat((prevChat) => [...prevChat, data]);  // Append the new message to the chat
        });

        // Cleanup the socket connection on unmount
        return () => {
            socket.off('incoming_message');
        };
    }, []);

    // Function to handle sending message to a selected user
    const sendMessageToUser = () => {
        if (selectedUser && message.trim() !== '') {
            const messageData: MessageData = {
                from: 'admin',  // Always set 'from' to 'admin'
                to: selectedUser,  // The userId of the selected user
                message: message
            };

            socket.emit('new_message', messageData);  // Send the message to the backend
            setChat((prevChat) => [...prevChat, messageData]);  // Update the chat in the frontend
            setMessage('');  // Clear the message input after sending
        } else {
            alert('Please select a user and enter a message.');
        }
    };

    return (
        <div style={{ backgroundColor: 'white', padding: '20px', minHeight: '100vh' }}>
            <h2>Admin Chat</h2>

            {/* Dropdown to select user */}
            <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
            >
                <option value="">Select User</option>
                {users.map((user, index) => (
                    <option key={index} value={user}>{user}</option>
                ))}
            </select>

            {/* Chat window displaying messages */}
            <div className="chat-window" style={{ border: '1px solid black', padding: '10px', marginTop: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                {chat.map((msg, index) => (
                    <div key={index}>
                        <strong>{msg.from === 'admin' ? 'You' : msg.from}:</strong> {msg.message}
                    </div>
                ))}
            </div>

            {/* Input for sending a message */}
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type message to user"
                style={{ marginRight: '10px', marginTop: '10px' }}
            />
            <button onClick={sendMessageToUser}>Send</button>
        </div>
    );
};

export default AdminChat;
