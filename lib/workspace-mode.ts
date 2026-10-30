export function teamWorkspaceEnabled(){return process.env.NEXT_PUBLIC_CODED_WORKSPACE_MODE==='team'}
export function exampleWorkspace(scope:string|undefined,team=teamWorkspaceEnabled(),seedExamples=process.env.CODED_SEED_EXAMPLES!=='false'){
 // Optional role reviews stay isolated; clearing the shared beta never enables
 // production access or restores demonstration accounts to the main directory.
 return !!scope?.startsWith('coded_hub_review_')||(!team&&seedExamples)
}
