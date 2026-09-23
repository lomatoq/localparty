'use strict';
// Small numeric interpreter for the weapon format. Never evaluates source as JS.
function expression(value, current=0, reset=current, vars={}, random=()=>.5) {
 if(value==null||/^NONEE?$/i.test(String(value)))return current;
 if(typeof value==='number')return value;
 const text=String(value).toUpperCase().trim();
 const tokens=text.replace(/^INFIX\s+/,'').match(/\d*\.\d+|\d+\.?\d*|[A-Z_][A-Z_0-9]*|<=|>=|==|!=|<>|&&|\|\||[()+*/%<>=!^-]/g)||[];
 const context={...vars,CURRENT:current,RESET:reset,SET:0};let i=0;
 const functions={ABS:Math.abs,FLOOR:Math.floor,CEIL:Math.ceil,ROUND:Math.round,SQRT:x=>Math.sqrt(Math.max(0,x)),SIN:x=>Math.sin(x*Math.PI/180),COS:x=>Math.cos(x*Math.PI/180),TAN:x=>Math.tan(x*Math.PI/180),ATAN:x=>Math.atan(x)*180/Math.PI};
 const prec={'OR':1,'||':1,'AND':2,'&&':2,'=':3,'==':3,'!=':3,'<>':3,'<':4,'>':4,'<=':4,'>=':4,'+':5,'-':5,'*':6,'/':6,'%':6,'^':7};
 function atom(){const t=tokens[i++];if(t==='('){const n=parse(0);if(tokens[i]===')')i++;return n;}if(t==='-')return -atom();if(t==='+')return atom();if(t==='!'||t==='NOT')return +!atom();if(functions[t])return functions[t](atom());if(t==='RND')return Math.floor(random()*32768);if(t==null)return 0;return Number.isFinite(Number(t))?Number(t):Number(context[t])||0;}
 function parse(min){let a=atom();while(i<tokens.length&&prec[tokens[i]]>=min){const op=tokens[i++],b=parse(prec[op]+1);switch(op){case '+':a+=b;break;case '-':a-=b;break;case '*':a*=b;break;case '/':a=b?a/b:0;break;case '%':a=b?a%b:0;break;case '^':a=Math.pow(a,b);break;case '<':a=+(a<b);break;case '>':a=+(a>b);break;case '<=':a=+(a<=b);break;case '>=':a=+(a>=b);break;case '=':case '==':a=+(a===b);break;case '!=':case '<>':a=+(a!==b);break;case 'AND':case '&&':a=+(!!a&&!!b);break;case 'OR':case '||':a=+(!!a||!!b);break;}}return a;}
 let result;
 if(text.startsWith('INFIX'))result=parse(0);
 else {
  result=current;
  while(i<tokens.length){const t=tokens[i++];if(t==='SET'){result=0;continue;}if(t==='RESET'){result=reset;continue;}
   if(t==='RND'){result+=random()*atom();continue;}
   if(['+','-','*','/','%'].includes(t)){const n=atom();if(t==='+')result+=n;else if(t==='-')result-=n;else if(t==='*')result*=n;else if(t==='/')result=n?result/n:0;else result=n?result%n:0;}
   else {i--;const n=atom();result=/^[A-Z_]/.test(t)&&t!=='SET'?n:result+n;}
  }
 }
 return Number.isFinite(result)?result:0;
}
module.exports={expression};
