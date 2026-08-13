const fs = require('fs');

const test1 = {
  id: 'test-1',
  title: 'SSC CGL Tier 1 Mock (Sample)',
  description: 'A sample full-length mock test covering General Intelligence, General Awareness, Quantitative Aptitude, and English Comprehension.',
  timeLimit: 3600,
  settings: { strictSectionalTiming: true },
  sections: [
    { name: 'General Intelligence', timeLimit: 900 },
    { name: 'General Awareness', timeLimit: 900 },
    { name: 'Quantitative Aptitude', timeLimit: 900 },
    { name: 'English Comprehension', timeLimit: 900 }
  ],
  questions: []
};

const sections = ['General Intelligence', 'General Awareness', 'Quantitative Aptitude', 'English Comprehension'];
let qIdCounter = 1;

sections.forEach(section => {
  for (let i = 1; i <= 25; i++) {
    test1.questions.push({
      id: `q${qIdCounter}`,
      section: section,
      text: {
        en: `Sample ${section} Question ${i}`,
        hi: `नमूना ${section} प्रश्न ${i}`
      },
      options: [
        { id: 'o1', text: { en: 'Option A', hi: 'विकल्प A' } },
        { id: 'o2', text: { en: 'Option B', hi: 'विकल्प B' } },
        { id: 'o3', text: { en: 'Option C', hi: 'विकल्प C' } },
        { id: 'o4', text: { en: 'Option D', hi: 'विकल्प D' } }
      ],
      correctOptionId: 'o1',
      explanation: {
        en: 'This is a generated sample question to fulfill the 25-question requirement.',
        hi: 'यह 25-प्रश्नों की आवश्यकता को पूरा करने के लिए एक उत्पन्न नमूना प्रश्न है।'
      }
    });
    qIdCounter++;
  }
});

// Add the real questions back to replace the first ones of their respective sections
test1.questions.find(q => q.section === 'Quantitative Aptitude' && q.id.endsWith('51')).text = {
  en: 'If a sum of money doubles itself in 8 years at simple interest, what is the rate of interest per annum?',
  hi: 'यदि कोई धनराशि साधारण ब्याज पर 8 वर्षों में स्वयं की दोगुनी हो जाती है, तो प्रति वर्ष ब्याज दर क्या है?'
};
test1.questions.find(q => q.section === 'Quantitative Aptitude' && q.id.endsWith('51')).options = [
  { id: 'o1', text: { en: '10%', hi: '10%' } },
  { id: 'o2', text: { en: '12.5%', hi: '12.5%' } },
  { id: 'o3', text: { en: '8%', hi: '8%' } },
  { id: 'o4', text: { en: '15%', hi: '15%' } }
];
test1.questions.find(q => q.section === 'Quantitative Aptitude' && q.id.endsWith('51')).correctOptionId = 'o2';
test1.questions.find(q => q.section === 'Quantitative Aptitude' && q.id.endsWith('51')).explanation = {
  en: 'Let Principal = P, Amount = 2P. Interest = P. Rate = $ \\frac{100 \\times P}{P \\times 8} = 12.5\\% $',
  hi: 'मान लीजिए मूलधन = P, मिश्रधन = 2P. ब्याज = P. दर = $ \\frac{100 \\times P}{P \\times 8} = 12.5\\% $'
};

test1.questions.find(q => q.section === 'General Intelligence' && q.id === 'q1').text = {
  en: 'Find the missing number in the series: 2, 5, 10, 17, 26, ?',
  hi: 'श्रृंखला में लुप्त संख्या ज्ञात करें: 2, 5, 10, 17, 26, ?'
};
test1.questions.find(q => q.section === 'General Intelligence' && q.id === 'q1').options = [
  { id: 'o1', text: { en: '37', hi: '37' } },
  { id: 'o2', text: { en: '35', hi: '35' } },
  { id: 'o3', text: { en: '39', hi: '39' } },
  { id: 'o4', text: { en: '32', hi: '32' } }
];
test1.questions.find(q => q.section === 'General Intelligence' && q.id === 'q1').correctOptionId = 'o1';
test1.questions.find(q => q.section === 'General Intelligence' && q.id === 'q1').explanation = {
  en: 'The pattern is $n^2 + 1$: $1^2+1=2$, $2^2+1=5$... $6^2+1=37$',
  hi: 'पैटर्न $n^2 + 1$ है: $1^2+1=2$, $2^2+1=5$... $6^2+1=37$'
};

const test2 = {
    id: 'test-2',
    title: 'English Vocabulary Mini-Test',
    description: 'A quick test for English vocabulary retention.',
    timeLimit: 900,
    sections: [],
    questions: [
      {
        id: 'q101',
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
};

const output = `import { Test } from '../types';

export const initialTests: Test[] = [
  ${JSON.stringify(test1, null, 2)},
  ${JSON.stringify(test2, null, 2)}
];
`;

fs.writeFileSync('src/data/initialData.ts', output);
