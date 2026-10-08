(() => {
 window.PartyButtonProgress={set(button,count,total){
  if(!button)return;
  const valid=Number.isFinite(total)&&total>0&&Number.isFinite(count),value=valid?Math.max(0,Math.min(1,count/total)):0;
  if(button.classList.contains('hp-button-progress')!==valid)button.classList.toggle('hp-button-progress',valid);
  if(button.style.getPropertyValue('--hp-button-progress')!==String(value))button.style.setProperty('--hp-button-progress',String(value));
  if(valid){const description=count+' / '+total;if(button.getAttribute('aria-description')!==description)button.setAttribute('aria-description',description);if(button.dataset.progressCount!==String(count))button.dataset.progressCount=String(count);if(button.dataset.progressTotal!==String(total))button.dataset.progressTotal=String(total);}else{if(button.hasAttribute('aria-description'))button.removeAttribute('aria-description');if('progressCount'in button.dataset)delete button.dataset.progressCount;if('progressTotal'in button.dataset)delete button.dataset.progressTotal;}
 }};
})();
