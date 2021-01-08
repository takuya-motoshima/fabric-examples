import css from 'rollup-plugin-css-porter';
// import postcss from 'rollup-plugin-postcss';

export default {
  input: 'src/index.js',
  plugins: [
    css()
    // postcss()
  ],
  output: {
    file: 'dist/index.js',
    format: 'umd'
  },
  watch: {
    exclude: 'node_modules/**',
    include: 'src/**'
  }
};
