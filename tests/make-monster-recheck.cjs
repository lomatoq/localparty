const fs=require('fs');let s=fs.readFileSync('tests/audit-results-more.cjs','utf8').replace("['monster','crane']","['monster']");fs.writeFileSync('tests/audit-monster-recheck.cjs',s);
