import {checkAccountOrigin} from './account-policy.ts'
import {WorkflowError} from './workflow-error.ts'

// Browsers include Origin for same-origin JSON POSTs. On hosted instances,
// cookie-only requests with no Origin are refused. Validated bearer clients
// may omit it; local QA clients can keep using an isolated demo server.
export function checkMutationRequest(
 headers: {get(name:string):string|null},
 hosted: boolean,
) {
 const origin=headers.get('origin')
 const authorization=headers.get('authorization')
 const fetchSite=headers.get('sec-fetch-site')
 if(fetchSite==='cross-site')throw new WorkflowError('Abre el formulario desde el Hub.',403)
 // A missing Origin is permitted only for a non-browser bearer client.
 // An attacker must not bypass this requirement by adding a dummy header
 // to an authenticated browser request that also carries session cookies.
 if(hosted&&!origin&&(
  headers.get('cookie') ||
  !/^Bearer\s+\S+$/i.test(authorization||'')
 ))throw new WorkflowError('Abre el formulario desde el Hub.',403)
 checkAccountOrigin(origin,headers.get('host'),hosted)
}
