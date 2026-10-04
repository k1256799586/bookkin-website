import { readFile, mkdir, copyFile, writeFile } from 'node:fs/promises';
import satori from 'satori';
import sharp from 'sharp';

const fontRoot = 'node_modules/@fontsource/newsreader';
const regular = await readFile(`${fontRoot}/files/newsreader-latin-400-normal.woff`);
const italic = await readFile(`${fontRoot}/files/newsreader-latin-400-italic.woff`);
const icon = await readFile('public/bookkin-icon.png');
const el = (type, props, ...children) => ({ type, props: { ...props, children: children.length === 1 ? children[0] : children } });
const svg = await satori(el('div', { style: { display:'flex', width:'100%', height:'100%', background:'#f6f5ef', color:'#252820', padding:'70px 80px', position:'relative', fontFamily:'Newsreader' } },
  el('div', { style: { display:'flex', flexDirection:'column', justifyContent:'space-between', width:'100%' } },
    el('div', { style: { display:'flex', alignItems:'center', gap:16 } },
      el('img', { src:`data:image/png;base64,${icon.toString('base64')}`, width:50, height:50, style:{ borderRadius:12 } }),
      el('span', { style:{ fontSize:34 } }, 'Bookkin'),
    ),
    el('div', { style:{ display:'flex', flexDirection:'column', fontSize:100, letterSpacing:-4, lineHeight:1 } },
      el('div', { style:{ display:'flex' } }, 'Your books.'),
      el('div', { style:{ display:'flex', fontStyle:'italic', color:'#6a735a' } }, 'Your kind of people.'),
    ),
    el('div', { style:{ display:'flex', fontSize:27, color:'#676b60' } }, 'A quiet social library.'),
  ),
), { width:1200, height:630, fonts:[{name:'Newsreader',data:regular,weight:400,style:'normal'},{name:'Newsreader',data:italic,weight:400,style:'italic'}] });
await mkdir('public/licenses', { recursive:true });
await writeFile('public/og.png', await sharp(Buffer.from(svg)).png().toBuffer());
await copyFile(`${fontRoot}/LICENSE`, 'public/licenses/newsreader-OFL.txt');
await copyFile('node_modules/@fontsource-variable/manrope/LICENSE', 'public/licenses/manrope-OFL.txt');
console.log('Generated 1200×630 sharing image and retained font licenses.');
