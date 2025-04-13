'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FileNode } from '../types/FileNode';

interface UserContextType {
  userId: string;
  setUserId: (id: string) => void;
  userFiles: FileNode[];
  setUserFiles: React.Dispatch<React.SetStateAction<FileNode[]>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>('');
  const [userFiles, setUserFiles] = useState<FileNode[]>([]);

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
    }
  }, [userId]);

  // 파일 데이터가 변경될 때마다 로컬 스토리지에 저장
  useEffect(() => {
    if (userId && userFiles.length > 0) {
      localStorage.setItem(`files_${userId}`, JSON.stringify(userFiles));
    }
  }, [userFiles]);

  return (
    <UserContext.Provider value={{ userId, setUserId, userFiles, setUserFiles }}>
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