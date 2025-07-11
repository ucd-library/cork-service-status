import express from 'express';
import setUpStaticRoutes from './static.js';
// import { iconApiMiddleware } from '@ucd-lib/cork-icon';

const app = express();
app.use(express.json());

const api = express.Router();

// const iconsets = [
//   { name: 'fontawesome-6.7-brands', aliases: ['fab']},
//   { name: 'fontawesome-6.7-solid', aliases: ['fas'], preload: ['leaf', 'seedling', 'tree']},
//   { name: 'fontawesome-6.7-regular', aliases: ['far']},
//   { name: 'foo', preload: true}
// ];
// api.use('/icon', iconApiMiddleware({iconsets}));

// routes
app.use('/api', api);
setUpStaticRoutes(app);

app.listen(3000, () => {
  console.log('Demo application is running on port 3000');
});
