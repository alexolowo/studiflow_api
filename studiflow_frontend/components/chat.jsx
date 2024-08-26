'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const initialMessages = [
  {
    id: 1,
    sender: 'bot',
    text: 'Hello! How can I help you with your course today?',
    timestamp: new Date(),
  },
  {
    id: 2,
    sender: 'user',
    text: 'Hi! I have a question about the upcoming assignment.',
    timestamp: new Date(),
  },
  {
    id: 3,
    sender: 'bot',
    text: "Sure, I'd be happy to help. What would you like to know about the assignment?",
    timestamp: new Date(),
  },
];

export default function ChatUI() {
  const [messages, setMessages] = useState(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (inputMessage.trim() === '') return;

    const newUserMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: inputMessage,
      timestamp: new Date(),
    };

    setMessages([...messages, newUserMessage]);
    setInputMessage('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        sender: 'bot',
        text: "I'm a demo bot. I can't actually answer that, but in a real implementation, I would provide a helpful response here.",
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, botResponse]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full p-6">
      <div>{}</div>
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div
              className={`flex ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              } items-start`}>
              <Avatar className="w-8 h-8">
                <AvatarFallback>{message.sender === 'user' ? 'U' : 'B'}</AvatarFallback>
              </Avatar>
              <div
                className={`mx-2 p-3 rounded-lg ${
                  message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}>
                {message.text}
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
      <div className="sticky z-50 bottom-8 p-4 border-t w-full">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow"
          />
          <Button type="submit">Send</Button>
        </form>
      </div>
    </div>
  );
}
