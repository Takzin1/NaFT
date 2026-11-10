/* P77 local-only, streaming MAFF field polygon intake.
 * GeoJSON/GeoJSONSeq and optional GDAL ogr2ogr-backed FlatGeobuf conversion.
 * No network, no geometry persistence, no identity auto-approval.
 */
import {createHash} from 'node:crypto';
import {createReadStream,existsSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {extname,resolve,sep} from 'node:path';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import {pathToFileURL} from 'node:url';
import {emptyFieldRegistry,stageObservation,assertFieldRegistry,buildPublicReceipt} from './lib/p77-field-identity.mjs';

const SHA=/^[0-9a-f]{64}$/;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_GEOJSON=16*1024*1024;
function die(code){throw new Error('P77_FUDE_IMPORT_BLOCKED:'+code);}
function ensure(v,code){if(!v)die(code);}
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');

function walkCoordinates(points,out,depth){
 ensure(depth<=6,'GEOMETRY_DEPTH');
 if(Array.isArray(points)&&points.length>=2&&typeof points[0]==='number'){
  ensure(points.length===2&&points.every(Number.isFinite),'COORDINATE_DIMENSIONS');
  const [lon,lat]=points;ensure(lon>=-180&&lon<=180&&lat>=-90&&lat<=90,'COORDINATE_RANGE');
  out.count++;out.minLng=Math.min(out.minLng,lon);out.minLat=Math.min(out.minLat,lat);
  out.maxLng=Math.max(out.maxLng,lon);out.maxLat=Math.max(out.maxLat,lat);
  ensure(out.count<=100000,'GEOMETRY_VERTEX_LIMIT');return;
 }
 ensure(Array.isArray(points)&&points.length>0,'GEOMETRY_NESTING');
 for(const p of points)walkCoordinates(p,out,depth+1);
}
export function normalizeFudeFeature(feature,{issue_year,source_file_sha256,coordinate_system='EPSG:4326'}){
 ensure(feature?.type==='Feature'&&feature.properties&&typeof feature.properties==='object','GEOJSON_FEATURE');
 ensure(coordinate_system==='EPSG:4326','COORDINATE_SYSTEM_UNSUPPORTED');
 const p=feature.properties,g=feature.geometry;
 ensure(g&&['Polygon','MultiPolygon'].includes(g.type),'NOT_POLYGON_GEOMETRY');
 ensure(Array.isArray(g.coordinates),'GEOMETRY_MISSING');
 const poly=g.type==='Polygon'?[g.coordinates]:g.coordinates;
 ensure(Array.isArray(poly)&&poly.length>0,'POLYGON_EMPTY');
 for(const polygon of poly){ensure(Array.isArray(polygon)&&polygon.length>0,'POLYGON_RING_MISSING');
  for(const ring of polygon){ensure(Array.isArray(ring)&&ring.length>=4,'POLYGON_RING_SHORT');
   ensure(JSON.stringify(ring[0])===JSON.stringify(ring.at(-1)),'POLYGON_RING_NOT_CLOSED');
  }
 }
 const bounds={minLng:Infinity,minLat:Infinity,maxLng:-Infinity,maxLat:-Infinity,count:0};
 walkCoordinates(g.coordinates,bounds,0);
 ensure(bounds.count>=4,'GEOMETRY_EMPTY');
 const polygon_uuid=String(p.polygon_uuid||'').toLowerCase();
 ensure(UUID.test(polygon_uuid),'POLYGON_UUID_V4');
 const recordedYear=Number(p.issue_year);
 ensure(Number.isSafeInteger(issue_year)&&issue_year>=2022&&issue_year<=2100&&recordedYear===issue_year,'ISSUE_YEAR_MISMATCH');
 const land_type=Number(p.land_type);
 ensure(land_type===100||land_type===200,'LAND_TYPE_100_OR_200');
 const local_government_cd=String(p.local_government_cd||'');
 ensure(/^\d{6}$/.test(local_government_cd),'LOCAL_GOVERNMENT_CODE');
 const last_polygon_uuid=p.last_polygon_uuid==null||p.last_polygon_uuid===''?null:String(p.last_polygon_uuid).toLowerCase();
 ensure(last_polygon_uuid===null||UUID.test(last_polygon_uuid),'LAST_POLYGON_UUID_V4');
 const history_sha256=p.history==null?null:hash(typeof p.history==='string'?p.history:JSON.stringify(p.history));
 ensure(SHA.test(source_file_sha256),'SOURCE_FILE_HASH');
 return {polygon_uuid,issue_year,land_type,local_government_cd,source_file_sha256,
  geometry_sha256:hash(JSON.stringify(g)),last_polygon_uuid,history_sha256};
}
export async function sha256File(path){
 const h=createHash('sha256');
 for await(const chunk of createReadStream(path))h.update(chunk);
 return h.digest('hex');
}
async function *geojsonSeq(stream){
 const r=createInterface({input:stream,crlfDelay:Infinity});
 try{
  for await(let line of r){line=line.replace(/^\u001e/,'').trim();if(!line)continue;
   ensure(Buffer.byteLength(line,'utf8')<=2*1024*1024,'FEATURE_TOO_LARGE');
   let f;try{f=JSON.parse(line);}catch{die('BAD_GEOJSON_SEQUENCE');}
   yield f;
  }
 }finally{r.close();}
}
async function *fromFgb(path){
 const s=createReadStream(path,{start:0,end:7});let hdr=Buffer.alloc(0);
 for await(const chunk of s)hdr=Buffer.concat([hdr,chunk]);
 ensure(hdr.equals(Buffer.from([0x66,0x67,0x62,0x03,0x66,0x67,0x62,0x01])),'FLATGEOBUF_MAGIC');
 // This local GDAL conversion uses argument arrays (no shell). It does not publish raw geometry.
 // The GDAL driver handles FlatBuffers and transforms geometries to longitude/latitude.
 const child=spawn('ogr2ogr',['-f','GeoJSONSeq','-t_srs','EPSG:4326','/vsistdout/',path],{shell:false,stdio:['ignore','pipe','pipe']});
 let stderr='';child.stderr.setEncoding('utf8');
 child.stderr.on('data',v=>{stderr=(stderr+v).slice(-4000);});
 let error=null;child.on('error',e=>{error=e;});
 for await(const feature of geojsonSeq(child.stdout))yield feature;
 const code=await new Promise(resolve=>child.once('close',resolve));
 ensure(!error&&code===0,'OGR2OGR_UNAVAILABLE_OR_GIS_DECODE_FAILED');
}
export async function importLocalPolygonDataset({input_path,issue_year,prefecture_code,max_features=1000}){
 ensure(typeof input_path==='string'&&input_path.length>0,'INPUT_PATH');
 const path=resolve(input_path);
 ensure(existsSync(path)&&statSync(path).isFile(),'INPUT_FILE_MISSING');
 ensure(Number.isInteger(issue_year)&&issue_year>=2022&&issue_year<=2100,'IMPORT_YEAR');
 ensure(/^\d{2}$/.test(prefecture_code||'')&&Number(prefecture_code)>=1&&Number(prefecture_code)<=47,'PREF_CODE');
 ensure(Number.isInteger(max_features)&&max_features>=1&&max_features<=20000,'MAX_FEATURES');
 const ext=extname(path).toLowerCase();
 ensure(['.fgb','.geojson','.json','.geojsons','.geojsonseq','.ndjson'].includes(ext),'INPUT_FORMAT');
 const source_file_sha256=await sha256File(path);
 let state=emptyFieldRegistry(),count=0,prefErrors=0;
 const take=(feature)=>{
  ensure(count<max_features,'MAX_FEATURES_EXCEEDED');
  const data=normalizeFudeFeature(feature,{issue_year,source_file_sha256});
  ensure(data.local_government_cd.startsWith(prefecture_code),'OTHER_PREF_CODE_REQUIRES_REVIEW');
  state=stageObservation(state,data);count++;
 };
 if(ext==='.fgb'){for await(const feature of fromFgb(path))take(feature);}
 else if(ext==='.geojson'||ext==='.json'){
  ensure(statSync(path).size<=MAX_GEOJSON,'GEOJSON_TOO_LARGE_USE_STREAMING_GEOJSONSEQ');
  const doc=JSON.parse(readFileSync(path,'utf8'));
  ensure(doc.type==='FeatureCollection'&&Array.isArray(doc.features),'FEATURE_COLLECTION');
  for(const feature of doc.features)take(feature);
 }else{for await(const feature of geojsonSeq(createReadStream(path)))take(feature);}
 ensure(count>0,'EMPTY_FILE');
 assertFieldRegistry(state);
 return {state,receipt:{
  ...buildPublicReceipt(state),source_file_sha256,issue_year,prefecture_code,
  decoded_polygons:count,raw_geometry_persisted:false,source_crs_attested:false,
  source_license_verification:'NOT_VERIFIED',parcel_to_soil_spatial_join_performed:false,
  area_ha:null,official_area_ha:null,certified_tco2e:null,
  research_status:'UNREVIEWED_YEAR_SPECIFIC_FUDE_OBSERVATIONS'}};
}
function parseArgs(args){
 const o={};
 for(let i=0;i<args.length;i+=2){
  ensure(args[i]?.startsWith('--')&&typeof args[i+1]==='string','CLI_ARGS');
  o[args[i].slice(2)]=args[i+1];
 }
 ensure(Object.keys(o).every(k=>['input','year','pref','max','private-out'].includes(k)),'CLI_UNKNOWN_OPTION');
 ensure(o.input&&o.year&&o.pref,'CLI_REQUIRED_FIELDS');
 return o;
}
async function main(){
 const o=parseArgs(process.argv.slice(2));
 const result=await importLocalPolygonDataset({input_path:o.input,issue_year:Number(o.year),prefecture_code:o.pref,max_features:o.max?Number(o.max):1000});
 if(o['private-out']){
  const out=resolve(o['private-out']),repo=resolve(process.cwd());
  ensure(out!==repo&&!out.startsWith(repo+sep),'PRIVATE_OUTPUT_MUST_BE_OUTSIDE_REPOSITORY');
  ensure(!existsSync(out),'REFUSE_OVERWRITE_PRIVATE_STATE');
  writeFileSync(out,JSON.stringify(result.state,null,2)+'\n',{flag:'wx',mode:0o600});
 }
 process.stdout.write(JSON.stringify(result.receipt,null,2)+'\n');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 main().catch(e=>{process.stderr.write((/^P77_FUDE_IMPORT_BLOCKED:[A-Z0-9_]+$/.test(e.message)?e.message:'P77_FUDE_IMPORT_BLOCKED:INVALID_ORIGINAL_GIS')+'\n');process.exitCode=1;});
}
