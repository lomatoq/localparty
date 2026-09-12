const fs=require('fs');let s=fs.readFileSync('tests/audit-results.cjs','utf8').replace("['push','tankarena','warsaw','naval']","['naval']");fs.writeFileSync('tests/audit-naval-recheck.cjs',s);
