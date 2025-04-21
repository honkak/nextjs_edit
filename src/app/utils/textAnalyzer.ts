export interface AnalysisResult {
  statistics: {
    charCount: number;
    sentenceCount: number;
    dialogueCount: number;
    doubleQuoteCount: number;  // 쌍따옴표 대화문 개수
    singleQuoteCount: number;  // 작은따옴표 대화문 개수
    specialDialogueCount: number;  // 특수대사 개수
    paragraphCount: number;
    averageSentenceLength: number;
  };
  style: {
    dialogueRatio: number;
    descriptionRatio: number;
    shortSentenceRatio: number;
    longSentenceRatio: number;
  };
  endingTypes: {
    dialogue: {
      word: string;
      count: number;
    }[];
    description: {
      word: string;
      count: number;
    }[];
  };
  characters: {
    categories: {
      인명: string[];
      조직명: string[];
      장소명: string[];
      기술명: string[];
      사물명: string[];
      지위명: string[];
      사건명: string[];
      기타: string[];
    };
    frequency: Record<string, number>;
    firstAppearance: Record<string, number>;
  };
  keywords: {
    word: string;
    count: number;
  }[];
}

export const analyzeText = (text: string): AnalysisResult => {
  // 글자수 계산 함수
  const calculateCharCount = (text: string): number => {
    // 빈 줄을 제외한 텍스트로 변환
    const nonEmptyLines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    
    // 각 줄의 텍스트를 그대로 이어붙임 (줄바꿈 없이)
    const processedText = nonEmptyLines.join('');
    
    // 모든 문자 수 계산 (화면에 보이는 실제 텍스트만)
    return processedText.length;
  };

  // 1. 대화문 추출 및 분석
  const doubleQuotes = text.match(/\s*[""\u201C\u201D][^\u201C\u201D"]*[""\u201C\u201D](?!\))/g) || [];
  const singleQuotes = text.match(/\s*[''\u2018\u2019][^\u2018\u2019']*[''\u2018\u2019](?!\))/g) || [];
  const specialDialogues = text.match(/(?:(?:^|\n)\s*-[^.\n]+[.!?]|(?:^|\n)\s*┌[^┘]+┘)/g) || [];
  const dialogues = [...doubleQuotes, ...singleQuotes, ...specialDialogues];
  
  // 2. 대화문을 제외한 텍스트에서 문장 분리
  let processedText = text;
  dialogues.forEach((dialogue, index) => {
    processedText = processedText.replace(dialogue, '');
  });

  // 3. 일반 문장 분리
  const normalSentences = processedText
    .split(/[.!?]\s+/)
    .filter(sentence => sentence.trim().length > 0);

  // 4. 대화문과 일반 문장을 합쳐서 최종 문장 배열 생성
  const finalSentences = [...normalSentences, ...dialogues.map(d => d.trim())];
    
  // 문단 구분 (빈 줄이 2개 이상일 때 또는 *** 패턴이 있을 때 구분)
  const paragraphs = text
    // 먼저 *** 패턴을 특별한 구분자로 변경
    .replace(/\n?\s*\*\*\*\s*\n?/g, '\n\n§§§\n\n')
    // 빈 줄 2개 이상으로 구분
    .split(/\n\s*\n\s*\n/)
    // 각 부분을 다시 §§§ 구분자로 분할
    .flatMap(part => part.split('§§§'))
    // 빈 문단 제거
    .filter(para => para.trim().length > 0);

  // 개체명 추출 및 분류
  const findCharacters = (text: string) => {
    const patterns = {
      인명: [
        /[가-힣]{2,4}(?:씨|군|양|님)(?:\s|$)/g,
        /[가-힣]{2,4}(?:은|는|이|가|을|를|의|와|과)(?:\s|$)/g
      ],
      조직명: [
        /[가-힣a-zA-Z0-9]{2,}(?:주식회사|연구소|대학교|고등학교|중학교|초등학교|학원|기업|재단|그룹|사|팀)(?:\s|$)/g
      ],
      장소명: [
        /[가-힣]{2,}(?:시|군|구|동|읍|면|리|로|길|산|강|천|호|공원|광장)(?:\s|$)/g
      ],
      기술명: [
        /[가-힣a-zA-Z0-9]{2,}(?:기술|시스템|엔진|프로그램|알고리즘|플랫폼)(?:\s|$)/g
      ],
      사물명: [
        /[가-힣]{2,}(?:검|칼|총|차|배|책|컴퓨터|전화|시계)(?:\s|$)/g
      ],
      지위명: [
        /[가-힣]{2,4}(?:왕|공주|왕자|장군|총수|사장|대표|부장|과장|차장|팀장|실장|이사|사원|선생|교수|학생)(?:\s|$)/g
      ],
      사건명: [
        /[가-힣]{2,}(?:전쟁|사건|혁명|운동|축제|행사)(?:\s|$)/g
      ]
    };

    const categories: Record<string, Set<string>> = {
      인명: new Set(),
      조직명: new Set(),
      장소명: new Set(),
      기술명: new Set(),
      사물명: new Set(),
      지위명: new Set(),
      사건명: new Set(),
      기타: new Set()
    };

    // 각 카테고리별로 패턴 매칭
    Object.entries(patterns).forEach(([category, categoryPatterns]) => {
      categoryPatterns.forEach(pattern => {
        const matches = text.match(pattern) || [];
        matches.forEach(match => {
          const name = match.replace(/[은는이가을를의와과님씨군양]/g, '').trim();
          if (name.length >= 2) {
            categories[category].add(name);
          }
        });
      });
    });

    // 이미 다른 카테고리에 포함되지 않은 이름들을 기타로 분류
    const allNames = text.match(/[가-힣]{2,4}(?:은|는|이|가|을|를|의|와|과)(?:\s|$)/g) || [];
    allNames.forEach(match => {
      const name = match.replace(/[은는이가을를의와과]/g, '').trim();
      if (name.length >= 2) {
        let isClassified = false;
        for (const category of Object.keys(categories)) {
          if (category !== '기타' && categories[category].has(name)) {
            isClassified = true;
            break;
          }
        }
        if (!isClassified) {
          categories.기타.add(name);
        }
      }
    });

    return {
      categories: Object.fromEntries(
        Object.entries(categories).map(([category, set]) => [category, Array.from(set)])
      ) as AnalysisResult['characters']['categories']
    };
  };

  // 키워드 추출
  const extractKeywords = (text: string) => {
    const words = text.split(/\s+/);
    const wordCount: Record<string, number> = {};
    
    words.forEach(word => {
      const cleanWord = word.replace(/[은는이가을를의와과]/g, '').trim();
      if (cleanWord.length >= 2) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });
    
    return Object.entries(wordCount)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const characterAnalysis = findCharacters(text);
  const allNames = Object.values(characterAnalysis.categories).flat();
  const characterFrequency: Record<string, number> = {};
  const characterFirstAppearance: Record<string, number> = {};
  
  allNames.forEach(char => {
    characterFrequency[char] = 0;
    characterFirstAppearance[char] = -1;
    
    paragraphs.forEach((para, idx) => {
      const count = (para.match(new RegExp(char, 'g')) || []).length;
      characterFrequency[char] += count;
      
      if (count > 0 && characterFirstAppearance[char] === -1) {
        characterFirstAppearance[char] = idx + 1;
      }
    });
  });

  // 문장 길이 분석
  const sentenceLengths = finalSentences.map(s => s.trim().length);
  const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / finalSentences.length;
  
  // 어미 분석 공통 함수
  const analyzeEndings = (sentences: string[]) => {
    const endings: Record<string, number> = {};
    
    sentences.forEach(sentence => {
      // 문장 끝의 마침표, 느낌표, 물음표 제거
      const cleanSentence = sentence.trim().replace(/[.!?]+$/, '').trim();
      if (!cleanSentence) return;

      // 현재 문장의 단어들
      const words = cleanSentence.split(/\s+/);
      const lastWord = words[words.length - 1];
      
      if (lastWord) {
        // 마지막 단어가 2글자이고 앞 단어가 있는 경우
        if (lastWord.length === 2 && words.length > 1) {
          const prevWord = words[words.length - 2];
          
          // 앞 단어가 한 글자인 경우, 그 앞 단어까지 확인
          if (prevWord.length === 1 && words.length > 2) {
            const prevPrevWord = words[words.length - 3];
            const lastThreeWords = words.slice(-3).join(' ');
            const previousText = cleanSentence.slice(0, -lastThreeWords.length);
            const hasPunctuationBetween = previousText.match(/[.!?]/);
            
            if (!hasPunctuationBetween) {
              // 문장 부호가 없으면 세 단어를 합쳐서 저장
              const combinedWord = prevPrevWord + ' ' + prevWord + ' ' + lastWord;
              endings[combinedWord] = (endings[combinedWord] || 0) + 1;
              return;
            }
          }
          
          // 앞 단어가 한 글자가 아닌 경우, 이전 로직대로 처리
          const lastTwoWords = words.slice(-2).join(' ');
          const previousText = cleanSentence.slice(0, -lastTwoWords.length);
          const hasPunctuationBetween = previousText.match(/[.!?]/);
          
          if (!hasPunctuationBetween) {
            // 문장 부호가 없으면 두 단어를 합쳐서 저장
            const combinedWord = prevWord + ' ' + lastWord;
            endings[combinedWord] = (endings[combinedWord] || 0) + 1;
            return;
          }
        }
        
        // 한 글자 어미는 제외
        if (lastWord.length > 1) {
          endings[lastWord] = (endings[lastWord] || 0) + 1;
        }
      }
    });

    // 빈도수 기준으로 정렬하여 반환
    return Object.entries(endings)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
  };

  // 대화문 어미 분석 함수
  const analyzeDialogueEndings = (dialogues: string[]) => {
    const dialogueSentences = dialogues.map(dialogue => {
      // 대화문에서 따옴표 제거하고 문장 부호로 분리
      return dialogue
        .replace(/[""''\u201C\u201D\u2018\u2019]/g, '')
        .trim()
        .split(/[.!?]/)
        .filter(s => s.trim().length > 0);
    }).flat();
    
    return analyzeEndings(dialogueSentences);
  };

  // 대화문과 묘사문 분리 및 분석
  const dialogueEndings = analyzeDialogueEndings([...doubleQuotes, ...singleQuotes, ...specialDialogues]);
  
  // 묘사문 분석을 위해 대화문이 아닌 문장들만 추출
  const descriptionSentences = processedText
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  const descriptionEndings = analyzeEndings(descriptionSentences);

  return {
    statistics: {
      charCount: calculateCharCount(text),
      sentenceCount: finalSentences.length,
      dialogueCount: dialogues.length,
      doubleQuoteCount: doubleQuotes.length,
      singleQuoteCount: singleQuotes.length,
      specialDialogueCount: specialDialogues.length,
      paragraphCount: paragraphs.length,
      averageSentenceLength: avgLength
    },
    style: {
      dialogueRatio: dialogues.length / finalSentences.length,
      descriptionRatio: normalSentences.length / finalSentences.length,
      shortSentenceRatio: sentenceLengths.filter(len => len <= 20).length / finalSentences.length,
      longSentenceRatio: sentenceLengths.filter(len => len >= 50).length / finalSentences.length
    },
    endingTypes: {
      dialogue: dialogueEndings,
      description: descriptionEndings
    },
    characters: {
      categories: characterAnalysis.categories,
      frequency: characterFrequency,
      firstAppearance: characterFirstAppearance
    },
    keywords: extractKeywords(text)
  };
}; 