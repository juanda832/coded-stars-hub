import type {NextConfig} from 'next'
const config:NextConfig={}
// Keep authentication QA builds separate from the local review server.
if(process.env.CODED_BUILD_DIR)config.distDir=process.env.CODED_BUILD_DIR
export default config
