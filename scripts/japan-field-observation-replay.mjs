#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';
const path='data/japan-original-field-observation-aggregates.json';
const x=JSON.parse(fs.readFileSync(path,'utf8'));
vm.runInThisContext(fs.readFileSync('src/japan-field-study-replay.js','utf8'),{filename:'japan-field-study-replay.js'});
const result={source_status:'PUBLISHED_AGGREGATES_NOT_RAW_MEASUREMENTS',
 yagi:naftJpYagiReplay(x),nishimura:naftJpNishimuraReplay(x),
 actual_field_environment_reproduced:false,methodology_certified:false};
console.log(JSON.stringify(result,null,2));
