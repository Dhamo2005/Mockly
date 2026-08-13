const fs = require('fs');
let code = fs.readFileSync('src/pages/MockTestInterface.tsx', 'utf8');
code = code.replace(/setTimeLeft\(prev => Math\.max\(0, prev - 1\)\);[\s\S]*?\} else \{[\s\S]*?if \(timeLeft <= 1\) \{[\s\S]*?clearInterval\(timer\);[\s\S]*?handleSubmit\(\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?\}, 1000\);/, `
      setTimeLeft(prev => {
        const next = Math.max(0, prev - 1);
        if (!isStrictSectional && next === 0) {
          clearInterval(timer);
          handleSubmit();
        }
        return next;
      });
      
      if (isStrictSectional) {
        setSectionTimeLeft(prev => {
          const currentLeft = prev[currentSectionIndex] || 0;
          return { ...prev, [currentSectionIndex]: Math.max(0, currentLeft - 1) };
        });
      }
    }, 1000);`);
fs.writeFileSync('src/pages/MockTestInterface.tsx', code);
