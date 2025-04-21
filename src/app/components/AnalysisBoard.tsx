'use client';

import { useState } from 'react';

interface AnalysisResult {
  statistics: {
    charCount: number;
    sentenceCount: number;
    dialogueCount: number;
    paragraphCount: number;
    averageSentenceLength: number;
    doubleQuoteCount: number;
    singleQuoteCount: number;
    specialDialogueCount: number;
  };
  style: {
    dialogueRatio: number;
    descriptionRatio: number;
    shortSentenceRatio: number;
    longSentenceRatio: number;
  };
  characters: {
    names: string[];
    frequency: Record<string, number>;
    firstAppearance: Record<string, number>;
    categories: Record<string, string[]>;
  };
  keywords: {
    word: string;
    count: number;
  }[];
  endingTypes: {
    dialogue: { word: string; count: number }[];
    description: { word: string; count: number }[];
  };
}

interface AnalysisBoardProps {
  analysis: AnalysisResult | null;
}

interface ModalProps {
  title: string;
  content: JSX.Element;
  onClose: () => void;
}

function Modal({ title, content, onClose }: ModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => {
        // 모달 바깥 영역(오버레이) 클릭 시에만 닫기
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-[#1e3246] rounded-lg shadow-xl w-[900px] max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-[#2a4a66]">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          {content}
        </div>
      </div>
    </div>
  );
}

export default function AnalysisBoard({ analysis }: AnalysisBoardProps) {
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    content: JSX.Element;
  } | null>(null);

  if (!analysis) return null;

  const showModal = (title: string, content: JSX.Element) => {
    setModal({ isOpen: true, title, content });
  };

  const closeModal = () => {
    setModal(null);
  };

  return (
    <>
      <div className="flex h-full p-1.5 space-x-4 text-[11px] text-gray-300">
        {/* 기본 통계 */}
        <div 
          className="flex-1 border-r border-gray-700 pr-4 cursor-pointer hover:bg-[#252525] rounded p-1.5"
          onClick={() => showModal("기본 통계", (
            <div className="space-y-2 text-white text-sm">
              <div>글자수: {analysis.statistics.charCount}자</div>
              <div>문단수: {analysis.statistics.paragraphCount}개</div>
              <div>문장수: {analysis.statistics.sentenceCount}개</div>
              <div>대화문: {analysis.statistics.dialogueCount}개</div>
              <div className="pl-4 text-gray-400">
                <div>- 직접대사: {analysis.statistics.doubleQuoteCount}개</div>
                <div>- 내적독백: {analysis.statistics.singleQuoteCount}개</div>
                <div>- 특수대사: {analysis.statistics.specialDialogueCount}개</div>
              </div>
              <div>평균 문장 길이: {analysis.statistics.averageSentenceLength.toFixed(1)}자</div>
              <div className="mt-4 pt-4 border-t border-[#2a4a66]">
                <div>대화문 비율: {(analysis.style.dialogueRatio * 100).toFixed(1)}%</div>
                <div>묘사문 비율: {(analysis.style.descriptionRatio * 100).toFixed(1)}%</div>
                <div>
                  짧은 문장: {(analysis.style.shortSentenceRatio * 100).toFixed(1)}%
                  <span className="text-gray-400 text-xs ml-3">* 20자 이하</span>
                </div>
                <div>
                  긴 문장: {(analysis.style.longSentenceRatio * 100).toFixed(1)}%
                  <span className="text-gray-400 text-xs ml-3">* 50자 이상</span>
                </div>
              </div>
            </div>
          ))}
        >
          <h3 className="font-semibold mb-0.5 text-[11px]">기본 통계</h3>
          <div className="space-y-0.5">
            <div>글자수: {analysis.statistics.charCount}자</div>
            <div>문단수: {analysis.statistics.paragraphCount}개</div>
            <div>문장수: {analysis.statistics.sentenceCount}개</div>
            <div>대화문: {analysis.statistics.dialogueCount}개</div>
            <div>평균 문장 길이: {analysis.statistics.averageSentenceLength.toFixed(1)}자</div>
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div>대화문 비율: {(analysis.style.dialogueRatio * 100).toFixed(1)}%</div>
              <div>묘사문 비율: {(analysis.style.descriptionRatio * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* 빈 블록 */}
        <div className="flex-1 border-r border-gray-700 pr-4 cursor-default rounded p-1.5">
        </div>

        {/* 개체명 */}
        <div 
          className="flex-1 border-r border-gray-700 pr-4 cursor-pointer hover:bg-[#252525] rounded p-1.5"
          onClick={() => showModal("개체명", (
            <div className="grid grid-cols-2 gap-6 text-white text-sm">
              {/* 왼쪽 열 - 인명 */}
              <div className="space-y-4">
                {Object.entries(analysis.characters.categories)
                  .filter(([category]) => category === '인명')
                  .map(([category, names]) => (
                    <div key={category}>
                      <h4 className="font-semibold mb-2">1. {category}</h4>
                      <div className="space-y-1">
                        {names.length > 0 ? (
                          names.map(name => (
                            <div key={name} className="flex justify-between items-center">
                              <span>{name}</span>
                              <div className="text-gray-400">
                                <span>{analysis.characters.frequency[name]}회</span>
                                <button className="ml-2 text-blue-400 hover:text-blue-300">표시하기</button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400">검색 결과가 없습니다.</div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* 오른쪽 열 - 나머지 카테고리들 */}
              <div className="space-y-4">
                {['조직명', '장소명', '기술명', '사물명', '지위명', '사건명', '기타'].map((categoryName, index) => (
                  <div key={categoryName} className={`${index > 0 ? 'border-t border-[#2a4a66] pt-4' : ''}`}>
                    <h4 className="font-semibold mb-2">{index + 2}. {categoryName}</h4>
                    <div className="space-y-1">
                      {analysis.characters.categories[categoryName]?.length > 0 ? (
                        analysis.characters.categories[categoryName].map(name => (
                          <div key={name} className="flex justify-between items-center">
                            <span>{name}</span>
                            <div className="text-gray-400">
                              <span>{analysis.characters.frequency[name]}회</span>
                              <button className="ml-2 text-blue-400 hover:text-blue-300">표시하기</button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400">검색 결과가 없습니다.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        >
          <h3 className="font-semibold mb-0.5 text-[11px]">개체명</h3>
          <div className="space-y-0.5">
            {Object.entries(analysis.characters.categories).reduce((acc, [category, names]) => {
              if (names.length > 0) {
                acc.push(
                  <div key={category} className="flex justify-between">
                    <span>{category}:</span>
                    <span className="text-gray-400">{names.length}개</span>
                  </div>
                );
              }
              return acc;
            }, [] as JSX.Element[])}
          </div>
        </div>

        {/* 어미 분석 */}
        <div 
          className="flex-1 cursor-pointer hover:bg-[#252525] rounded p-1.5"
          onClick={() => showModal("어미 분석", (
            <div className="grid grid-cols-2 gap-6 text-white text-sm">
              {/* 왼쪽 열 - 묘사문 어미 */}
              <div>
                <h4 className="font-semibold mb-2">1. 묘사문 어미</h4>
                <div className="space-y-1">
                  {analysis.endingTypes.description.map(({ word, count }) => (
                    <div key={word} className="flex justify-between items-center">
                      <span>{word}</span>
                      <div className="text-gray-400">
                        <span>{count}회</span>
                        <button className="ml-2 text-blue-400 hover:text-blue-300">표시하기</button>
                      </div>
                    </div>
                  ))}
                  {analysis.endingTypes.description.length === 0 && (
                    <div className="text-gray-400">검색 결과가 없습니다.</div>
                  )}
                </div>
              </div>

              {/* 오른쪽 열 - 대화문 어미 */}
              <div>
                <h4 className="font-semibold mb-2">2. 대화문 어미</h4>
                <div className="space-y-1">
                  {analysis.endingTypes.dialogue.map(({ word, count }) => (
                    <div key={word} className="flex justify-between items-center">
                      <span>{word}</span>
                      <div className="text-gray-400">
                        <span>{count}회</span>
                        <button className="ml-2 text-blue-400 hover:text-blue-300">표시하기</button>
                      </div>
                    </div>
                  ))}
                  {analysis.endingTypes.dialogue.length === 0 && (
                    <div className="text-gray-400">검색 결과가 없습니다.</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        >
          <h3 className="font-semibold mb-0.5 text-[11px]">어미 분석</h3>
          <div className="space-y-0.5">
            <div>묘사문: {analysis.endingTypes.description.reduce((sum, { count }) => sum + count, 0)}회</div>
            <div>대화문: {analysis.endingTypes.dialogue.reduce((sum, { count }) => sum + count, 0)}회</div>
          </div>
        </div>
      </div>

      {modal?.isOpen && (
        <Modal
          title={modal.title}
          content={modal.content}
          onClose={closeModal}
        />
      )}
    </>
  );
} 