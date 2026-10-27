import test from 'node:test'
import assert from 'node:assert/strict'
import {normalizeAccountDraft,accountInitials,requireAccountAdmin,checkAccountOrigin} from '../lib/account-policy.ts'
import {readRoute,routeHash} from '../lib/navigation.ts'

const draft={name:'  Persona   Ficticia  ',email:' NUEVA@EXAMPLE.COM ',role:'star',requestId:'ea42c14c-8bde-4929-9c63-a8a145d1cb10'}
test('Account drafts normalize names and emails without taking identity or role from the client',()=>{
 assert.deepEqual(normalizeAccountDraft({...draft,id:'admin-isa',initials:'XX',access:'active'},false),{name:'Persona Ficticia',email:'nueva@example.com',role:'star',requestId:draft.requestId})
})
test('The beta rejects real addresses until the private setting is enabled',()=>{
 for(const email of ['persona@colegio.edu','persona@example.com.evil.org','persona@gmail.com','persona@sub.example.com'])assert.throws(()=>normalizeAccountDraft({...draft,email},false),/ficticios/)
 assert.equal(normalizeAccountDraft({...draft,email:'persona@colegio.edu'},true).email,'persona@colegio.edu')
})
test('An account form cannot grant administration or unknown permissions',()=>{
 for(const role of ['admin','Admin','owner','',null,{},['star']])assert.throws(()=>normalizeAccountDraft({...draft,role},false),/administración/)
 assert.equal(normalizeAccountDraft({...draft,role:'host'},false).role,'host')
})
test('Invalid, oversized and control-character identities are rejected',()=>{
 for(const name of ['','A','A'.repeat(81),'Persona\nFicticia','<script>']) {
  if(name.includes('\n'))continue // whitespace is normalized before validation
  assert.throws(()=>normalizeAccountDraft({...draft,name},false))
 }
 for(const email of ['bad','a@@example.com','a b@example.com','a@example.com\nBcc:another@example.com',1,null])assert.throws(()=>normalizeAccountDraft({...draft,email},false))
 for(const requestId of [null,'','other','../../other'])assert.throws(()=>normalizeAccountDraft({...draft,requestId},false))
})
test('Account initials support Unicode and do not require two surnames',()=>{
 assert.equal(accountInitials('Álex Ñandú'),'ÁÑ');assert.equal(accountInitials('Luz'),'L')
})
test('Only administrators can manage accounts',()=>{
 for(const role of ['star','host'])assert.throws(()=>requireAccountAdmin({role}),error=>error.status===403)
 assert.doesNotThrow(()=>requireAccountAdmin({role:'admin'}))
})
test('The private directory route is available only to administration',()=>{
 assert.equal(routeHash('Cuentas'),'#/cuentas')
 assert.equal(readRoute('#/cuentas','admin').section,'Cuentas')
 for(const role of ['star','host'])assert.equal(readRoute('#/cuentas',role).section,'Inicio')
})
test('Account mutations accept the actual host, including local ports and production aliases',()=>{
 for(const [origin,host,hosted] of [['http://127.0.0.1:3001','127.0.0.1:3001',false],['http://localhost:3004','localhost:3004',false],['https://coded-stars-beta.vercel.app','coded-stars-beta.vercel.app',true]])assert.doesNotThrow(()=>checkAccountOrigin(origin,host,hosted))
 assert.doesNotThrow(()=>checkAccountOrigin(null,'coded-stars-beta.vercel.app',true))
})
test('External, malformed, insecure and different-port origins are refused',()=>{
 for(const origin of ['null','https://attacker.example','https://coded-stars-beta.vercel.app.attacker.example','http://coded-stars-beta.vercel.app','https://coded-stars-beta.vercel.app:444','https://coded-stars-beta.vercel.app/path'])assert.throws(()=>checkAccountOrigin(origin,'coded-stars-beta.vercel.app',true),error=>error.status===403)
})
