'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isMobile } from '../utils/isMobile';

export default function MobilePage() {
  const router = useRouter();

  useEffect(() => {
    // 데스크톱으로 접속 시 메인 페이지로 리다이렉트
    if (!isMobile()) {
      router.push('/');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">모바일 버전 준비 중</h1>
        <p className="text-gray-400">
          현재 서비스는 데스크톱 환경에 최적화되어 있습니다.
          <br />
          모바일 버전은 곧 출시될 예정입니다.
        </p>
        <div className="pt-4">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            데스크톱 버전으로 이동
          </button>
        </div>
      </div>
    </div>
  );
} 