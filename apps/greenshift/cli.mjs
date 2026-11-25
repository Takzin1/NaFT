import {readFileSync} from 'node:fs';
import {simulate} from './engine.mjs';
try { const path=process.argv[2]; if(!path)throw Error('Usage: node cli.mjs scenario.json'); console.log(JSON.stringify(simulate(JSON.parse(readFileSync(path,'utf8'))),null,2)); } catch(e){console.error(e.message);process.exitCode=1;}
