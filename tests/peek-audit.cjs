const fs=require('fs');let s=fs.readFileSync('tests/audit-results.cjs','utf8');console.log(s.match(/for\(const id of[^\n]+/)[0]);
