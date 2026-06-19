
import { MessageCircle, Send } from 'lucide-react';

export function Chat({ gameState, maxHeight = '200px' }: { gameState: any, maxHeight?: string }) {
  const { chatMessages, chatInput, setChatInput, handleSendChat } = gameState;

  return (
    <div className="glass-panel p-6 flex flex-col gap-4 flex-1">
      <h3 className="text-lg font-bold text-white border-b border-white-05 pb-3 flex items-center gap-2">
        <MessageCircle size={18} className="text-purple" /> Live Chat
      </h3>
      <div className={`flex-1 overflow-y-auto flex flex-col gap-3 p-2 max-h-[${maxHeight}]`} style={{ maxHeight }}>
        {chatMessages.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4">No messages yet. Say hello!</p>
        )}
        {chatMessages.map((msg: any, idx: number) => (
          <div key={idx} className="flex gap-2 text-xs">
            <span className="text-lg">{msg.avatar}</span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white">{msg.username}</span>
                <span className="text-[8px] text-text-muted">{msg.timestamp}</span>
              </div>
              <p className="text-text-muted mt-0.5">{msg.message}</p>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSendChat} className="flex gap-2">
        <input 
          type="text" 
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Type message..."
          className="form-input flex-1 py-2"
          maxLength={100}
        />
        <button type="submit" className="btn btn-purple px-4 py-2">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
