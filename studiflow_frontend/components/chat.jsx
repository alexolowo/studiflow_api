'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { FileUp, Send } from 'lucide-react';

const initialMessages = [
  {
    id: 1,
    sender: 'bot',
    text: 'Hello! How can I help you with your course today?',
    timestamp: new Date(),
  },
];

export default function ChatUI() {
  const [messages, setMessages] = useState(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const scrollAreaRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    setAccessToken(window.localStorage.getItem('accessToken') || '');
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      alert('Please select a PDF file');
    }
  };

  useEffect(() => {
    if (isLoading) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: 'typing', sender: 'bot', isTyping: true },
      ]);
    } else {
      setMessages((prevMessages) => prevMessages.filter((message) => message.id !== 'typing'));
    }
  }, [isLoading]);

  const handleSendMessage = async () => {
    if (inputMessage.trim() === '' && !pdfFile) return;
    setIsLoading(true);

    const newUserMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: inputMessage || `Uploaded a PDF file: ${pdfFile.name}`,
      timestamp: new Date(),
    };

    setMessages([...messages, newUserMessage]);
    setInputMessage('');

    try {
      let response;
      if (pdfFile) {
        const formData = new FormData();
        formData.append('user_id', 'rtutz');
        formData.append('course_id', 'csc263');
        formData.append('files', pdfFile);

        response = await fetch('http://localhost:8000/chat/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        });
      } else {
        response = await fetch('http://localhost:8000/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ query: inputMessage }),
        });
      }

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('data received from backend is', data);
      console.log('messages currently are', messages);

      const botResponse = {
        id: messages.length + 2,
        sender: 'bot',
        text: data.response,
        timestamp: new Date(),
      };
      console.log('bot message is', botResponse);

      setPdfFile(null);
      setMessages((prevMessages) => [...prevMessages, botResponse]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: messages.length + 2,
        sender: 'bot',
        text: 'Sorry, there was an error processing your request.',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
            <div
              className={`flex ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              } items-start max-w-[70%]`}>
              <Avatar className="w-8 h-8">
                <AvatarFallback>{message.sender === 'user' ? 'U' : 'B'}</AvatarFallback>
              </Avatar>
              <div
                className={`mx-2 ${
                  message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                } ${message.isTyping ? '' : 'p-3 rounded-lg'}`}>
                {message.isTyping ? <TypingIndicator /> : message.text}
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2">
          <div className="relative">
            <Label
              htmlFor="pdf-upload"
              className={`cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}>
              <FileUp className={`w-6 h-6 ${pdfFile ? 'text-green-500' : 'text-gray-500'}`} />
            </Label>
            <Input
              id="pdf-upload"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />
            {pdfFile && (
              <div className="absolute top-full left-0 mt-1 text-xs text-green-600 whitespace-nowrap">
                {pdfFile.name}
              </div>
            )}
          </div>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

const TypingIndicator = () => (
  <div className="flex items-center space-x-1 p-2 rounded-lg">
    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
    <div
      className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
      style={{ animationDelay: '0.2s' }}></div>
    <div
      className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
      style={{ animationDelay: '0.4s' }}></div>
  </div>
);
