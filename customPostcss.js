import postcssPxtorem from 'postcss-pxtorem';
//import postcssColorFunction from 'postcss-color-function';
import postcssCalc from 'postcss-calc';
import postcssExtractMediaQuery from 'postcss-extract-media-query';

const config = {
  calc: true,
  pxtorem: false,
  colorFunction: false,
  extractMediaQuery: false,
};

const plugins = [];

if (config.calc) {
  plugins.push(postcssCalc());
}

if (config.extractMediaQuery) {
  plugins.push(postcssExtractMediaQuery());
}

if (config.pxtorem) {
  plugins.push(
    postcssPxtorem({
      rootValue: 16,
      unitPrecision: 5,
      propList: ['font', 'font-size', 'line-height', 'letter-spacing'],
      replace: true,
      mediaQuery: false,
      minPixelValue: 0,
      exclude: /node_modules/i,
    })
  );
}

// if (config.colorFunction) {
//   plugins.push(postcssColorFunction());
// }

export default plugins;
