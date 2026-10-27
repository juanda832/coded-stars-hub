import {redirect} from 'next/navigation'
import {personalAccessEnabled} from '@/lib/auth-mode'
import PersonalSignIn from '@/app/components/PersonalSignIn'

export default function SignInPage(){
 if(!personalAccessEnabled())redirect('/')
 return <PersonalSignIn/>
}
