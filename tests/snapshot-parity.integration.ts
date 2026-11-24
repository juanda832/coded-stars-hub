import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { withStore, snapshot, registrations, records } from '../lib/store'

// Only disposable test environments are permitted.
if (process.env.DATABASE_URL) {
  assert.match(process.env.CODED_DATABASE_SCHEMA || '', /^coded_hub_qa_perf_[a-f0-9]+$/)
} else {
  assert.match(process.env.CODED_DEMO_DB || '', /coded-perf-parity-/)
}
assert.notEqual(process.env.VERCEL_ENV, 'production')
assert.notEqual(process.env.CODED_ALLOW_REAL_ACCOUNTS, 'true')
async function legacySnapshot() {
  return { meetings: await records('meetings'), registrations: await registrations(), feedback: await records('feedback'), questions: await records('questions'), participation: await records('participation'), reports: await records('reports'), reportReviews: await records('report_reviews') }
}
async function main() {
  await withStore(async () => {
    assert.deepEqual(await snapshot(), await legacySnapshot())
    const legacy: number[] = [], optimized: number[] = []
    for(let i=0;i<5;i++){
      let start=performance.now()
      const original=await legacySnapshot()
      legacy.push(performance.now()-start)
      start=performance.now()
      const improved=await snapshot()
      optimized.push(performance.now()-start)
      assert.deepEqual(improved,original)
    }
    const median=(values:number[])=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)]
    console.log(JSON.stringify({parityChecks:6,backend:process.env.DATABASE_URL?'postgresql':'sqlite',legacyMedianMs:Math.round(median(legacy)*100)/100,optimizedMedianMs:Math.round(median(optimized)*100)/100}))
  })
}
main().catch(error=>{console.error(error);process.exitCode=1})
