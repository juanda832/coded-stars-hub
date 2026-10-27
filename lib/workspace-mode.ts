export function teamWorkspaceEnabled(){return process.env.NEXT_PUBLIC_CODED_WORKSPACE_MODE==='team'}
export function exampleWorkspace(scope:string|undefined,team=teamWorkspaceEnabled()){
 return !team||!!scope?.startsWith('coded_hub_review_')
}
