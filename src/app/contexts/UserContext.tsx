'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FileNode } from '../types/FileNode';

export interface UserContextType {
  userId: string | null;
  setUserId: (id: string) => void;
  userFiles: FileNode[];
  setUserFiles: React.Dispatch<React.SetStateAction<FileNode[]>>;
  saveUserData: () => void;
  loadUserData: (userId: string) => Promise<void>;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
}

export const UserContext = createContext<UserContextType>({
  userId: null,
  setUserId: () => {},
  userFiles: [],
  setUserFiles: () => {},
  saveUserData: () => {},
  loadUserData: async () => {},
  isLoading: false,
  hasUnsavedChanges: false,
  setHasUnsavedChanges: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userFiles, setUserFiles] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
      saveUserData,
      loadUserData,
      isLoading,
      hasUnsavedChanges,
      setHasUnsavedChanges,
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