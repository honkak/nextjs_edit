'use client';

import Image from 'next/image'
import FileExplorer from './components/FileExplorer'
import { useState, useEffect } from 'react'
import SaveButton from './components/SaveButton'
import History from './components/History'
import UserIdInput from './components/UserIdInput'
import Editor from './components/Editor'
import { useUser } from './contexts/UserContext'
import { FileNode } from './types/FileNode'
import { useRouter } from 'next/navigation'
import { isMobile } from './utils/isMobile'
import AnalysisBoard from './components/AnalysisBoard'
import { analyzeText, AnalysisResult } from './utils/textAnalyzer'

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<{ id: string; name: string; content: string } | null>(null);
  const { userId, userFiles, setUserFiles, saveUserData, setHasUnsavedChanges } = useUser();
  const [apiKey, setApiKey] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isValidApiKey, setIsValidApiKey] = useState(false);
  const [isApiKeyFailed, setIsApiKeyFailed] = useState(false);
  const [prevUserId, setPrevUserId] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();

  // 사용자별 채팅 메시지 저장
  const saveChatMessages = (userId: string, messages: Message[]) => {
    localStorage.setItem(`chat_messages_${userId}`, JSON.stringify(messages));
  };

  // 사용자별 채팅 메시지 로드
  const loadChatMessages = (userId: string): Message[] => {
    const savedMessages = localStorage.getItem(`chat_messages_${userId}`);
    return savedMessages ? JSON.parse(savedMessages) : [];
  };

  // 사용자 ID 변경 시 채팅 메시지 처리
  useEffect(() => {
    // 이전 사용자의 메시지 저장
    if (prevUserId && messages.length > 0) {
      saveChatMessages(prevUserId, messages);
    }

    // 메시지 초기화
    setMessages([]);
    setInputMessage('');

    // 새 사용자의 메시지 로드
    if (userId) {
      const userMessages = loadChatMessages(userId);
      setMessages(userMessages);
    }

    setPrevUserId(userId);
  }, [userId]);

  // userId가 있을 때 임시.txt를 선택하도록 수정
  useEffect(() => {
    if (userId && userFiles.length > 0) {
      // 현재 선택된 파일이 없거나, 이전 userId와 현재 userId가 다른 경우에만 임시.txt 선택
      if (!selectedFile || prevUserId !== userId) {
        const findTempFile = (items: FileNode[]): FileNode | null => {
          for (const item of items) {
            if (item.type === 'file' && item.name === '임시.txt') {
              return item;
            }
            if (item.type === 'folder' && item.children) {
              const found = findTempFile(item.children);
              if (found) return found;
            }
          }
          return null;
        };

        const tempFile = findTempFile(userFiles);
        if (tempFile) {
          setSelectedFile({
            id: tempFile.id,
            name: tempFile.name,
            content: tempFile.content || ''
          });
        }
      }
      
      // 현재 userId를 prevUserId로 업데이트
      setPrevUserId(userId);
    }
  }, [userId, userFiles, selectedFile, prevUserId]);

  // API 키 로드
  useEffect(() => {
    // 이전 상태 초기화
    setApiKey('');
    setIsValidApiKey(false);
    setIsApiKeyFailed(false);

    if (userId) {
      const savedApiKey = localStorage.getItem(`chatgpt_api_key_${userId}`);
      if (savedApiKey) {
        setApiKey(savedApiKey);
        // 저장된 키가 있으면 자동으로 검증 실행
        handleApiKeyValidation(savedApiKey, false);
      }
    }
  }, [userId]);

  // API 키 검증 함수
  const handleApiKeyValidation = async (keyToVerify: string, shouldSetUnsavedChanges: boolean = true) => {
    if (!keyToVerify.trim() || !userId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyToVerify}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        })
      });

      if (response.ok) {
        setIsValidApiKey(true);
        setIsApiKeyFailed(false);
        // 유효한 API 키를 사용자 ID와 함께 저장
        localStorage.setItem(`chatgpt_api_key_${userId}`, keyToVerify);
        if (shouldSetUnsavedChanges) {
          setHasUnsavedChanges(true);
        }
      } else {
        setIsValidApiKey(false);
        setIsApiKeyFailed(true);
        // 유효하지 않은 API 키 삭제
        localStorage.removeItem(`chatgpt_api_key_${userId}`);
      }
    } catch (error) {
      setIsValidApiKey(false);
      setIsApiKeyFailed(true);
      // 에러 발생 시 API 키 삭제
      localStorage.removeItem(`chatgpt_api_key_${userId}`);
    } finally {
      setIsLoading(false);
    }
  };

  // API 키 검증 버튼 핸들러
  const handleApiKeySubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    handleApiKeyValidation(apiKey);
  };

  // API 키 입력 핸들러
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newApiKey = e.target.value;
    setApiKey(newApiKey);
    setIsValidApiKey(false);
    setIsApiKeyFailed(false);
    // API 키가 변경되면 저장된 키 삭제
    if (userId) {
      localStorage.removeItem(`chatgpt_api_key_${userId}`);
    }
  };

  // SaveButton 클릭 시 API 키 처리
  useEffect(() => {
    if (!isValidApiKey && userId) {
      localStorage.removeItem(`chatgpt_api_key_${userId}`);
    }
  }, [isValidApiKey, userId]);

  // 메시지 전송 시 저장 로직 추가
  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    if (!isValidApiKey) {
      await handleApiKeyValidation(apiKey);
      if (!isValidApiKey) {
        alert('유효하지 않은 API 키입니다.');
        return;
      }
    }

    setIsLoading(true);
    try {
      // 사용자 메시지 추가
      const userMessage: Message = { role: 'user', content: inputMessage };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInputMessage('');
      setHasUnsavedChanges(true);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: updatedMessages
        })
      });

      const data = await response.json();
      if (response.ok) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.choices[0].message.content
        };
        const newMessages = [...updatedMessages, assistantMessage];
        setMessages(newMessages);
        setHasUnsavedChanges(true);
        
        // 메시지 저장
        if (userId) {
          saveChatMessages(userId, newMessages);
        }
      } else {
        console.error('API Error:', data);
        alert('메시지 전송 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('메시지 전송 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    // 모바일로 접속 시 모바일 페이지로 리다이렉트
    if (isMobile()) {
      router.push('/mobile');
    }
  }, [router]);

  const handleSave = () => {
    if (userId) {
      localStorage.setItem(`userId_${userId}_files`, JSON.stringify(userFiles));
      localStorage.setItem(`userId_${userId}_apiKey`, apiKey);
      localStorage.setItem(`userId_${userId}_messages`, JSON.stringify(messages));
      const now = new Date();
      const timeString = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      localStorage.setItem(`userId_${userId}_lastSavedTime`, timeString);
      setLastSavedTime(timeString);
      setHasUnsavedChanges(false);
    }
  };

  useEffect(() => {
    if (userId) {
      const savedTime = localStorage.getItem(`userId_${userId}_lastSavedTime`);
      setLastSavedTime(savedTime);
    }
  }, [userId]);

  // 파일 내용이 변경될 때마다 분석 실행
  useEffect(() => {
    if (selectedFile?.content) {
      const result = analyzeText(selectedFile.content);
      setAnalysis(result);
    } else {
      setAnalysis(null);
    }
  }, [selectedFile?.content]);

  // 글자수 계산을 위한 함수
  const getCharCount = (text: string): number => {
    if (!text) return 0;
    return analyzeText(text).statistics.charCount;
  };

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-[#1e1e1e]">
      {/* 상단 타이틀 */}
      <div className="flex justify-center bg-[#1e1e1e] text-white border-b border-gray-700 relative flex-shrink-0">
        <div className="w-[calc(256px+800px+400px)] p-4 relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center">
            <SaveButton currentFile={selectedFile} onSave={handleSave} />
            <History />
            <button
              onClick={() => {
                const dataStr = JSON.stringify(userFiles);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(dataBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `KillerDoc_${userId}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              disabled={!userId}
              className={`ml-2 px-3 py-1 text-sm rounded text-white transition-colors ${
                userId ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 cursor-not-allowed'
              }`}
            >
              내보내기
            </button>
            <label className={`ml-2 px-3 py-1 text-sm rounded text-white transition-colors ${
              userId ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-gray-600 cursor-not-allowed'
            }`}>
              불러오기
              <input
                type="file"
                accept=".json"
                className="hidden"
                disabled={!userId}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      try {
                        const content = e.target?.result as string;
                        const parsedData = JSON.parse(content);
                        
                        // 데이터 구조 검증
                        if (!Array.isArray(parsedData)) {
                          throw new Error('올바른 파일 형식이 아닙니다.');
                        }
                        
                        // FileNode 구조 검증
                        const isValidFileNode = (node: any): boolean => {
                          if (!node.id || !node.name || !node.type) return false;
                          if (node.type !== 'file' && node.type !== 'folder') return false;
                          if (node.type === 'folder' && !Array.isArray(node.children)) return false;
                          if (node.type === 'folder') {
                            return node.children.every((child: any) => isValidFileNode(child));
                          }
                          return true;
                        };

                        if (!parsedData.every((node: any) => isValidFileNode(node))) {
                          throw new Error('파일 구조가 올바르지 않습니다.');
                        }

                        setUserFiles(parsedData);
                        alert('파일을 성공적으로 불러왔습니다.');
                      } catch (error) {
                        alert('파일을 불러오는 중 오류가 발생했습니다: ' + (error as Error).message);
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
            <button
              onClick={() => setShowHelp(true)}
              className="ml-2 w-6 h-6 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center text-white text-sm transition-colors"
              title="도움말"
            >
              ?
            </button>
          </div>
          <h1 className="text-2xl font-bold text-center">필살 에디터 <span className="text-[0.7em]">: Designed for Web Novel Authors</span></h1>
          <UserIdInput />
        </div>
      </div>

      {/* 도움말 모달 */}
      {showHelp && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowHelp(false)}
        >
          <div 
            className="bg-[#1e3246] rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-[#2a4a66]">
              <h3 className="text-lg font-semibold text-white">필살 에디터 사용 가이드</h3>
              <button 
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-white">
              <div className="space-y-4">
                <div className="text-gray-400 text-sm mb-6">
                  개발자 : 혼각 (kyw6848@cuk.edu)
                </div>
                <section>
                  <h4 className="text-lg font-semibold mb-2">기본 기능</h4>
                  <ul className="list-disc pl-5 space-y-2 text-gray-300">
                    <li>좌측의 파일 탐색기에서 폴더와 파일을 생성하고 관리할 수 있습니다.</li>
                    <li>중앙의 편집기에서 텍스트를 작성하고 수정할 수 있습니다.</li>
                    <li>우측의 AI 비서를 통해 작성 중인 내용에 대해 조언을 받을 수 있습니다.</li>
                  </ul>
                </section>
                <section>
                  <h4 className="text-lg font-semibold mb-2">파일 관리</h4>
                  <ul className="list-disc pl-5 space-y-2 text-gray-300">
                    <li>상단의 저장 버튼을 통해 작업 내용을 저장할 수 있습니다.</li>
                    <li>내보내기 버튼으로 전체 작업 내용을 파일로 저장할 수 있습니다.</li>
                    <li>불러오기 버튼으로 이전에 저장한 작업을 복원할 수 있습니다.</li>
                  </ul>
                </section>
                <section>
                  <h4 className="text-lg font-semibold mb-2">AI 비서 사용법</h4>
                  <ul className="list-disc pl-5 space-y-2 text-gray-300">
                    <li>ChatGPT API 키를 입력하여 AI 비서 기능을 활성화할 수 있습니다.</li>
                    <li>작성 중인 내용에 대한 조언이나 교정을 요청할 수 있습니다.</li>
                    <li>대화형 인터페이스로 자연스러운 소통이 가능합니다.</li>
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메인 컨텐츠 영역 */}
      <div className="flex flex-1 overflow-hidden justify-center">
        {/* 좌측 사이드바 - 파일 탐색기 */}
        <div className="w-64 bg-[#1e1e1e] text-white overflow-y-auto border-l border-r border-gray-700">
          <FileExplorer
            onFileSelect={(file) => setSelectedFile(file)}
            selectedFile={selectedFile}
          />
        </div>

        {/* 중앙 에디터 */}
        <div className="w-[700px] flex flex-col bg-[#1e1e1e]">
          {/* 편집기 타이틀 영역 */}
          <div className="p-2 border-b border-gray-700 flex items-center justify-between bg-[#252526]">
            <div className="flex items-center gap-4">
              <h2 className="text-white text-base font-semibold">편집기</h2>
              {selectedFile && (
                <span className="text-gray-400 text-sm">{selectedFile.name}</span>
              )}
              <span className="text-gray-400 text-sm">글자수: {selectedFile ? getCharCount(selectedFile.content) : 0}자</span>
              {lastSavedTime && <span className="text-gray-400 text-sm">마지막 저장: {lastSavedTime}</span>}
            </div>
            <button
              onClick={() => {
                if (selectedFile?.content) {
                  navigator.clipboard.writeText(selectedFile.content)
                    .then(() => {
                      // 복사 성공 시 버튼 스타일 잠시 변경
                      const button = document.activeElement as HTMLButtonElement;
                      button.classList.add('text-green-400');
                      setTimeout(() => {
                        button.classList.remove('text-green-400');
                      }, 1000);
                    })
                    .catch(err => console.error('복사 실패:', err));
                }
              }}
              className="text-gray-400 hover:text-white transition-colors mr-4"
              title="전체 내용 복사하기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
          </div>
          {/* 에디터 본문 영역 */}
          <div className="flex-1 overflow-y-auto scrollbar-none">
            <Editor
              selectedFile={selectedFile}
              onContentChange={(newContent) => {
                if (selectedFile) {
                  selectedFile.content = newContent;
                  setSelectedFile({...selectedFile});
                }
              }}
            />
          </div>
          <div className="h-32 border-t border-gray-700 bg-[#1e1e1e]">
            <AnalysisBoard analysis={analysis} />
          </div>
        </div>

        {/* 편집기와 AI 비서 사이의 제어 영역 */}
        <div className="w-[30px] bg-[#1e1e1e] text-white border-l border-r border-gray-700 flex flex-col">
          <div className="flex items-center justify-center h-[42px] bg-[#252526]">
            <h2 className="text-white text-xs font-semibold">제어</h2>
          </div>
          <div className="border-t border-gray-700"></div>
          <div className="flex-1 overflow-y-auto p-1 flex flex-col gap-1">
            {[...Array(15)].map((_, index) => (
              <button
                key={index}
                className="w-full h-[50px] bg-[#E67000] hover:bg-[#CC6600] text-white text-xs font-semibold flex items-center justify-center transition-colors"
                onClick={() => {
                  // 버튼 클릭 핸들러를 나중에 추가할 수 있습니다
                }}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* 우측 AI 채팅 */}
        <div className="w-96 bg-[#1e1e1e] text-white border-l border-r border-gray-700 flex flex-col overflow-hidden">
          <div className="p-4 flex flex-col h-full">
            <div className="flex items-center justify-between">
              <h2 className="text-white text-base font-semibold">AI 비서</h2>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  placeholder="CHAT GPT API 키 입력"
                  className="px-2 py-1 rounded bg-gray-700 text-white w-[80%] text-xs"
                />
                <button
                  onClick={handleApiKeySubmit}
                  disabled={!apiKey || isLoading}
                  className={`px-2 py-1 rounded text-xs min-w-[60px] whitespace-nowrap ${
                    !apiKey
                      ? 'bg-gray-600 cursor-not-allowed'
                      : isValidApiKey
                        ? 'bg-[#FFB800] hover:bg-[#FFA500] text-black'
                        : isApiKeyFailed
                          ? 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
                          : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                  }`}
                >
                  {isValidApiKey 
                    ? '확인됨' 
                    : isApiKeyFailed 
                      ? '실패' 
                      : isLoading 
                        ? '...' 
                        : '검증'}
                </button>
              </div>
            </div>
            <div className="border-t border-gray-700 my-4 mx-[-1rem]"></div>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === 'user' 
                        ? 'bg-gray-700 text-white rounded-tr-none' 
                        : 'bg-[#2563EB] text-white rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
            </div>
          ))}
            </div>

            {/* AI 비서 채팅 입력 영역 */}
            <div className="p-3 pt-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="무엇이든 물어보세요"
                  className="flex-1 pl-3 pr-2 py-1.5 bg-[#2A2A2A] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (isValidApiKey) {
                      handleKeyDown(e);
                    }
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!isValidApiKey || !inputMessage.trim() || isLoading}
                  className={`px-2 py-1.5 rounded-lg text-white text-sm min-w-[48px] ${
                    isValidApiKey && inputMessage.trim() && !isLoading
                    ? 'bg-blue-500 hover:bg-blue-600' 
                    : 'bg-gray-600 cursor-not-allowed'
                  }`}
                >
                  전송
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

