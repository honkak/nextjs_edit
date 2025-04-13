'use client';

import Image from 'next/image'
import FileExplorer from './components/FileExplorer'
import { useState } from 'react'
import SaveButton from './components/SaveButton'
import History from './components/History'
import UserIdInput from './components/UserIdInput'
import Editor from './components/Editor'

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<{ id: string; name: string; content: string } | null>(null);

  return (
    <main className="flex flex-col h-screen overflow-hidden">
      {/* 상단 타이틀 */}
      <div className="bg-[#1e1e1e] text-white p-4 border-b border-gray-800 relative flex-shrink-0">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center">
          <SaveButton currentFile={selectedFile} />
          <History />
        </div>
        <h1 className="text-2xl font-bold text-center">폴라리스 문서 편집기</h1>
        <UserIdInput />
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 사이드바 - 파일 탐색기 */}
        <div className="w-64 bg-[#1e1e1e] text-white overflow-y-auto border-r border-gray-800">
          <FileExplorer
            onFileSelect={(file) => setSelectedFile(file)}
            selectedFile={selectedFile}
          />
        </div>

        {/* 중앙 편집기 */}
        <div className="flex-1 bg-[#1e1e1e] overflow-y-auto">
          <Editor selectedFile={selectedFile} />
        </div>

        {/* 우측 AI 채팅 */}
        <div className="w-96 bg-[#1e1e1e] text-white border-l border-gray-800 flex flex-col overflow-hidden">
          <div className="p-4">
            <h2 className="text-sm font-semibold mb-4">AI 어시스턴트</h2>
            <div className="bg-[#2d2d2d] rounded-lg p-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    AI
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">무엇을 도와드릴까요?</p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

