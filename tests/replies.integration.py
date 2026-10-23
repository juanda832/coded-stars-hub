"""Use an isolated database/server. Includes a pending fictitious question for browser QA."""
import concurrent.futures, datetime, http.cookiejar, json, sys, urllib.error, urllib.request, uuid

BASE=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:3001'
passed=[]
def call(client,path,body=None):
 req=urllib.request.Request(BASE+path,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json'},method='POST' if body is not None else 'GET')
 try:
  with client.open(req) as response:return response.status,json.load(response)
 except urllib.error.HTTPError as error:return error.code,json.load(error)
def login(email):
 client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 assert call(client,'/api/auth',{'email':email,'password':'Demo2026!'})[0]==200
 return client
def data(client):return call(client,'/api/data')[1]
def action(client,**body):return call(client,'/api/action',body)
def expect(name,actual,expected):
 assert actual==expected,(name,actual,expected)
 passed.append(name)

admin,host,isa,ela,other_host,star,other_star=[login(email) for email in ['admin@demo.coded','host@demo.coded','isa@demo.coded','ela@demo.coded','diego@demo.coded','star@demo.coded','valentina@demo.coded']]
title='JDP · Conversación de prueba '+uuid.uuid4().hex[:6]
future=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=3)).isoformat()
expect('Create isolated conversation meeting',action(admin,action='create',hostId='host-1',title=title,program='London',language='English',startsAt=future,description='Datos ficticios para comprobar preguntas y respuestas.',duration=45,hostNote='Puedes preparar un recuerdo real de tu experiencia.')[0],200)
mid=next(meeting['id'] for meeting in data(admin)['meetings'] if meeting['title']==title)
expect('Ask a question',action(star,action='ask',meetingId=mid,text='Ejemplo ficticio: ¿en qué idioma será esta reunión?')[0],200)
qid=next(question['id'] for question in data(star)['questions'] if question['meetingId']==mid)
expect('Another Star cannot read it',any(question['id']==qid for question in data(other_star)['questions']),False)
expect('An unrelated host cannot reply',action(other_host,action='reply',questionId=qid,reply='No corresponde a mi reunión.')[0],403)
expect('A Star cannot reply',action(star,action='reply',questionId=qid,reply='No puedo responder como host.')[0],403)
attempts=[(host,'Ejemplo ficticio: la reunión será en inglés.'),(isa,'Ejemplo ficticio: revisa el idioma en tu reunión del Hub.')]
with concurrent.futures.ThreadPoolExecutor(2) as pool:
 results=list(pool.map(lambda pair: action(pair[0],action='reply',questionId=qid,reply=pair[1]),attempts))
expect('Concurrent replies have one winner',sorted(result[0] for result in results),[200,409])
winner=next(index for index,result in enumerate(results) if result[0]==200)
answer=next(question for question in data(star)['questions'] if question['id']==qid)
expect('The winning answer is stored',answer['reply'],attempts[winner][1])
expect('Its author is preserved',answer['replyAuthor'],['Sofía Méndez','Isa · Demo'][winner])
def notices():return [notice for notice in data(star)['notifications'] if notice['meetingId']==mid and notice['title']=='Ya respondieron tu pregunta']
expect('Only one answer notification is delivered',len(notices()),1)
expect('Ela cannot overwrite the answer',action(ela,action='reply',questionId=qid,reply='Una segunda respuesta que no debe reemplazarla.')[0],409)
expect('The original answer remains intact',next(question for question in data(star)['questions'] if question['id']==qid),answer)
expect('A retry of the same response is idempotent',action(attempts[winner][0],action='reply',questionId=qid,reply=attempts[winner][1])[0],200)
expect('No duplicate notices after retries or conflicts',len(notices()),1)
expect('Replying never confirms a participant',data(admin)['confirmedCounts'][mid],0)
expect('Create a pending browser-QA question',action(star,action='ask',meetingId=mid,text='Ejemplo ficticio: ¿cómo preparo un recuerdo para mi JDP?')[0],200)
print(f'Passed {len(passed)} reply checks: permissions, concurrency, preserved author and notification delivery.')
print(json.dumps({'meetingId':mid,'title':title,'pendingQuestion':'Ejemplo ficticio: ¿cómo preparo un recuerdo para mi JDP?'},ensure_ascii=False))
