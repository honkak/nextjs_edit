'use client';

import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { FileNode } from '../types/FileNode';

interface EditorProps {
  selectedFile: {
    id: string;
    name: string;
    content: string;
  } | null;
  onContentChange?: (newContent: string) => void;
}

export default function Editor({ selectedFile, onContentChange }: EditorProps) {
  const { userFiles, setUserFiles, setHasUnsavedChanges } = useUser();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    
    // 변경사항 있음으로 설정
    setHasUnsavedChanges(true);
    
    // 부모 컴포넌트에 변경 알림
    if (onContentChange) {
      onContentChange(newContent);
    }

    // UserContext의 파일 내용도 함께 업데이트
    if (selectedFile) {
      setUserFiles((prevFiles: FileNode[]) => {
        const updateFileContent = (items: FileNode[]): FileNode[] => {
          return items.map(item => {
            if (item.id === selectedFile.id) {
              return { ...item, content: newContent };
            }
            if (item.type === 'folder' && item.children) {
              return { ...item, children: updateFileContent(item.children) };
            }
            return item;
          });
        };
        return updateFileContent([...prevFiles]);
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] text-white">
      <div className="flex-1 p-4">
        <textarea
          value={selectedFile?.content || ''}
          onChange={handleChange}
          className="w-full h-full bg-[#252525] text-white p-4 rounded-lg resize-none focus:outline-none scrollbar-none"
          placeholder={selectedFile ? "파일을 편집하세요..." : "파일을 선택하세요..."}
          style={{ fontFamily: 'Malgun Gothic', minHeight: 'calc((100vh - 200px) * 0.8)' }}
        />
      </div>
    </div>
  );
} 