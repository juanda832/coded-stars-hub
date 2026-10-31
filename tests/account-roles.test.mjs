import test from 'node:test'
import assert from 'node:assert/strict'
import {accountRole,assignedRoles,hasAssignedRole} from '../lib/account-roles.ts'
import {resolvePersonalUser} from '../lib/auth-policy.ts'
const owner={id:'admin-owner',name:'Juan',email:'owner@example.com',role:'admin',roles:['admin','star'],initials:'JM'}
test('The owner retains both assignments while the effective role uses the same identity',()=>{
 const star=accountRole(owner,'admin-owner:star')
 assert.equal(star.id,owner.id);assert.equal(star.email,owner.email);assert.equal(star.role,'star')
 assert.deepEqual(assignedRoles(star),['admin','star']);assert.equal(accountRole(star,'admin-owner:admin').role,'admin')
 assert.equal(hasAssignedRole(owner,'host'),false)
})
test('Role-view cookies cannot impersonate another person or select an unassigned role',()=>{
 for(const cookie of ['admin-isa:star','star-1:admin','admin-owner:host','admin-owner:owner','admin-owner:star:extra','admin-owner:',undefined])assert.deepEqual(accountRole(owner,cookie),owner)
})
test('Single-role administrators, hosts and Stars cannot enable another role using cookies',()=>{
 for(const role of ['admin','host','star']){
  const person={id:'member-test',role}
  assert.deepEqual(assignedRoles(person),[role])
  for(const target of ['admin','host','star'])assert.equal(accountRole(person,'member-test:'+target).role,role)
 }
})
test('A stale cookie loses its permissions when the server directory removes the assignment',()=>{
 const reduced={...owner,roles:['admin']}
 assert.equal(accountRole(reduced,'admin-owner:star').role,'admin')
})
test('Clerk still verifies the primary private grant and email before exposing both assignments',()=>{
 const identity={externalId:'coded-stars-hub:admin-owner',privateMetadata:{codedHub:{userId:'admin-owner',role:'admin'}},emailAddresses:[{emailAddress:owner.email,verification:{status:'verified'}}]}
 assert.deepEqual(resolvePersonalUser(identity,[owner]),owner)
 assert.equal(resolvePersonalUser({...identity,privateMetadata:{codedHub:{userId:'admin-owner',role:'star'}}},[owner]),null)
 assert.equal(resolvePersonalUser({...identity,emailAddresses:[{emailAddress:owner.email,verification:{status:'unverified'}}]},[owner]),null)
})
test('Client-editable claims cannot add a second role to another account',()=>{
 const ordinary={id:'star-1',name:'Ejemplo',role:'star',email:'star@example.com',initials:'EF'}
 const identity={externalId:'coded-stars-hub:star-1',privateMetadata:{codedHub:{userId:'star-1',role:'star'}},publicMetadata:{roles:['admin','star']},unsafeMetadata:{roles:['admin','star']},emailAddresses:[{emailAddress:ordinary.email,verification:{status:'verified'}}]}
 const verified=resolvePersonalUser(identity,[ordinary]);assert.deepEqual(assignedRoles(verified),['star']);assert.equal(accountRole(verified,'star-1:admin').role,'star')
})
