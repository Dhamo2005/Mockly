const fs = require('fs');
let code = fs.readFileSync('src/store/useStore.ts', 'utf8');

code = code.replace(/processSRSReview: \(questionId: string, quality: number\) => void; \/\/ quality 0-5/, 'processSRSReview: (questionId: string, quality: number) => void; // quality 0-5\n  clearAllData: () => void;');
code = code.replace(/processSRSReview: \(questionId, quality\) => set\(\(state\) => \{/, 'clearAllData: () => set({ tests: [], attempts: [], srsItems: {} }),\n      processSRSReview: (questionId, quality) => set((state) => {');

fs.writeFileSync('src/store/useStore.ts', code);
