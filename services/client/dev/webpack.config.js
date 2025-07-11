import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import corkAppBuild from '@ucd-lib/cork-app-build';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let preview = `./public/js/dev`;
let previewFolder = path.join(__dirname, preview);
if( fs.existsSync(previewFolder) ) {
  fs.removeSync(previewFolder);
}

let configs = corkAppBuild.watch({
  root : __dirname,
  entry : path.join(__dirname, './index.js'),
  preview : preview,
  modern : 'bundle.js',
  clientModules : [
    '../node_modules'
  ]
});

if( !Array.isArray(configs) ) configs = [configs];

configs.forEach((config, index) => {
    let cssModule = config.module.rules.find(rule => {
    if( !Array.isArray(rule.use) ) return false;
    return rule.use.includes('css-loader');
  });

  let mindex = cssModule.use.indexOf('css-loader');
  cssModule.use[mindex] = {
    loader: 'css-loader',
    options: {
      url : false
    }
  }
});

export default configs;
