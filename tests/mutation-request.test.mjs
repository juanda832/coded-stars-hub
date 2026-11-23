import test from 'node:test'
import assert from 'node:assert/strict'
import {checkMutationRequest} from '../lib/mutation-request.ts'
const request=(values={})=>({get:name=>values[name.toLowerCase()]??null})
const local='http://localhost:3001',host='coded-stars-beta.vercel.app'
test('The hosted app accepts a same-origin browser POST',()=>{
 assert.doesNotThrow(()=>checkMutationRequest(request({origin:'https://'+host,host}),true))
})
test('A hosted cookie-only request requires an Origin header',()=>{
 assert.throws(()=>checkMutationRequest(request({host}),true),error=>error.status===403)
})
test('A validated bearer-token API client can omit Origin',()=>{
 assert.doesNotThrow(()=>checkMutationRequest(request({host,authorization:'Bearer qa-session-token'}),true))
})
test('A fake bearer header cannot bypass hosted cookie-only protection',()=>{
 assert.throws(()=>checkMutationRequest(request({host,authorization:'Bearer fake',cookie:'__session=qa_cookie'}),true),error=>error.status===403)
})
test('Fetch Metadata prevents cross-site requests, even with a bearer header',()=>{
 assert.throws(()=>checkMutationRequest(request({host,authorization:'Bearer qa-token','sec-fetch-site':'cross-site'}),true),error=>error.status===403)
})
test('An external or insecure Origin is forbidden',()=>{
 for(const origin of ['https://evil.example','http://'+host,'null','https://'+host+':444','https://'+host+'/path']){
  assert.throws(()=>checkMutationRequest(request({host,origin}),true),error=>error.status===403)
 }
})
test('Origin is still checked in local demo mode and isolated QA scripts may omit it',()=>{
 assert.doesNotThrow(()=>checkMutationRequest(request({host:'localhost:3001',origin:local}),false))
 assert.doesNotThrow(()=>checkMutationRequest(request({host:'localhost:3001'}),false))
 assert.throws(()=>checkMutationRequest(request({host:'localhost:3001',origin:'https://evil.example'}),false),error=>error.status===403)
})
