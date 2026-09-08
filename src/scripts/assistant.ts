// Keep the large dependency preload map behind the user's explicit click.
export async function mountAssistant() {
  (await import('./assistant-app')).mountAssistant();
}
