(() => {
 window.PartyButtonProgress={set(button,count,total){
  if(!button)return;
  const valid=Number.isFinite(total)&&total>0&&Number.isFinite(count),value=valid?Math.max(0,Math.min(1,count/total)):0;
  button.classList.toggle('hp-button-progress',valid);
  button.style.setProperty('--hp-button-progress',String(value));
  if(valid){button.setAttribute('aria-description',count+' / '+total);button.dataset.progressCount=String(count);button.dataset.progressTotal=String(total);}else{button.removeAttribute('aria-description');delete button.dataset.progressCount;delete button.dataset.progressTotal;}
 }};
})();
