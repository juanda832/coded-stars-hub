import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'

if(!process.env.DATABASE_URL_UNPOOLED)throw new Error('Load the private database environment before migrating review spaces')
for(const id of ['admin-owner','admin-isa','admin-ela']){
 const schema='coded_hub_review_'+createHash('sha256').update(id).digest('hex').slice(0,16)
 const result=spawnSync(process.execPath,[fileURLToPath(new URL('./migrate-database.mjs',import.meta.url))],{env:{...process.env,CODED_DATABASE_SCHEMA:schema},stdio:'inherit'})
 if(result.status!==0)process.exit(result.status||1)
}
