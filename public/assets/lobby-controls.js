/* Local, accessible settings picker. The original select remains the source of truth. */
(() => {
  if (!document.documentElement.classList.contains('party-host')) return;
  const enhanced = new WeakSet();
  let active = null;
  function close(focus = false) {
    if (!active) return;
    const old = active; active = null;
    old.menu.hidden = true; old.button.setAttribute('aria-expanded', 'false');
    if (focus) old.button.focus();
  }
  function enhance(select) {
    if (enhanced.has(select) || select.multiple || select.size > 1) return;
    enhanced.add(select);
    const button = document.createElement('button'), menu = document.createElement('div');
    button.type = 'button'; button.className = 'lp-select';
    button.setAttribute('aria-haspopup', 'listbox'); button.setAttribute('aria-expanded', 'false');
    menu.className = 'lp-select-menu'; menu.hidden = true; menu.setAttribute('role', 'listbox');
    menu.id = 'lp-options-' + (select.id || document.querySelectorAll('.lp-select').length);
    button.setAttribute('aria-controls', menu.id);
    const label = select.labels?.[0]?.childNodes;
    const name = select.getAttribute('aria-label') || (label ? [...label].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ') : '') || 'Настройка';
    const sync = () => {
      button.textContent = select.selectedOptions[0]?.textContent || 'Выбрать';
      button.disabled = select.disabled;
      button.setAttribute('aria-label', name + ': ' + button.textContent);
    };
    select.classList.add('lp-native-select'); select.tabIndex = -1;
    select.after(button); document.body.append(menu);
    const open = () => {
      if (button.disabled) return;
      close(); menu.replaceChildren();
      [...select.options].forEach(option => {
        if (option.hidden) return;
        const item = document.createElement('button'); item.type = 'button';
        item.textContent = option.textContent; item.disabled = option.disabled;
        item.setAttribute('role', 'option'); item.setAttribute('aria-selected', String(option.selected));
        item.onclick = () => { select.value = option.value; select.dispatchEvent(new Event('input', {bubbles:true})); select.dispatchEvent(new Event('change', {bubbles:true})); sync(); close(true); };
        menu.append(item);
      });
      const rect = button.getBoundingClientRect();
      menu.style.width = Math.min(Math.max(rect.width, 180), innerWidth - 24) + 'px';
      menu.style.left = Math.max(12, Math.min(rect.left, innerWidth - parseFloat(menu.style.width) - 12)) + 'px';
      menu.hidden = false;
      const room = innerHeight - rect.bottom - 20;
      const below = room >= Math.min(menu.scrollHeight, 220);
      menu.style.maxHeight = Math.max(96, Math.min(320, below ? room : rect.top - 20)) + 'px';
      menu.style.top = (below ? rect.bottom + 8 : Math.max(12, rect.top - menu.getBoundingClientRect().height - 8)) + 'px';
      active = {button, menu}; button.setAttribute('aria-expanded', 'true');
      (menu.querySelector('[aria-selected=true]') || menu.querySelector('button:not(:disabled)'))?.focus();
    };
    button.onclick = () => active?.button === button ? close() : open();
    button.onkeydown = e => { if (['ArrowDown','ArrowUp'].includes(e.key)) {e.preventDefault();open();} };
    menu.onkeydown = e => {
      const items = [...menu.querySelectorAll('button:not(:disabled)')], index = items.indexOf(document.activeElement);
      if (['ArrowDown','ArrowUp','Home','End'].includes(e.key)) {
        e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (index + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length; items[next]?.focus();
      }
      if (e.key === 'Escape') {e.preventDefault();close(true);}
      if (e.key === 'Tab') close();
    };
    select.addEventListener('change', sync);
    new MutationObserver(sync).observe(select, {attributes:true, childList:true, subtree:true});
    sync();
  }
  document.querySelectorAll('select').forEach(enhance);
  document.addEventListener('pointerdown', e => { if (active && !active.menu.contains(e.target) && !active.button.contains(e.target)) close(); });
  window.addEventListener('resize', () => close());
  document.addEventListener('scroll', e => {if (active && !active.menu.contains(e.target)) close();}, true);
})();
