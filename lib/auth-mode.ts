export function personalAccessEnabled(){return process.env.NEXT_PUBLIC_CODED_AUTH_MODE==='clerk'}

// A hosted instance never accepts the public demonstration credentials.
export function requirePersonalAccess(env:Record<string,string|undefined>=process.env){
 return env.NEXT_PUBLIC_CODED_AUTH_MODE==='clerk'||env.VERCEL==='1'
}
