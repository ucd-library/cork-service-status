// all global styles should be imported here
import sharedStyles from '@ucd-lib/theme-sass/style-ucdlib.css';
import brandCssProps from '@ucd-lib/theme-sass/css-properties.css';
import fonts from './fonts.css';

const styles = `
  ${sharedStyles}
  ${brandCssProps}
  ${fonts}
`;

let sharedStyleElement = document.createElement('style');
sharedStyleElement.innerHTML = styles;
document.head.appendChild(sharedStyleElement);
