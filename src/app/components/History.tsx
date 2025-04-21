'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

interface HistoryEntry {
  date: string;
  fileName: string;
  charCount: number;
  userId?: string;
}

export default function History() {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { userFiles, userId } = useUser();

  const handleHistoryClick = () => {
    if (!isOpen) {
      // 사용자 ID가 있을 때만 히스토리 데이터를 가져옴
      if (userId) {
        const historyData = localStorage.getItem('killer_history');
        const parsedHistory = historyData ? JSON.parse(historyData) : [];
        // 최근 10개를 가져오되 역순으로 정렬 (최신이 위로)
        setHistory([...parsedHistory].reverse().slice(0, 10));
      } else {
        setHistory([]); // 사용자 ID가 없으면 빈 배열로 설정
      }
    }
    setIsOpen(!isOpen); // 토글
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleHistoryClick}
        className={`px-4 py-2 text-white rounded transition-colors ml-2 ${
          isOpen ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-700 hover:bg-gray-600'
        }`}
        disabled={!userId} // 사용자 ID가 없으면 버튼 비활성화
      >
        History
      </button>

      {/* 히스토리 모달 */}
      {isOpen && (
        <div 
          className="fixed bg-black bg-opacity-50 z-[200]"
          style={{
            position: 'absolute',
            top: buttonRef.current ? buttonRef.current.offsetHeight + 15 : 0,
            left: buttonRef.current ? buttonRef.current.offsetWidth + 80 : 0,
            width: '600px',
            maxHeight: '600px'
          }}
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-[#1e3246] text-white rounded-lg shadow-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2.5 border-b border-[#2a4a66] flex justify-between items-center">
              <h2 className="text-base font-bold">저장 기록</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-3 overflow-y-auto" style={{ maxHeight: '500px' }}>
              {!userId ? (
                <p className="text-gray-400 text-xs">사용자 ID를 입력해주세요.</p>
              ) : history.length === 0 ? (
                <p className="text-gray-400 text-xs">저장 기록이 없습니다.</p>
              ) : (
                <div className="space-y-1.5">
                  {history.map((entry, index) => (
                    <div
                      key={index}
                      className="p-2 bg-[#234863] rounded flex items-center hover:bg-[#2a5475] transition-colors"
                    >
                      <div className="text-xs text-gray-400 min-w-[120px]">{entry.date}</div>
                      <div className="font-medium text-sm flex-1">{entry.fileName}</div>
                      <div className="text-xs text-gray-400 ml-2">
                        {entry.charCount.toLocaleString()}자
                      </div>
                      <div className="text-xs text-gray-400 ml-2 min-w-[80px]">
                        ID: {entry.userId || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 