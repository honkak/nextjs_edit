'use client';

import { useState, useEffect, useRef } from 'react';
import FileExplorer from './components/FileExplorer'
import UserIdInput from './components/UserIdInput'
import SaveButton from './components/SaveButton'
import Editor from './components/Editor'
import { UserProvider, useUser } from './contexts/UserContext'
import History from './components/History'

interface SelectedFile {
  id: string;
  name: string;
  content?: string;
}

// 실제 컨텐츠를 렌더링하는 컴포넌트
function MainContent() {
  const { userFiles, userId, apiKey, setApiKey } = useUser();
  const [selectedFile, setSelectedFile] = useState<{
    id: string;
    name: string;
    content: string;
  } | null>(null);
  const [tempApiKey, setTempApiKey] = useState('');
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // API 키가 변경될 때마다 임시 입력값 업데이트
  useEffect(() => {
    setTempApiKey(apiKey);
    setIsApiKeySaved(false);
    setApiKeyError(null);
  }, [apiKey]);

  const validateApiKey = async (key: string) => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'API 키가 유효하지 않습니다.');
      }

      return true;
    } catch (error) {
      console.error('API 키 검증 오류:', error);
      return false;
    }
  };

  const handleApiKeySave = async () => {
    setIsLoading(true);
    setApiKeyError(null);

    if (!tempApiKey.trim()) {
      setApiKeyError('API 키를 입력해주세요.');
      setIsLoading(false);
      return;
    }

    if (!tempApiKey.startsWith('sk-')) {
      setApiKeyError('유효하지 않은 API 키 형식입니다.');
      setIsLoading(false);
      return;
    }

    const isValid = await validateApiKey(tempApiKey);
    
    if (isValid) {
      setApiKey(tempApiKey);
      setIsApiKeySaved(true);
      setApiKeyError(null);
    } else {
      setApiKeyError('API 키가 유효하지 않습니다. 다시 확인해주세요.');
      setIsApiKeySaved(false);
    }
    
    setIsLoading(false);
  };

  // userId가 변경될 때마다 selectedFile 초기화
  useEffect(() => {
    setSelectedFile(null);
  }, [userId]);

  // 임시.txt 선택
  useEffect(() => {
    if (userId && userFiles.length > 0 && !selectedFile) {
      const tempFile = userFiles.find(file => file.name === '임시.txt');
      if (tempFile) {
        setSelectedFile({
          id: tempFile.id,
          name: tempFile.name,
          content: tempFile.content || ''
        });
      }
    }
  }, [userId, userFiles, selectedFile]);

  // 채팅창 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !apiKey || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [...messages, { role: 'user', content: userMessage }]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || '응답을 받지 못했습니다.');
      }

      const assistantMessage = data.choices[0]?.message?.content;
      if (assistantMessage) {
        setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
      }
    } catch (error) {
      console.error('API 오류:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '죄송합니다. 오류가 발생했습니다. API 키를 확인해주세요.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      {/* 상단 타이틀 */}
      <div className="bg-[#1e1e1e] text-white p-4 border-b border-gray-800 relative flex-shrink-0">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center">
          <SaveButton currentFile={selectedFile} />
          <History />
        </div>
        <h1 className="text-2xl font-bold text-center">폴라리스 문서 편집기</h1>
        <UserIdInput />
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 사이드바 - 파일 탐색기 */}
        <div className="w-64 bg-[#1e1e1e] text-white overflow-y-auto border-r border-gray-800">
          <FileExplorer
            onFileSelect={(file) => setSelectedFile(file)}
            selectedFile={selectedFile}
          />
        </div>

        {/* 중앙 편집기 */}
        <div className="flex-1 bg-[#1e1e1e] overflow-y-auto">
          <Editor selectedFile={selectedFile} />
        </div>

        {/* 우측 AI 채팅 */}
        <div className="w-96 bg-[#1e1e1e] text-white border-l border-gray-800 flex flex-col overflow-hidden">
          {/* 헤더 */}
          <div className="p-4 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold whitespace-nowrap">AI 비서</h2>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tempApiKey}
                  onChange={(e) => {
                    setTempApiKey(e.target.value);
                    setIsApiKeySaved(false);
                    setApiKeyError(null);
                  }}
                  placeholder="ChatGPT API 키"
                  className={`w-[160px] px-2 py-1 text-xs bg-gray-700 rounded text-white border ${
                    apiKeyError ? 'border-red-500' : 'border-gray-600'
                  } focus:outline-none focus:border-blue-500`}
                />
                <button 
                  onClick={handleApiKeySave}
                  disabled={isLoading}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    isLoading ? 'bg-gray-500 cursor-not-allowed' :
                    isApiKeySaved
                      ? 'bg-yellow-500 hover:bg-yellow-400'
                      : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {isLoading ? '확인 중...' : isApiKeySaved ? '저장됨' : '저장'}
                </button>
              </div>
            </div>
            {apiKeyError && (
              <p className="text-xs text-red-500 mt-1">{apiKeyError}</p>
            )}
          </div>

          {/* 채팅 메시지 영역 */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-xs font-bold">
                  AI
                </div>
                <div className="flex-1 bg-emerald-600/10 rounded-lg p-3">
                  <p className="text-sm text-emerald-50">무엇을 도와드릴까요?</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`flex items-start space-x-2 ${
                  message.role === 'user' ? 'justify-end' : ''
                }`}>
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-xs font-bold">
                      AI
                    </div>
                  )}
                  <div className={`flex-1 ${
                    message.role === 'user' 
                      ? 'bg-blue-600/10 text-blue-50 max-w-[80%]' 
                      : 'bg-emerald-600/10 text-emerald-50'
                  } rounded-lg p-3`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
              </div>
            )}
          </div>

          {/* 입력 영역 */}
          <div className="p-4 border-t border-gray-800 flex-shrink-0">
            <div className="relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                className="w-full bg-gray-700 rounded-lg pl-4 pr-10 py-2 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={2}
                disabled={!apiKey || isLoading}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!apiKey || isLoading || !inputMessage.trim()}
                className={`absolute right-2 bottom-2 ${
                  !apiKey || isLoading || !inputMessage.trim()
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-blue-500 hover:text-blue-400'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// 최상위 컴포넌트
export default function Home() {
  return (
    <UserProvider>
      <MainContent />
    </UserProvider>
  );
}

