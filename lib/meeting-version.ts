import type {Meeting} from './types.ts'
import {WorkflowError} from './workflow-error.ts'

export function meetingEditVersion(meeting:Pick<Meeting,'editVersion'>){return meeting.editVersion??0}
export function assertMeetingVersion(meeting:Pick<Meeting,'editVersion'>,expected:unknown){
 if(expected===undefined)throw new WorkflowError('Actualiza la página y vuelve a abrir la reunión antes de guardar.',409)
 if(typeof expected!=='number'||!Number.isSafeInteger(expected)||expected<0)throw new WorkflowError('La versión de la reunión no es válida. Vuelve a abrirla.')
 if(meetingEditVersion(meeting)!==expected)throw new WorkflowError('Esta JDP se actualizó mientras editabas. Lo que escribiste sigue en el formulario.',409)
}
