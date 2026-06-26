export function showToast({
  title = 'Info',
  message = '',
  tone = 'info',
} = {}) {
  window.dispatchEvent(
    new CustomEvent(
      'app:toast',
      {
        detail: {
          title,
          message,
          tone,
        },
      }
    )
  );
}
