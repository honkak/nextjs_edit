'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  parentId?: string;
  content?: string;
}

export interface UserContextType {
  userId: string;
  setUserId: (id: string) => void;
  userFiles: FileNode[];
  setUserFiles: (files: FileNode[]) => void;
  isLoading: boolean;
  loadUserData: (id: string) => Promise<void>;
  saveUserData: () => void;
  hasUnsavedChanges: boolean;
  apiKey: string;
  setApiKey: (key: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_PREFIX = 'polaris_editor_';

export function UserProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState('');
  const [userFiles, setUserFiles] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // API 키가 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (userId && apiKey) {
      localStorage.setItem(`${STORAGE_PREFIX}${userId}_api_key`, apiKey);
    }
  }, [userId, apiKey]);

  // 사용자 ID가 변경될 때마다 API 키 불러오기
  useEffect(() => {
    if (userId) {
      const savedApiKey = localStorage.getItem(`${STORAGE_PREFIX}${userId}_api_key`);
      if (savedApiKey) {
        setApiKey(savedApiKey);
      } else {
        setApiKey('');
      }
    }
  }, [userId]);

  // 사용자 ID가 변경될 때마다 localStorage에서 데이터 불러오기
  useEffect(() => {
    if (userId) {
      const savedData = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          setUserFiles(parsedData);
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error('Failed to parse saved data:', error);
        }
      }
    }
  }, [userId]);

  // userFiles가 변경될 때마다 unsaved 상태로 표시
  useEffect(() => {
    if (userId && userFiles) {
      setHasUnsavedChanges(true);
    }
  }, [userFiles]);

  const saveUserData = () => {
    if (userId) {
      localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(userFiles));
      setHasUnsavedChanges(false);
    }
  };

  const loadUserData = async (id: string) => {
    setIsLoading(true);
    try {
      // localStorage에서 사용자 데이터 불러오기
      const savedData = localStorage.getItem(`${STORAGE_PREFIX}${id}`);
      
      if (savedData) {
        // 기존 데이터가 있으면 그대로 사용
        const parsedData = JSON.parse(savedData);
        setUserFiles(parsedData);
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
            type: 'file'
          }
        ];

        setUserFiles(demoData);
        localStorage.setItem(`${STORAGE_PREFIX}${id}`, JSON.stringify(demoData));
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
      isLoading,
      loadUserData,
      saveUserData,
      hasUnsavedChanges,
      apiKey,
      setApiKey
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