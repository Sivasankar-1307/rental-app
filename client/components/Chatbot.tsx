"use client";

import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';

interface Message {
  id: string;
  type: 'bot' | 'user';
  text: string;
  timestamp: Date;
}

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  withToggle?: boolean;
  onOpen?: () => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, withToggle = false, onOpen }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      text: "Hi there! 👋 I'm your Antigravity Assistant. How can I help you with your booking today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse = getBotResponse(userMessage.text);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: botResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getBotResponse = (input: string): string => {
    const text = input.toLowerCase();
    if (text.includes('booking') || text.includes('order')) {
      return "You're at the final stage of your booking! Once you complete the payment, you'll receive a confirmation email and a delivery OTP.";
    }
    if (text.includes('payment') || text.includes('razorpay')) {
      return "We support UPI, Credit/Debit Cards, and Netbanking through Razorpay. Your payments are 100% secure and encrypted.";
    }
    if (text.includes('deposit') || text.includes('refund')) {
      return "The security deposit is fully refundable! It will be initiated back to your original payment method within 24-48 hours after we collect the items in good condition.";
    }
    if (text.includes('delivery') || text.includes('time')) {
      return "Delivery times depend on your zone. Central Chennai usually gets same-day delivery if booked before 12 PM!";
    }
    if (text.includes('cancel')) {
      return "You can cancel your booking up to 24 hours before the delivery for a full refund of your advance.";
    }
    if (text.includes('hi') || text.includes('hello') || text.includes('hey')) {
      return "Hello! How can I assist you with your rental needs today? 😊";
    }
    return "That's a great question! I'm still learning, but I'd be happy to connect you with a human agent if you need more specific help. Would you like that?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {withToggle && (
        <button 
          className={`chatbot-toggle ${isOpen ? 'is-hidden' : ''}`} 
          onClick={onOpen}
          aria-label="Open chat"
        >
          💬
        </button>
      )}
      <div className={`chatbot-container ${!isOpen ? 'is-hidden' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar">
              🤖
              <div className="avatar-status"></div>
            </div>
            <div className="chatbot-title">
              <h3>AG Assistant</h3>
              <p>Always Online</p>
            </div>
          </div>
          <button className="chatbot-close" onClick={onClose} aria-label="Close chat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.type}`}>
              {msg.text}
            </div>
          ))}
          {isTyping && (
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-input-area">
          <div className="chatbot-input-wrapper">
            <input
              type="text"
              className="chatbot-input"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button 
              className="chatbot-send" 
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Chatbot;
