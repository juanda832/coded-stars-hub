import test from 'node:test'
import assert from 'node:assert/strict'
import {meetingEditVersion,assertMeetingVersion} from '../lib/meeting-version.ts'
test('Legacy meetings start at zero and a fresh matching version is accepted',()=>{
 assert.equal(meetingEditVersion({}),0);assert.doesNotThrow(()=>assertMeetingVersion({},0));assert.doesNotThrow(()=>assertMeetingVersion({editVersion:3},3))
})
test('Stale, future and missing versions never overwrite another edit',()=>{
 for(const expected of [undefined,0,1,3])assert.throws(()=>assertMeetingVersion({editVersion:2},expected),error=>error.status===409)
})
test('Malformed versions cannot be coerced into a valid revision',()=>{
 for(const expected of ['2',null,true,{},[],NaN,Infinity,-1,1.5,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>assertMeetingVersion({editVersion:2},expected),error=>error.status===400)
})
