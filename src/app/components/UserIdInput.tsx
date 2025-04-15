'use client';

import { useState } from 'react';
import { useUser } from '../contexts/UserContext';

export default function UserIdInput() {
  const { userId, setUserId, loadUserData, isLoading } = useUser();
  const [inputValue, setInputValue] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 영문자, 숫자, 특수문자 허용 (위험한 특수문자 제외)
    if (value === '' || /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]|;:,./?]*$/.test(value)) {
      setInputValue(value);
      setShowWarning(false);
    } else {
      setShowWarning(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    setUserId(inputValue);
    await loadUserData(inputValue);
  };

  return (
    <div className="absolute top-4 right-4 flex items-center space-x-2">
      <form onSubmit={handleSubmit} className="flex flex-col items-end space-y-1 relative">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="사용자 고유 ID 입력"
            className="w-40 px-3 py-1 text-sm bg-gray-700 rounded text-white border border-gray-600 focus:outline-none focus:border-blue-500"
            disabled={isLoading}
            maxLength={11}
            pattern="[a-zA-Z0-9!@#$%^&*()_+\-=[\]|;:,./?]*"
            title="영문자, 숫자, 대부분의 특수문자 사용 가능 (공백, 따옴표, \, <>, {} 제외)"
          />
          <button
            type="submit"
            className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 rounded text-white disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? '로딩중...' : '확인'}
          </button>
        </div>
        {showWarning && (
          <div className="absolute top-6 -right-1 z-50">
            <span className="text-[10px] text-yellow-500">영문, 숫자, 특수문자 일부 가능</span>
          </div>
        )}
      </form>
      {userId && (
        <span className="text-sm text-gray-300">
          현재 사용자: {userId}
        </span>
      )}
    </div>
  );
} 