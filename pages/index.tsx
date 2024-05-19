import React, { useState, useEffect } from 'react';

const Home: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ user: string; ai: string; special?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openAIStatus, setOpenAIStatus] = useState<'up' | 'down' | 'active'>('up');
  const [geminiStatus, setGeminiStatus] = useState<'up' | 'down' | 'active'>('up');
  const [hasDisplayedSpecial, setHasDisplayedSpecial] = useState(false);
  const [userName, setUserName] = useState('');
  const [userProblem, setUserProblem] = useState('');
  const [isNewChat, setIsNewChat] = useState(true);

  useEffect(() => {
    // Reset special message flag on new chat
    setHasDisplayedSpecial(false);
  }, [messages.length === 0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || (isNewChat && (!userName || !userProblem))) return;

    const userMessage = input;
    setInput('');
    setIsLoading(true);

    setMessages((prev) => [...prev, { user: userMessage, ai: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, userName, userProblem }),
      });
      const data = await res.json();

      const aiResponse = data.response || 'Error: No response';
      const specialMessage = data.specialMessage || '';

      if (data.specialMessage && !hasDisplayedSpecial) {
        setHasDisplayedSpecial(true);
      }

      setMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1 ? { ...msg, ai: aiResponse, special: specialMessage } : msg
        )
      );

      if (specialMessage.includes('Switching to Gemini')) {
        setOpenAIStatus('down');
        setGeminiStatus('active');
      } else {
        setOpenAIStatus('active');
        setGeminiStatus('up');
      }

      if (isNewChat) {
        setIsNewChat(false);
        setUserName('');
        setUserProblem('');
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1 ? { ...msg, ai: 'Error fetching AI response' } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '', newChat: true }),
      });
      setMessages([]);
      setHasDisplayedSpecial(false);
      setOpenAIStatus('up');
      setGeminiStatus('up');
      setUserName('');
      setUserProblem('');
      setIsNewChat(true);
    } catch (error) {
      console.error('Error resetting chat:', error);
    }
  };

  const renderStatus = (status: 'up' | 'down' | 'active') => {
    const color = status === 'up' ? 'green' : status === 'down' ? 'red' : 'blue';
    return <span className={`text-${color}-500`}>{status}</span>;
  };

  const formatAIResponse = (text: string) => {
    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\n/g, '<br>') // Line breaks
      .replace(/\* (.*?)\n/g, '<li>$1</li>'); // List items
    return { __html: formattedText };
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex justify-end p-4">
        <div className="mr-4">
          <strong>OpenAI:</strong> {renderStatus(openAIStatus)}
        </div>
        <div>
          <strong>Gemini:</strong> {renderStatus(geminiStatus)}
        </div>
      </div>
      <div className="flex-grow p-6 overflow-auto">
        <div className="flex flex-col space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className="flex flex-col space-y-2">
              <div className="bg-blue-100 p-4 rounded-lg self-start">
                <strong>User:</strong> {msg.user}
              </div>
              {msg.special && index === 0 && (
                <div className="bg-yellow-100 p-2 rounded-lg self-center text-sm max-w-lg text-center">
                  {msg.special}
                </div>
              )}
              <div
                className="bg-green-100 p-4 rounded-lg self-end"
                dangerouslySetInnerHTML={formatAIResponse(msg.ai)}
              ></div>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-4 bg-white flex flex-col space-y-4">
        {isNewChat && (
          <>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg"
              placeholder="Your name"
              disabled={isLoading}
            />
            <input
              type="text"
              value={userProblem}
              onChange={(e) => setUserProblem(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg"
              placeholder="Describe your problem"
              disabled={isLoading}
            />
          </>
        )}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-grow p-2 border border-gray-300 rounded-lg"
          placeholder="Type your message..."
          disabled={isLoading || (isNewChat && (!userName || !userProblem))}
        />
        <button type="submit" className="ml-4 p-2 bg-blue-500 text-white rounded-lg" disabled={isLoading || (isNewChat && (!userName || !userProblem))}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
      <button
        onClick={handleNewChat}
        className="m-4 p-2 bg-red-500 text-white rounded-lg self-center"
      >
        New Chat
      </button>
    </div>
  );
};

export default Home;
