'use client'
export default function Brand({compact=false,onClick}:{compact?:boolean;onClick?:()=>void}){
 const content=<><img src="/brand/coded-logo.png" width={1024} height={202} alt="CODED"/><span className="hub-wordmark">Stars Hub<span className="brand-dot"/></span></>
 return onClick?<button className={'brand official-brand '+(compact?'compact':'')} onClick={onClick} aria-label="CODED Stars Hub: ir al inicio">{content}</button>:<div className={'brand official-brand '+(compact?'compact':'')}>{content}</div>
}
