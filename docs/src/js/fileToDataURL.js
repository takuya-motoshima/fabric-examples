/**
 * File to data URL.
 */
export default async file => new Promise(resolve => {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    resolve(reader.result);
  }, {passive: true});
  reader.readAsDataURL(file);
});