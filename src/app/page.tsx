import Image from 'next/image'
import FileExplorer from './components/FileExplorer'

export default function Home() {
  return (
    <main className="flex flex-col h-screen">
      {/* 상단 타이틀 */}
      <div className="bg-[#1e1e1e] text-white p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-center">폴라리스 문서 편집기</h1>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex flex-1">
        {/* 좌측 사이드바 - 파일 탐색기 */}
        <div className="w-64 bg-[#1e1e1e] text-white overflow-y-auto border-r border-gray-800">
          <FileExplorer />
        </div>

        {/* 중앙 편집기 */}
        <div className="flex-1 bg-[#1e1e1e] overflow-y-auto">
          <div className="p-4">
            <div className="bg-[#2d2d2d] rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
              <pre className="text-white font-mono">
                <code>{`// Welcome to Glory Editor
function welcome() {
  console.log("Start editing your document");
}
                `}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* 우측 AI 채팅 */}
        <div className="w-80 bg-[#1e1e1e] text-white overflow-y-auto border-l border-gray-800">
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

