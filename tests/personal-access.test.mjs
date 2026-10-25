import test from 'node:test'
import assert from 'node:assert/strict'
import {resolvePersonalUser} from '../lib/auth-policy.ts'
import {requirePersonalAccess} from '../lib/auth-mode.ts'
const account={id:'admin-isa',name:'Isa',email:'isa@example.com',role:'admin',initials:'IS'}
const identity=changes=>({externalId:'coded-stars-hub:admin-isa',privateMetadata:{codedHub:{userId:'admin-isa',role:'admin'}},emailAddresses:[{emailAddress:'isa@example.com',verification:{status:'verified'}}],...changes})
test('A verified provisioned identity receives its server-defined administrator permissions',()=>assert.deepEqual(resolvePersonalUser(identity(),[account]),account))
test('Reserved or unverified addresses do not open an administrator session',()=>{
 for(const status of ['reserved','unverified','failed','expired'])assert.equal(resolvePersonalUser(identity({emailAddresses:[{emailAddress:account.email,verification:{status}}]}),[account]),null)
})
test('A verified address belonging to another person is rejected',()=>assert.equal(resolvePersonalUser(identity({emailAddresses:[{emailAddress:'other@example.com',verification:{status:'verified'}}]}),[account]),null))
test('Address comparison tolerates case without changing the user or its permissions',()=>assert.equal(resolvePersonalUser(identity({emailAddresses:[{emailAddress:'ISA@EXAMPLE.COM',verification:{status:'verified'}}]}),[account]).id,account.id))
test('Unknown identities and namespaces cannot select an existing Hub account',()=>{
 for(const externalId of [null,'admin-isa','other:admin-isa','coded-stars-hub:unknown'])assert.equal(resolvePersonalUser(identity({externalId}),[account]),null)
})
test('Client-editable metadata cannot grant permissions',()=>assert.equal(resolvePersonalUser(identity({privateMetadata:{},unsafeMetadata:{codedHub:{userId:'admin-isa',role:'admin'}},publicMetadata:{role:'admin'}}),[account]),null))
test('Private role and identity must match the authoritative directory',()=>{
 for(const codedHub of [{userId:'admin-ela',role:'admin'},{userId:'admin-isa',role:'host'},null,[],{}])assert.equal(resolvePersonalUser(identity({privateMetadata:{codedHub}}),[account]),null)
})
test('Changing a server-side role revokes an older incompatible grant',()=>assert.equal(resolvePersonalUser(identity(),[{...account,role:'host'}]),null))
test('Missing, locked and banned identities are refused',()=>{
 assert.equal(resolvePersonalUser(null,[account]),null)
 assert.equal(resolvePersonalUser(identity({banned:true}),[account]),null)
 assert.equal(resolvePersonalUser(identity({locked:true}),[account]),null)
})
test('Vercel always requires personal authentication even if a public flag is omitted',()=>{
 assert.equal(requirePersonalAccess({VERCEL:'1'}),true)
 assert.equal(requirePersonalAccess({VERCEL:'1',NEXT_PUBLIC_CODED_AUTH_MODE:'demo'}),true)
 assert.equal(requirePersonalAccess({NEXT_PUBLIC_CODED_AUTH_MODE:'clerk'}),true)
 assert.equal(requirePersonalAccess({}),false)
})
