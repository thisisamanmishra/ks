'use client';

import { useState } from 'react';

// This is a modernized Chat interface with support for threads and mentions
export default function ProjectChatPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState([
    { id: '1', user: 'Admin', content: 'Welcome to the project channel. Let\'s sync up here and on Slack.', time: '10:00 AM' },
    { id: '2', user: 'Vendor A', content: 'Got it, looking forward. @Admin any specifics on the DB?', time: '10:15 AM' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: 'Current User',
      content: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setNewMessage('');
    // TODO: Send to backend / slack sync via /api/slack/events or custom endpoint
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
      <div className="bg-navy p-4 text-white">
        <h2 className="font-bold text-lg">💬 Project #{params.id} Discussion</h2>
        <p className="text-xs text-slate-300">Synced with Slack • Mentions enabled</p>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50">
        {messages.map(msg => (
          <div key={msg.id} className="flex flex-col">
            <span className="text-xs font-bold text-slate-500 ml-1 mb-1">{msg.user} <span className="font-normal text-slate-400">• {msg.time}</span></span>
            <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100 max-w-[80%] self-start">
              {/* Highlight mentions rudimentarily */}
              <p className="text-sm text-slate-700">
                {msg.content.split(' ').map((word, i) => word.startsWith('@') ? <span key={i} className="text-accent font-bold cursor-pointer hover:underline">{word} </span> : <span key={i}>{word} </span>)}
              </p>
            </div>
            <div className="flex gap-2 mt-1 ml-1">
              <button className="text-[10px] text-slate-400 font-bold hover:text-navy transition-colors">Reply in thread</button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:border-navy transition-colors">
          <button className="p-2 text-slate-400 hover:text-navy cursor-pointer">📎</button>
          <input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message or use @ to mention..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          <button onClick={handleSendMessage} className="bg-navy text-white px-4 py-2 rounded-lg font-bold text-sm cursor-pointer hover:bg-opacity-90">Send</button>
        </div>
      </div>
    </div>
  );
}
