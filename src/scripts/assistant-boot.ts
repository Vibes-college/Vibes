document.addEventListener('click', async ({ target }) => {
  if ((target as HTMLElement)?.id !== 'assistant-open') return;
  const button = target as HTMLButtonElement;
  button.disabled = true;
  document.getElementById('assistant-load-error')?.setAttribute('hidden', '');
  try {
    await (await import('./assistant')).mountAssistant();
    document.dispatchEvent(new Event('assistant:open'));
  } catch {
    document.getElementById('assistant-load-error')?.removeAttribute('hidden');
  } finally {
    button.disabled = false;
  }
});
