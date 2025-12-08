import React from 'react';
import { Message } from '../types';
import { Bot, User, Image as ImageIcon, Music } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${isUser ? 'bg-indigo-600' : 'bg-slate-800 border border-slate-700'}`}>
          {isUser ? (
            <User size={16} className="text-white" />
          ) : (
            <img src="/nova-logo.svg" alt="NOVA" className="w-full h-full object-contain p-1" />
          )}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`p-4 rounded-2xl text-sm md:text-base shadow-lg ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
          }`}>
            
            {/* Attachments */}
            {message.image && (
              <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                <img src={message.image} alt="User upload" className="max-w-full h-auto max-h-48 object-cover" />
              </div>
            )}
            
            {message.audio && (
               <div className="mb-2 flex items-center gap-2 text-xs opacity-80">
                 <Music size={14} /> <span>Audio Input Analysis</span>
               </div>
            )}

            {/* Text */}
            <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
          </div>
          
          {/* Timestamp & Meta */}
          <span className="text-xs text-slate-500 mt-1 px-1">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};