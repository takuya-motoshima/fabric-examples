/**
 * Load image.
 */
export default async url => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin  = 'use-credentials';
  img.src = url;
  img.addEventListener('load', () => {
    resolve(img);
  }, {passive: true});
  img.addEventListener('error', () => {
    reject(new Error(`${url} image cannot be loaded`));
  }, {passive: true});
});