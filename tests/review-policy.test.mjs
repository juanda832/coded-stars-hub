import test from 'node:test'
import assert from 'node:assert/strict'
import {isHubHashRoute,readRoute} from '../lib/navigation.ts'
import {reviewRole} from '../lib/review-policy.ts'
const admin={id:'admin-isa',role:'admin'}
test('Only an authenticated administrator can choose a fictional review role',()=>{
 for(const role of ['star','host','admin'])assert.equal(reviewRole(admin,'admin-isa:'+role,false),role)
 for(const user of [null,{id:'admin-isa',role:'star'},{id:'admin-isa',role:'host'}])assert.equal(reviewRole(user,'admin-isa:admin',false),null)
})
test('A review cookie is bound to its administrator and never accepts an arbitrary identity',()=>{
 for(const cookie of [undefined,'admin-ela:star','admin-isa:owner','admin-isa:star:extra','star-1:admin','admin-isa:star-2'])assert.equal(reviewRole(admin,cookie,false),null)
})
test('Fictional reviews are disabled when real account data is enabled',()=>{
 for(const role of ['star','host','admin'])assert.equal(reviewRole(admin,'admin-isa:'+role,true),null)
})

test('Known Hub entry links are distinguished from Clerk verification fragments',()=>{
 for(const hash of ['#/inicio','#/revision-beta','#/reuniones','#/mis-solicitudes?vista=confirmadas'])assert.equal(isHubHashRoute(hash),true)
 for(const hash of ['','#/factor-one','#/factor-two','#/verify-email-address','#/sso-callback','#/continue'])assert.equal(isHubHashRoute(hash),false)
})
test('A remembered entry destination still passes the signed-in role boundary',()=>{
 assert.equal(readRoute('#/cuentas','star').section,'Inicio')
 assert.equal(readRoute('#/mis-solicitudes?vista=confirmadas','star').view,'Confirmadas')
 assert.equal(readRoute('#/revision-beta','host').section,'Revisión beta')
})
