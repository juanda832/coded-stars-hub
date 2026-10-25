import 'server-only'
import { users as examples } from './demo-users'
import { requirePersonalAccess } from './auth-mode'

// Real addresses are configured privately in the hosting environment.
const addresses:Record<string,string|undefined>={
 'admin-isa':process.env.CODED_ADMIN_ISA_EMAIL,
 'admin-ela':process.env.CODED_ADMIN_ELA_EMAIL,
}
export const users=requirePersonalAccess()?examples.map(user=>({
 ...user,name:user.name.replace(/ · Demo$/,''),email:addresses[user.id]?.trim()||user.email,
})):examples
