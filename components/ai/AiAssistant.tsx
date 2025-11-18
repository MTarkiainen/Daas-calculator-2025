import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { useLanguage } from '../../i18n/LanguageContext';
import PaperAirplaneIcon from '../ui/icons/PaperAirplaneIcon';
import SparklesIcon from '../ui/icons/SparklesIcon';
import XIcon from '../ui/icons/XIcon';
import { Button } from '../ui/Button';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const [chat, setChat] = useState<Chat | null>(null);
  const [history, setHistory] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const apiKey = import.meta.env?.VITE_GEMINI_API_KEY;
        if (!apiKey) {
          console.error("AI Assistant disabled: Gemini API Key not configured in .env file.");
          return;
        }
        
        const ai = new GoogleGenAI({ apiKey });
        const systemInstruction = [
            t('aiPrompt.assistant.persona'),
            t('aiPrompt.assistant.appDescription'),
            t('aiPrompt.assistant.goal'),
            t('aiPrompt.assistant.languageInstruction', { languageName: language.name, languageCode: language.code })
        ].join(' ');

        const newChat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction,
          },
        });
        setChat(newChat);
      } catch (error) {
        console.error("Failed to initialize AI Assistant:", error);
      }
    };
    initializeChat();
  }, [t, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !chat) return;

    const userMessage: Message = { role: 'user', text: input };
    setHistory(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseStream = await chat.sendMessageStream({ message: input });
      
      let modelResponse = '';
      setHistory(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of responseStream) {
        modelResponse += chunk.text;
        setHistory(prev => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1].text = modelResponse;
          return newHistory;
        });
      }
    } catch (error) {
      console.error("Error sending message to AI:", error);
      setHistory(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100%-2rem)] max-w-lg h-[70vh] max-h-[600px] z-50 flex flex-col bg-white rounded-xl shadow-2xl border border-gray-200 transition-transform duration-300 ease-in-out transform translate-y-0">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-slate-50 rounded-t-xl flex-shrink-0">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-6 h-6 text-chg-active-blue" />
          <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {history.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-4 py-2 shadow-sm ${msg.role === 'user' ? 'bg-chg-active-blue text-white' : 'bg-gray-100 text-gray-800'}`}>
              {msg.text.split('\n').map((line, i) => <p key={i} className="whitespace-pre-wrap">{line || '\u00A0'}</p>)}
            </div>
          </div>
        ))}
        {isLoading && history[history.length - 1]?.role !== 'model' && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg px-4 py-2 bg-gray-100 text-gray-800">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t bg-white rounded-b-xl">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 block w-full px-3 py-2 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
            disabled={isLoading || !chat}
          />
          <Button type="submit" disabled={isLoading || !input.trim() || !chat}>
            <PaperAirplaneIcon />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AiAssistant;
