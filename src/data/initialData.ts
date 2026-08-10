import { Test } from '../types';

export const initialTests: Test[] = [
  {
    id: 'test-1',
    title: 'SSC CGL Tier 1 Mock (Sample)',
    description: 'A sample full-length mock test covering General Intelligence, General Awareness, Quantitative Aptitude, and English Comprehension.',
    timeLimit: 3600, // 60 minutes
    sections: [
      { name: 'General Intelligence', timeLimit: 900 },
      { name: 'Quantitative Aptitude', timeLimit: 1200 },
      { name: 'English Comprehension', timeLimit: 900 },
      { name: 'General Awareness', timeLimit: 600 }
    ],
    questions: [
      {
        id: 'q1',
        section: 'Quantitative Aptitude',
        text: {
          en: 'If a sum of money doubles itself in 8 years at simple interest, what is the rate of interest per annum?',
          hi: 'यदि कोई धनराशि साधारण ब्याज पर 8 वर्षों में स्वयं की दोगुनी हो जाती है, तो प्रति वर्ष ब्याज दर क्या है?'
        },
        options: [
          { id: 'o1', text: { en: '10%', hi: '10%' } },
          { id: 'o2', text: { en: '12.5%', hi: '12.5%' } },
          { id: 'o3', text: { en: '8%', hi: '8%' } },
          { id: 'o4', text: { en: '15%', hi: '15%' } }
        ],
        correctOptionId: 'o2',
        explanation: {
          en: 'Let Principal = P, Amount = 2P. Interest = P. Rate = $ rac{100 \times P}{P \times 8} = 12.5\% $',
          hi: 'मान लीजिए मूलधन = P, मिश्रधन = 2P. ब्याज = P. दर = $ rac{100 \times P}{P \times 8} = 12.5\% $'
        }
      },
      {
        id: 'q2',
        section: 'General Intelligence',
        text: {
          en: 'Find the missing number in the series: 2, 5, 10, 17, 26, ?',
          hi: 'श्रृंखला में लुप्त संख्या ज्ञात करें: 2, 5, 10, 17, 26, ?'
        },
        options: [
          { id: 'o1', text: { en: '37', hi: '37' } },
          { id: 'o2', text: { en: '35', hi: '35' } },
          { id: 'o3', text: { en: '39', hi: '39' } },
          { id: 'o4', text: { en: '32', hi: '32' } }
        ],
        correctOptionId: 'o1',
        explanation: {
          en: 'The pattern is $n^2 + 1$: $1^2+1=2$, $2^2+1=5$... $6^2+1=37$',
          hi: 'पैटर्न $n^2 + 1$ है: $1^2+1=2$, $2^2+1=5$... $6^2+1=37$'
        }
      }
    ]
  },
  {
    id: 'test-2',
    title: 'English Vocabulary Mini-Test',
    description: 'A quick test for English vocabulary retention.',
    timeLimit: 600,
    sections: [],
    questions: [
      {
        id: 'q3',
        section: 'English Comprehension',
        text: {
          en: 'What is the synonym of "Ephemeral"?',
          hi: '"Ephemeral" का पर्यायवाची क्या है?'
        },
        options: [
          { id: 'o1', text: { en: 'Permanent', hi: 'स्थायी' } },
          { id: 'o2', text: { en: 'Transient', hi: 'क्षणिक' } },
          { id: 'o3', text: { en: 'Crucial', hi: 'महत्वपूर्ण' } },
          { id: 'o4', text: { en: 'Definite', hi: 'निश्चित' } }
        ],
        correctOptionId: 'o2',
        explanation: {
          en: 'Ephemeral means lasting for a very short time. Transient is its synonym.',
          hi: 'Ephemeral का अर्थ है बहुत कम समय तक रहने वाला। Transient इसका पर्यायवाची है।'
        }
      }
    ]
  }
];
