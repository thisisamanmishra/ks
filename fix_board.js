const fs = require('fs');
const file = 'e:/karyasaarthi/app/admin/board/page.tsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.includes("activeTab === 'about' && ("));
const endIndex = lines.findIndex(l => l.includes("activeTab === 'brand' && ("));

if (startIndex !== -1 && endIndex !== -1) {
    const importStr = "import AboutPageManager from '@/components/admin/AboutPageManager'";
    if (!content.includes('AboutPageManager')) {
        let importSection = lines.findIndex(l => l.includes('import { useSearchParams'));
        lines.splice(importSection + 1, 0, importStr);
    }
    
    // find again because we might have added a line
    const sIdx = lines.findIndex(l => l.includes("activeTab === 'about' && ("));
    const eIdx = lines.findIndex(l => l.includes("activeTab === 'brand' && ("));
    
    const replacement = [
      '      {/* ── ABOUT PAGE TAB ── */}',
      "      {activeTab === 'about' && <AboutPageManager />}",
      ''
    ];
    // Start index is the start of the About block
    // We want to delete until the start of the Brand block
    
    // It's safer to find the comment line `/* ── ABOUT PAGE TAB ── */` if it exists
    let startRemove = sIdx;
    if (lines[sIdx - 1].includes('ABOUT PAGE TAB')) {
        startRemove = sIdx - 1;
    }
    
    let endRemove = eIdx - 1;
    if (lines[eIdx - 1].includes('BRAND ASSETS TAB')) {
        endRemove = eIdx - 2; // don't remove brand assets comment, we'll reinsert space
    }
    
    lines.splice(startRemove, eIdx - startRemove, ...replacement);
    
    fs.writeFileSync(file, lines.join('\n'));
    console.log('Successfully replaced About section');
} else {
    console.log('Failed to find indices', startIndex, endIndex);
}
