'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

interface FileExplorerProps {
  onFileSelect: (file: { id: string; name: string; content: string }) => void;
  selectedFile: { id: string; name: string; content: string } | null;
}

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
}

export default function FileExplorer({ onFileSelect, selectedFile }: FileExplorerProps) {
  const { userFiles, setUserFiles } = useUser();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<{ id: string; type: 'file' | 'folder' } | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [inputType, setInputType] = useState<'file' | 'folder'>('file');
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    item: FileNode | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    item: null
  });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const getFolderDepth = (items: FileNode[], targetId: string, currentDepth = 0): number => {
    for (const item of items) {
      if (item.id === targetId) {
        return currentDepth;
      }
      if (item.type === 'folder' && item.children) {
        const depth = getFolderDepth(item.children, targetId, currentDepth + 1);
        if (depth !== -1) return depth;
      }
    }
    return -1;
  };

  const addNewItem = (type: 'file' | 'folder', parentId?: string) => {
    setInputType(type);
    setShowInput(true);
    setNewItemName('');
    setSelectedFolderId(parentId || null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: FileNode = {
      id: Date.now().toString(),
      name: inputType === 'file' ? `${newItemName}.txt` : newItemName,
      type: inputType,
      children: inputType === 'folder' ? [] : undefined,
      content: inputType === 'file' ? '' : undefined
    };

    setUserFiles(prev => {
      if (!selectedFolderId) {
        return [...prev, newItem];
      }

      const addToFolder = (items: FileNode[]): FileNode[] => {
        return items.map(item => {
          if (item.id === selectedFolderId && item.type === 'folder') {
            return {
              ...item,
              children: [...(item.children || []), newItem]
            };
          }
          if (item.type === 'folder' && item.children) {
            return {
              ...item,
              children: addToFolder(item.children)
            };
          }
          return item;
        });
      };

      return addToFolder([...prev]);
    });

    setShowInput(false);
    setNewItemName('');
    if (inputType === 'folder') {
      setExpandedFolders(prev => {
        const newSet = new Set(prev);
        newSet.add(newItem.id);
        return newSet;
      });
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleDragStart = (e: React.DragEvent, item: { id: string; type: 'file' | 'folder' }) => {
    if (item.type === 'folder') {
      e.preventDefault();
      return;
    }
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
  };

  const handleDragOver = (e: React.DragEvent, folderId?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (folderId) {
      setDragOverFolder(folderId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverFolder(null);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    if (!draggedItem) return;

    const draggedItemId = e.dataTransfer.getData('text/plain');
    if (!draggedItemId) return;

    const findItem = (items: FileNode[], itemId: string): FileNode | null => {
      for (const item of items) {
        if (item.id === itemId) {
          return item;
        }
        if (item.type === 'folder' && item.children) {
          const found = findItem(item.children, itemId);
          if (found) return found;
        }
      }
      return null;
    };

    const removeItem = (items: FileNode[], itemId: string): FileNode[] => {
      return items.filter(item => {
        if (item.id === itemId) {
          return false;
        }
        if (item.type === 'folder' && item.children) {
          item.children = removeItem(item.children, itemId);
        }
        return true;
      });
    };

    const addItem = (items: FileNode[], newItem: FileNode, targetFolderId: string | null): FileNode[] => {
      if (targetFolderId === null) {
        return [...items, newItem];
      }

      return items.map(currentItem => {
        if (currentItem.id === targetFolderId && currentItem.type === 'folder') {
          return {
            ...currentItem,
            children: [...(currentItem.children || []), newItem]
          };
        }
        if (currentItem.type === 'folder' && currentItem.children) {
          return {
            ...currentItem,
            children: addItem(currentItem.children, newItem, targetFolderId)
          };
        }
        return currentItem;
      });
    };

    setUserFiles(prevFiles => {
      // 이동할 파일 찾기
      const itemToMove = findItem([...prevFiles], draggedItemId);
      if (!itemToMove || itemToMove.type === 'folder') return prevFiles;

      // 새로운 파일 생성 (기존 파일과 동일한 내용)
      const newFile: FileNode = {
        id: Date.now().toString(), // 새로운 ID 생성
        name: itemToMove.name,
        type: 'file',
        content: itemToMove.content // 기존 파일의 내용을 그대로 복사
      };

      // 새로운 파일을 먼저 추가
      const filesWithNewItem = addItem([...prevFiles], newFile, targetFolderId);

      // 내용이 정확히 복사되었는지 확인
      const verifyContent = (items: FileNode[]): boolean => {
        for (const item of items) {
          if (item.id === newFile.id) {
            return item.content === itemToMove.content;
          }
          if (item.type === 'folder' && item.children) {
            if (verifyContent(item.children)) return true;
          }
        }
        return false;
      };

      // 내용이 정확히 복사되었는지 확인
      const isContentCopied = verifyContent(filesWithNewItem);

      // 내용이 정확히 복사되었다면 기존 파일 삭제
      if (isContentCopied) {
        const updatedFiles = removeItem(filesWithNewItem, draggedItemId);
        
        // Editor 컴포넌트의 상태도 업데이트
        if (selectedFile && selectedFile.id === draggedItemId) {
          onFileSelect({
            id: newFile.id,
            name: newFile.name,
            content: newFile.content || ''
          });
        }
        
        return updatedFiles;
      }

      // 내용이 복사되지 않았다면 기존 파일 유지
      return prevFiles;
    });

    setDraggedItem(null);
    setDragOverFolder(null);
  };

  // 컨텍스트 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, item: FileNode) => {
    e.preventDefault();
    // 백업저장 폴더와 임시.txt 파일은 컨텍스트 메뉴를 표시하지 않음
    if (item.name === '백업저장' || item.name === '임시.txt') {
      return;
    }
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item
    });
  };

  const handleDelete = (item: FileNode) => {
    if (!item || item.name === '백업저장' || item.name === '임시.txt') return;

    const removeItem = (items: FileNode[], itemId: string): FileNode[] => {
      return items.filter(currentItem => {
        if (currentItem.id === itemId) {
          return false;
        }
        if (currentItem.type === 'folder' && currentItem.children) {
          currentItem.children = removeItem(currentItem.children, itemId);
        }
        return true;
      });
    };

    setUserFiles(prev => removeItem([...prev], item.id));
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleRename = (item: FileNode) => {
    if (!item || item.name === '백업저장' || item.name === '임시.txt') return;
    
    setInputType(item.type);
    setNewItemName(item.type === 'file' ? item.name.replace('.txt', '') : item.name);
    setShowInput(true);
    setSelectedFolderId(item.id);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const renderFileTree = (items: FileNode[], level = 0) => {
    return items.map(item => {
      const currentDepth = getFolderDepth(userFiles, item.id);
      const canAddFolder = currentDepth < 2;

      return (
        <div key={item.id} className="relative group">
          <div
            className={`flex items-center py-1 px-2 hover:bg-gray-700 rounded cursor-pointer ${
              draggedItem?.id === item.id ? 'opacity-50' : ''
            } ${
              dragOverFolder === item.id ? 'bg-blue-900' : ''
            }`}
            draggable={item.type === 'file'}
            onDragStart={(e) => handleDragStart(e, { id: item.id, type: item.type })}
            onDragOver={(e) => handleDragOver(e, item.type === 'folder' ? item.id : undefined)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item.type === 'folder' ? item.id : null)}
            onClick={() => {
              if (item.type === 'folder') {
                toggleFolder(item.id);
              } else {
                onFileSelect({ id: item.id, name: item.name, content: item.content || '' });
              }
            }}
            onContextMenu={(e) => handleContextMenu(e, item)}
          >
            <div style={{ paddingLeft: `${level * 1}rem` }} className="flex items-center">
              {item.type === 'folder' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFolder(item.id);
                  }}
                  className="w-4 text-xs text-gray-400 mr-1"
                >
                  {expandedFolders.has(item.id) ? '▼' : '▶'}
                </button>
              )}
              {item.type === 'folder' ? (
                <span className="mr-1">{expandedFolders.has(item.id) ? '📂' : '📁'}</span>
              ) : (
                <span className="mr-1">📄</span>
              )}
              <span className={`text-sm ${
                item.type === 'file' && 
                items.find(f => f.type === 'folder' && f.name === '백업저장')?.id === 
                items.find(f => f.children?.some(child => child.id === item.id))?.id
                ? 'text-[0.7em]' 
                : ''
              }`}>{item.name}</span>
            </div>
            {item.type === 'folder' && (
              <div className="hidden group-hover:flex space-x-1 ml-auto" onClick={e => e.stopPropagation()}>
                {item.name !== '백업저장' && (
                  <>
                    {canAddFolder && (
                      <button
                        onClick={() => addNewItem('folder', item.id)}
                        className="px-1 text-xs bg-blue-500 hover:bg-blue-600 rounded"
                      >
                        +폴더
                      </button>
                    )}
                    <button
                      onClick={() => addNewItem('file', item.id)}
                      className="px-1 text-xs bg-green-500 hover:bg-green-600 rounded"
                    >
                      +파일
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {item.type === 'folder' && expandedFolders.has(item.id) && item.children && (
            <div className="ml-2">
              {renderFileTree(item.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-[#1e1e1e] text-white p-2 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-sm font-semibold">파일 탐색기</h2>
        <div className="space-x-2">
          <button
            onClick={() => addNewItem('folder')}
            className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 rounded"
          >
            새 폴더
          </button>
          <button
            onClick={() => addNewItem('file')}
            className="px-2 py-1 text-xs bg-green-500 hover:bg-green-600 rounded"
          >
            새 파일
          </button>
        </div>
      </div>

      {showInput && (
        <form onSubmit={handleSubmit} className="p-2 border-b border-gray-800">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={inputType === 'folder' ? "폴더 이름" : "파일 이름"}
              className="flex-1 px-2 py-1 text-sm bg-gray-700 rounded text-white"
              autoFocus
            />
            <button
              type="submit"
              className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 rounded"
            >
              생성
            </button>
          </div>
        </form>
      )}

      {contextMenu.visible && contextMenu.item && (
        <div
          ref={contextMenuRef}
          className="fixed bg-gray-800 text-white rounded shadow-lg py-1 z-50"
          style={{
            top: contextMenu.y,
            left: contextMenu.x
          }}
        >
          <button
            onClick={() => handleRename(contextMenu.item!)}
            className="w-full px-4 py-2 text-left hover:bg-gray-700"
          >
            이름 바꾸기
          </button>
          <button
            onClick={() => handleDelete(contextMenu.item!)}
            className="w-full px-4 py-2 text-left hover:bg-gray-700 text-red-400"
          >
            삭제
          </button>
        </div>
      )}

      <div 
        className="flex-1 overflow-y-auto p-2"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, null)}
      >
        {renderFileTree(userFiles)}
      </div>
    </div>
  );
} 