import path from 'path';
import spaMiddleware from '@ucd-lib/spa-router-middleware';
import { fileURLToPath } from 'url';
import loaderHtml from './html/loader.html.js';
//import { iconsets } from '@ucd-lib/cork-icon';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default (app) => {
  let assetsDir = path.join(__dirname, './dev/public');
  const bundle = `
    <script src='/js/dev/bundle.js?v=${(new Date()).toISOString()}'></script>
  `;
  const routes = [];
  const title = 'UC Davis Library Applications';

  spaMiddleware({
    app,
    htmlFile : path.join(__dirname, '/html/index.html'),
    isRoot : true,
    appRoutes : routes,
    static : {
      dir : assetsDir
    },
    enable404 : false,

    getConfig : async (req, res, next) => {
      next({
        routes : routes,
        title: title,
        //corkIconConfig: {apiPath: '/api/icon'},
        logger: {
          logLevel: process?.env?.LOGGER_LEVEL || 'info'
        }
      });
    },

    template : (req, res, next) => {
      next({
        title,
        bundle,
        loaderHtml,
        //preloadedIcons: iconsets.preloadIconScript()
      });
    }
  });
};
