"use client";
import React, { useState, useRef, useEffect } from 'react';
import PillButton from '../components/PillButton';

// Define the shape of a single message
interface Message {
  id: number;
  text: string;
  sender: 'me' | 'other';
  timestamp: string;
}

export default function MessengerScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMessage]);
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="max-w-md mx-auto flex flex-col h-full border border-gray-200 w-full">
      {/* header with chat participant info */}
      <header className="flex items-center p-4 border-b bg-white">
        <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center mr-3">
          M
        </div>
        <h2 className="text-lg font-semibold">Merchant</h2>
      </header>

      {/* message history */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 rounded-2xl relative text-sm
                ${msg.sender === 'me' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'}`}
            >
              {msg.text}
              <span className="text-xs opacity-60 mt-1 block">{msg.timestamp}</span>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* input area */}
      <form onSubmit={handleSendMessage} className="p-4 flex gap-2 border-t bg-white">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none"
        />
        <PillButton type="submit">Send</PillButton>
      </form>
      </div>
    </div>
  );
}