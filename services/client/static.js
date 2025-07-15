import path from 'path';
import spaMiddleware from '@ucd-lib/spa-router-middleware';
import { fileURLToPath } from 'url';
import loaderHtml from './html/loader.html.js';
import { iconsets } from '@ucd-lib/cork-icon';
import config from '../lib/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default (app) => {
  let assetsDir = path.join(__dirname, './dev/public');
  const bundle = `
    <script src='/js/dev/bundle.js?v=${(new Date()).toISOString()}'></script>
  `;

  spaMiddleware({
    app,
    htmlFile : path.join(__dirname, '/html/index.html'),
    isRoot : true,
    appRoutes : config.app.routes.value,
    static : {
      dir : assetsDir
    },
    enable404 : false,

    getConfig : async (req, res, next) => {
      next(config.makeAppConfig());
    },

    template : (req, res, next) => {
      next({
        title: config.app.title.value,
        bundle,
        loaderHtml,
        preloadedIcons: iconsets.preloadIconScript()
      });
    }
  });
};
