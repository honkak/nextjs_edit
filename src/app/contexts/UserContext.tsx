'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FileNode } from '../types/FileNode';

interface UserContextType {
  userId: string;
  setUserId: (id: string) => void;
  userFiles: FileNode[];
  setUserFiles: React.Dispatch<React.SetStateAction<FileNode[]>>;
  hasUnsavedChanges: boolean;
  saveUserData: () => void;
  loadUserData: (id: string) => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>('');
  const [userFiles, setUserFiles] = useState<FileNode[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 로컬 스토리지에서 사용자 ID 불러오기
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    if (savedUserId) {
      setUserId(savedUserId);
    }
  }, []);

  // 로컬 스토리지에서 파일 데이터 불러오기
  useEffect(() => {
    const savedFiles = localStorage.getItem(`files_${userId}`);
    if (savedFiles) {
      setUserFiles(JSON.parse(savedFiles));
      setHasUnsavedChanges(false);
    }
  }, [userId]);

  // 파일 데이터가 변경될 때마다 unsaved 상태로 표시
  useEffect(() => {
    if (userId && userFiles.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [userFiles, userId]);

  const saveUserData = () => {
    if (userId) {
      localStorage.setItem(`files_${userId}`, JSON.stringify(userFiles));
      setHasUnsavedChanges(false);
    }
  };

  const loadUserData = async (id: string) => {
    setIsLoading(true);
    try {
      const savedFiles = localStorage.getItem(`files_${id}`);
      
      if (savedFiles) {
        setUserFiles(JSON.parse(savedFiles));
        setHasUnsavedChanges(false);
      } else {
        // 새 사용자면 기본 데모 데이터 사용
        const demoData: FileNode[] = [
          {
            id: '1',
            name: '백업저장',
            type: 'folder',
            children: []
          },
          {
            id: '2',
            name: '임시.txt',
            type: 'file',
            content: ''
          }
        ];

        setUserFiles(demoData);
        localStorage.setItem(`files_${id}`, JSON.stringify(demoData));
        setHasUnsavedChanges(false);
      }

      await new Promise(resolve => setTimeout(resolve, 500)); // 짧은 로딩 시뮬레이션
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ 
      userId, 
      setUserId, 
      userFiles, 
      setUserFiles,
      hasUnsavedChanges,
      saveUserData,
      loadUserData,
      isLoading
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 