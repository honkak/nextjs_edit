'use client';

import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

interface EditorProps {
  selectedFile: {
    id: string;
    name: string;
    content: string;
  } | null;
}

export default function Editor({ selectedFile }: EditorProps) {
  const [content, setContent] = useState('');
  const { userFiles, setUserFiles } = useUser();

  useEffect(() => {
    if (selectedFile) {
      setContent(selectedFile.content || '');
    } else {
      setContent('');
    }
  }, [selectedFile]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // UserContext의 파일 내용도 함께 업데이트
    if (selectedFile) {
      setUserFiles(prevFiles => {
        const updateFileContent = (items: any[]): any[] => {
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
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">편집기</h2>
          {selectedFile && (
            <div className="text-sm text-gray-400 mt-1">
              현재 파일: {selectedFile.name}
            </div>
          )}
        </div>
        <div className="text-sm text-gray-400">
          글자수: {content.length.toLocaleString()}자
        </div>
      </div>
      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={handleChange}
          className="w-full h-full bg-[#252525] text-white p-4 rounded-lg resize-none focus:outline-none"
          placeholder={selectedFile ? "파일을 편집하세요..." : "파일을 선택하세요..."}
          style={{ fontFamily: 'Malgun Gothic', minHeight: 'calc(100vh - 200px)' }}
        />
      </div>
    </div>
  );
} 