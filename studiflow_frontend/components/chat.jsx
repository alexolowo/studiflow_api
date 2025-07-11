'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { FileUp, Send, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';

export default function Chat({ messages, setMessages }) {
  // const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [pdfFiles, setPdfFiles] = useState([]);
  const scrollAreaRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  const [accessToken, setAccessToken] = useState('');

  const params = useParams();
  const courseIdentifier = params.courseID;

  useEffect(() => {}, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get the user data
        const response = await fetch('https://studiflow-a4bd949e558f.herokuapp.com/auth/login/', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        setUserEmail(userData.email);
        setUserName(userData.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [accessToken]);

  useEffect(() => {
    setAccessToken(window.localStorage.getItem('accessToken') || '');
  }, []);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await fetch(
          'https://studiflow-a4bd949e558f.herokuapp.com/chat/chat_history',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify({
              course_id: courseIdentifier.split('-')[0],
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
          const sortedMessages = data
            .map((msg) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            }))
            .sort((a, b) => a.timestamp - b.timestamp);

          setMessages(sortedMessages);
        } else {
          // If there's no chat history, send the initial bot message
          const initialMessage = {
            id: 'initial',
            sender: 'bot',
            text: `Hello ${userName}, how can I help you today?`,
            timestamp: new Date(),
          };
          setMessages([initialMessage]);

          // Send this message to the backend to save in chat history
          await sendMessageToBackend(initialMessage);
        }
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };

    if (courseIdentifier && userName) {
      fetchChatHistory();
    }
  }, [courseIdentifier, userName]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollIntoView(false);
    }
  }, [messages]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => file.type === 'application/pdf');
    if (validFiles.length > 0) {
      setPdfFiles((prevFiles) => [...prevFiles, ...validFiles]);
    } else {
      alert('Please select PDF files only');
    }
  };

  const removeFile = (index) => {
    setPdfFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
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
    if (inputMessage.trim() === '' && pdfFiles.length === 0) return;
    setIsLoading(true);

    const newUserMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: inputMessage || `Uploaded ${pdfFiles.length} PDF file(s)`,
      timestamp: new Date(),
    };

    setMessages([...messages, newUserMessage]);
    setInputMessage('');

    try {
      let response;

      if (!courseIdentifier || !userEmail) return;

      if (pdfFiles.length > 0) {
        const formData = new FormData();
        formData.append('course_id', courseIdentifier.split('-')[0]);
        pdfFiles.forEach((file) => formData.append('files', file));

        response = await fetch('https://studiflow-a4bd949e558f.herokuapp.com/resources/upload/', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        });
      } else {
        response = await fetch('https://studiflow-a4bd949e558f.herokuapp.com/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            query: inputMessage,
            // user_email: userEmail,
            course_id: courseIdentifier.split('-')[0],
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();

      const botResponse = {
        id: messages.length + 2,
        sender: 'bot',
        text: data.response,
        timestamp: new Date(),
      };

      setPdfFiles([]);
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

  const sendMessageToBackend = async (message) => {
    try {
      const response = await fetch('https://studiflow-a4bd949e558f.herokuapp.com/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          query: message.text,
          course_id: courseIdentifier.split('-')[0],
          is_bot_message: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // We don't need to do anything with the response here
      // as we've already added the message to the local state
    } catch (error) {
      console.error('Error sending message to backend:', error);
    }
  };

  return (
    <div className="flex flex-col mt-20">
      <ScrollArea className="flex-grow p-8">
        <div className="flex flex-col h-full" ref={scrollAreaRef}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              } mb-4`}>
              <div
                className={`flex ${
                  message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                } items-start max-w-[70%]`}>
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    {message.sender === 'user' ? (
                      userName && userName.charAt(0).toUpperCase()
                    ) : (
                      <Image
                        src="/file.png"
                        width={32}
                        height={32}
                        alt="chatbot with studiflow logo"
                      />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`mx-2 ${
                    message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
                  } ${message.isTyping ? '' : 'p-3 rounded-lg'}`}>
                  {message.isTyping ? (
                    <TypingIndicator />
                  ) : (
                    <ReactMarkdown className="markdown-content">{message.text}</ReactMarkdown>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="sticky bottom-8 w-[80%] p-10 py-4 bg-gray-200 rounded-xl shadow-lg z-50 ml-30 self-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Label
                htmlFor="pdf-upload"
                className={`cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}>
                <FileUp
                  className={`w-6 h-6 ${pdfFiles.length > 0 ? 'text-green-500' : 'text-gray-500'}`}
                />
              </Label>
              <Input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading}
                multiple
              />
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
          </div>
          {pdfFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {pdfFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
                  {file.name}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
