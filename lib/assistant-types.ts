export type AssistantGoal='meetings'|'applications'|'prepare'|'questions'|'selection'|'publication'|'profile'|'reports'|'account'|'motivation'|'privacy'|'about'|'details'|'overview'
export type AssistantAction=
 |{kind:'navigate';label:string;section:string;view?:string}
 |{kind:'meeting';label:string;meetingId:string}
 |{kind:'question';label:string;text:string;meetingId?:string}
 |{kind:'publication';label:string;title:string;body:string}
export type AssistantState={goal?:AssistantGoal;program?:string;language?:string;period?:'today'|'tomorrow'|'week';availableOnly?:boolean;meetingId?:string;offeredIds?:string[];awaiting?:'program'|'meeting'|'memory'|'learning';applicationStatus?:'pending'|'confirmed';responseStyle?:'short'|'full';story?:{memory?:string;learning?:string};draft?:{kind:'story'|'question'|'publication';text:string;title?:string;meetingId?:string}}
export type AssistantAnswer={text:string;actions:AssistantAction[];suggestions:string[];sources:string[];checks:string[];state:AssistantState}
export type AssistantMessage={id:string;role:'user'|'assistant';text:string;createdAt:string;answer?:AssistantAnswer;requestId?:string}
export type AssistantConversation={id:string;userId:string;title:string;createdAt:string;updatedAt:string;version:number;messages:AssistantMessage[];state:AssistantState}
export type AssistantThread=Pick<AssistantConversation,'id'|'title'|'updatedAt'|'version'>
export type AssistantSnapshot={mode:'local';threads:AssistantThread[];conversation:AssistantConversation|null}
export type AssistantDraft={key:string;kind:'question'|'publication';text:string;title?:string;meetingId?:string}
