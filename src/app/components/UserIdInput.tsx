'use client';

import { useState } from 'react';
import { useUser } from '../contexts/UserContext';

export default function UserIdInput() {
  const { userId, setUserId, loadUserData, isLoading } = useUser();
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    setUserId(inputValue);
    await loadUserData(inputValue);
  };

  return (
    <div className="absolute top-4 right-4 flex items-center space-x-2">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="사용자 ID 입력"
          className="px-3 py-1 text-sm bg-gray-700 rounded text-white border border-gray-600 focus:outline-none focus:border-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 rounded text-white disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? '로딩중...' : '확인'}
        </button>
      </form>
      {userId && (
        <span className="text-sm text-gray-300">
          현재 사용자: {userId}
        </span>
      )}
    </div>
  );
} 