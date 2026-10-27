import test from 'node:test'
import assert from 'node:assert/strict'
import {assertTeamConfiguration,teamRequestDestination} from '../lib/workspace-policy.ts'
import {exampleWorkspace} from '../lib/workspace-mode.ts'
const configured=()=>({VERCEL:'1',VERCEL_ENV:'production',NEXT_PUBLIC_CODED_WORKSPACE_MODE:'team',NEXT_PUBLIC_CODED_AUTH_MODE:'clerk',CLERK_SECRET_KEY:'sk_live_fake_unit_test',NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:'pk_live_fake_unit_test',CODED_PUBLIC_SITE_URL:'https://hub.example.org',CODED_DATABASE_SCHEMA:'coded_hub_team',CODED_OWNER_EMAIL:'owner@organization.test',CODED_ADMIN_ISA_EMAIL:'first@organization.test',CODED_ADMIN_ELA_EMAIL:'second@organization.test'})
test('The existing beta and its previews are unchanged without an explicit team opt-in',()=>{
 assert.doesNotThrow(()=>assertTeamConfiguration({VERCEL:'1'}));assert.equal(exampleWorkspace(undefined,false),true)
})
test('A team workspace is empty while every explicitly isolated review keeps its examples',()=>{
 assert.equal(exampleWorkspace(undefined,true),false);assert.equal(exampleWorkspace('coded_hub_team',true),false)
 assert.equal(exampleWorkspace('coded_hub_review_12345678',true),true);assert.equal(exampleWorkspace('coded_hub_preview',true),false)
})
test('Hosted team data cannot use development credentials or demo login',()=>{
 for(const [key,value] of [['CLERK_SECRET_KEY','sk_test_fake'],['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY','pk_test_fake'],['NEXT_PUBLIC_CODED_AUTH_MODE','demo']])assert.throws(()=>assertTeamConfiguration({...configured(),[key]:value}),error=>error.status===503)
})
test('Production team access requires a custom HTTPS origin',()=>{
 for(const origin of ['', 'https://vercel.app','https://coded-stars-beta.vercel.app','http://hub.example.org','https://localhost','https://user:password@hub.example.org','https://hub.example.org/path','https://hub.example.org/?next=other','https://hub.example.org/#other'])assert.throws(()=>assertTeamConfiguration({...configured(),CODED_PUBLIC_SITE_URL:origin}),error=>error.status===503)
})
test('The team workspace cannot reuse the beta database or omit personal administrators',()=>{
 assert.throws(()=>assertTeamConfiguration({...configured(),CODED_DATABASE_SCHEMA:'coded_hub_beta'}),error=>error.status===503)
 for(const name of ['CODED_OWNER_EMAIL','CODED_ADMIN_ISA_EMAIL','CODED_ADMIN_ELA_EMAIL'])for(const value of ['', 'test@example.com'])assert.throws(()=>assertTeamConfiguration({...configured(),[name]:value}),error=>error.status===503)
 assert.doesNotThrow(()=>assertTeamConfiguration(configured()))
})
test('An isolated local team QA can verify the workspace without production services',()=>{
 assert.doesNotThrow(()=>assertTeamConfiguration({VERCEL:'0',NEXT_PUBLIC_CODED_WORKSPACE_MODE:'team'}))
})
test('A legacy link keeps its path and query without accepting a different redirect host',()=>{
 const normal=teamRequestDestination('https://hub.example.org','/sign-in','?return=meetings')
 assert.equal(normal.href,'https://hub.example.org/sign-in?return=meetings')
 for(const path of ['//attacker.example/path','https://attacker.example/path','/%2f%2fattacker.example'])assert.equal(teamRequestDestination('https://hub.example.org',path,'?next=https://other.example').origin,'https://hub.example.org')
})
test('Selecting the team database alone or a hosted preview cannot bypass activation requirements',()=>{
 assert.throws(()=>assertTeamConfiguration({...configured(),NEXT_PUBLIC_CODED_WORKSPACE_MODE:undefined}),error=>error.status===503)
 assert.throws(()=>assertTeamConfiguration({...configured(),VERCEL_ENV:'preview'}),error=>error.status===503)
})
