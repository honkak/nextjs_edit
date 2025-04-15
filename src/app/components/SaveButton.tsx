'use client';

import { useUser } from '../contexts/UserContext';
import { FileNode } from '../types/FileNode';

interface SaveButtonProps {
  currentFile: { id: string; name: string; content: string } | null;
}

export default function SaveButton({ currentFile }: SaveButtonProps) {
  const { userFiles, setUserFiles, saveUserData, hasUnsavedChanges, userId, setHasUnsavedChanges } = useUser();

  const handleSave = () => {
    if (!currentFile) return;

    // 먼저 파일 데이터 저장
    saveUserData();
    // 저장 후 변경사항 없음으로 설정
    setHasUnsavedChanges(false);

    // 현재 날짜와 시간
    const now = new Date();
    const dateStr = now.toLocaleString('ko-KR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/[^\d]/g, '');

    // dateStr 형식 변경 (YYMMDD_HHMM_SS)
    const formattedDate = `${dateStr.slice(0,6)}_${dateStr.slice(6,10)}_${dateStr.slice(10)}`;

    // 백업 폴더 찾기
    const findBackupFolder = (items: FileNode[]): string => {
      const backupFolder = items.find(item => 
        item.type === 'folder' && item.name === '백업저장'
      );
      return backupFolder?.id || '';
    };

    const backupFolderId = findBackupFolder(userFiles);

    // 현재 저장된 파일의 최신 내용 가져오기
    const getUpdatedFileContent = (items: FileNode[], fileId: string): string | undefined => {
      for (const item of items) {
        if (item.id === fileId) {
          return item.content;
        }
        if (item.type === 'folder' && item.children) {
          const content = getUpdatedFileContent(item.children, fileId);
          if (content !== undefined) return content;
        }
      }
      return undefined;
    };

    // 백업 폴더가 있을 때만 백업 생성
    if (backupFolderId) {
      const updatedContent = getUpdatedFileContent(userFiles, currentFile.id);
      if (updatedContent === undefined) return;

      // 백업 파일 생성
      const fileName = currentFile.name.replace('.txt', '');
      const backupFileName = `${formattedDate}_${fileName}.txt`;

      // 백업 폴더의 파일 수 확인 및 관리
      setUserFiles(prev => {
        const updateFiles = (items: FileNode[]): FileNode[] => {
          return items.map(item => {
            if (item.id === backupFolderId) {
              // 현재 백업 폴더의 파일들
              const backupFiles = item.children || [];
              
              // 새로운 백업 파일 생성
              const newBackupFile: FileNode = {
                id: Date.now().toString(),
                name: backupFileName,
                type: 'file',
                content: updatedContent
              };

              // 최신 100개만 유지
              const updatedFiles = [...backupFiles, newBackupFile]
                .sort((a, b) => b.name.localeCompare(a.name))
                .slice(0, 100);

              return {
                ...item,
                children: updatedFiles
              };
            }
            if (item.type === 'folder' && item.children) {
              return {
                ...item,
                children: updateFiles(item.children)
              };
            }
            return item;
          });
        };
        return updateFiles([...prev]);
      });

      // 히스토리 데이터 저장
      const historyEntry = {
        date: now.toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        fileName: currentFile.name,
        charCount: updatedContent.length,
        userId: userId || '-'
      };

      const historyData = localStorage.getItem('polaris_history');
      const history = historyData ? JSON.parse(historyData) : [];
      history.push(historyEntry);
      localStorage.setItem('polaris_history', JSON.stringify(history));
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={!hasUnsavedChanges}
      className={`px-4 py-2 rounded text-white transition-colors flex items-center space-x-2
        ${hasUnsavedChanges 
          ? 'bg-blue-600 hover:bg-blue-500' 
          : 'bg-yellow-500 cursor-not-allowed'}`}
    >
      <span>{hasUnsavedChanges ? '💾' : '✓'}</span>
      <span>{hasUnsavedChanges ? '저장하기' : '저장됨'}</span>
    </button>
  );
} 