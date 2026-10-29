import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
const file=process.env.QA_WORKER_LOG;assert.ok(file&&fs.existsSync(file),'QA_WORKER_LOG must name the captured preview log');
const bytes=fs.readFileSync(file),raw=bytes.toString(bytes[0]===0xff&&bytes[1]===0xfe?'utf16le':'utf8'),log=raw.replace(/\u001b\[[0-9;]*m/g,''),count=pattern=>(log.match(pattern)??[]).length;
const counts={hungRequests:count(/Worker.s code had hung/g),networkConnectionLost:count(/Network connection lost/gi),uncaughtErrors:count(/Uncaught (?:Error|Exception)/gi),errorMarkers:count(/\bERROR\b/g)};
const passed=Object.values(counts).every(n=>n===0),report={passed,file,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),counts,scope:'Captured local preview runtime output only. Combine with successful HTTP, browser and socket checks; an empty log alone proves no working application.'};
fs.writeFileSync(process.env.RUNTIME_AUDIT_REPORT??'outputs/qa/realtime-runtime-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed,bytes:bytes.length,counts}));assert.ok(passed,'Runtime log contains an error');
