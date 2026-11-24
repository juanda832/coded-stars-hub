/** Show the complete answer as soon as the server returns it. */
export default function AssistantReply({text}:{text:string}) {
 return <div className="assistant-text"><div>{text.split('\n\n').map((paragraph,i)=><p key={i}>{paragraph}</p>)}</div></div>
}
