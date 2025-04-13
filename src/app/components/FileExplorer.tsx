'use client';

import { useState } from 'react';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  parentId?: string;
}

export default function FileExplorer() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [inputType, setInputType] = useState<'file' | 'folder'>('file');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const addNewItem = (type: 'file' | 'folder', parentId?: string) => {
    setInputType(type);
    setShowInput(true);
    setNewItemName('');
    setSelectedFolderId(parentId || null);
  };

  const startEditing = (item: FileNode) => {
    setEditingItemId(item.id);
    setEditingName(item.name.endsWith('.txt') ? item.name.slice(0, -4) : item.name);
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItemId || !editingName.trim()) return;

    const updateItemName = (items: FileNode[]): FileNode[] => {
      return items.map(item => {
        if (item.id === editingItemId) {
          return {
            ...item,
            name: item.type === 'file' ? `${editingName}.txt` : editingName
          };
        }
        if (item.children) {
          return {
            ...item,
            children: updateItemName(item.children)
          };
        }
        return item;
      });
    };

    setFiles(prev => updateItemName(prev));
    setEditingItemId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: FileNode = {
      id: Date.now().toString(),
      name: inputType === 'file' ? `${newItemName}.txt` : newItemName,
      type: inputType,
      children: inputType === 'folder' ? [] : undefined,
      parentId: selectedFolderId || undefined
    };

    setFiles(prev => {
      if (!selectedFolderId) {
        return [...prev, newItem];
      }

      return prev.map(file => {
        if (file.id === selectedFolderId && file.type === 'folder') {
          return {
            ...file,
            children: [...(file.children || []), newItem]
          };
        }
        return updateFileTreeItem(file, selectedFolderId, newItem);
      });
    });

    setShowInput(false);
    setNewItemName('');
    if (inputType === 'folder') {
      setExpandedFolders(prev => {
        const next = new Set(Array.from(prev));
        next.add(newItem.id);
        return next;
      });
    }
  };

  const updateFileTreeItem = (item: FileNode, targetId: string, newItem: FileNode): FileNode => {
    if (item.type !== 'folder' || !item.children) return item;
    
    return {
      ...item,
      children: item.children.map(child => {
        if (child.id === targetId && child.type === 'folder') {
          return {
            ...child,
            children: [...(child.children || []), newItem]
          };
        }
        return updateFileTreeItem(child, targetId, newItem);
      })
    };
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(Array.from(prev));
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, item: FileNode) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-gray-700');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-gray-700');
  };

  const handleDrop = (e: React.DragEvent, targetFolder?: FileNode) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-700');
    const draggedItem = JSON.parse(e.dataTransfer.getData('text/plain')) as FileNode;
    
    if (targetFolder && draggedItem.id === targetFolder.id) return;
    if (targetFolder && isDescendant(draggedItem, targetFolder.id)) return;

    setFiles(prev => {
      // 먼저 아이템을 현재 위치에서 제거
      const removeFromTree = (items: FileNode[]): FileNode[] => {
        return items.filter(item => {
          if (item.id === draggedItem.id) return false;
          if (item.children) {
            item.children = removeFromTree(item.children);
          }
          return true;
        });
      };

      let newFiles = removeFromTree([...prev]);

      // 타겟 폴더가 없으면 최상위로 이동
      if (!targetFolder) {
        return [...newFiles, { ...draggedItem, parentId: undefined }];
      }

      // 타겟 폴더가 있으면 해당 폴더로 이동
      const addToFolder = (items: FileNode[]): FileNode[] => {
        return items.map(item => {
          if (item.id === targetFolder.id) {
            return {
              ...item,
              children: [...(item.children || []), { ...draggedItem, parentId: targetFolder.id }]
            };
          }
          if (item.children) {
            return {
              ...item,
              children: addToFolder(item.children)
            };
          }
          return item;
        });
      };

      return addToFolder(newFiles);
    });
  };

  const isDescendant = (item: FileNode, targetId: string): boolean => {
    if (!item.children) return false;
    return item.children.some(child => 
      child.id === targetId || isDescendant(child, targetId)
    );
  };

  const renderFileTree = (items: FileNode[], depth = 0) => {
    return items.map((item) => (
      <div 
        key={item.id} 
        style={{ marginLeft: `${depth * 20}px` }} 
        className="py-1"
        draggable={true}
        onDragStart={(e) => handleDragStart(e, item)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, item.type === 'folder' ? item : undefined)}
      >
        <div className="flex items-center space-x-2 hover:bg-gray-700 p-1 rounded group">
          {item.type === 'folder' && (
            <button 
              onClick={() => toggleFolder(item.id)}
              className="w-4 text-xs text-gray-400"
            >
              {expandedFolders.has(item.id) ? '▼' : '▶'}
            </button>
          )}
          <span>{item.type === 'folder' ? '📁' : '📄'}</span>
          
          {editingItemId === item.id ? (
            <form onSubmit={handleRename} className="flex-1">
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="w-full px-1 py-0 text-sm bg-gray-700 rounded text-white"
                autoFocus
                onBlur={handleRename}
              />
            </form>
          ) : (
            <span 
              className="text-sm flex-1 cursor-pointer"
              onDoubleClick={() => startEditing(item)}
            >
              {item.name}
            </span>
          )}

          {item.type === 'folder' && (
            <div className="hidden group-hover:flex space-x-1">
              <button
                onClick={() => addNewItem('folder', item.id)}
                className="px-1 text-xs bg-blue-500 hover:bg-blue-600 rounded"
              >
                +폴더
              </button>
              <button
                onClick={() => addNewItem('file', item.id)}
                className="px-1 text-xs bg-green-500 hover:bg-green-600 rounded"
              >
                +파일
              </button>
            </div>
          )}
        </div>
        {item.type === 'folder' && item.children && expandedFolders.has(item.id) && (
          <div className="mt-1">
            {renderFileTree(item.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div 
      className="p-4"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e)}
    >
      <div className="flex justify-between items-center mb-4">
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
        <form onSubmit={handleSubmit} className="mb-4">
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

      <div className="space-y-1">
        {renderFileTree(files)}
      </div>
    </div>
  );
} 