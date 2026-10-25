"""Run against the isolated demo test server after the core suites."""
import datetime, http.cookiejar, json, sys, urllib.error, urllib.request, uuid
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://127.0.0.1:3001'
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
def action(client,**body):return call(client,'/api/action',body)
def data(client):return call(client,'/api/data')[1]
def expect(name,value,expected):
 assert value==expected,(name,value,expected)
 passed.append(name)
admin,host,star,other=[login(mail) for mail in ['admin@example.com','host@example.com','star@example.com','valentina@example.com']]
future=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=5)).isoformat()
draft={'action':'create','hostId':'host-1','title':'JDP · Comunicación '+uuid.uuid4().hex[:7],'description':'Una reunión de demostración para nuevas familias.','program':'Orlando','language':'Español','startsAt':future,'duration':45,'joinUrl':'https://example.com/private-demo-room','hostNote':'Reservaremos un turno para tu historia.'}
expect('Host cannot create meetings',call(host,'/api/action',draft)[0],403)
expect('Star cannot create meetings',call(star,'/api/action',draft)[0],403)
for field,value in [('duration',0),('duration',181),('program',[]),('language','Invalid'),('joinUrl','http://example.com'),('joinUrl','https://user:password@example.com'),('description','x')]:
 expect('Invalid '+field+' rejected',call(admin,'/api/action',{**draft,field:value})[0],400)
expect('Admin creates full meeting',call(admin,'/api/action',draft)[0],200)
m=next(m for m in data(admin)['meetings'] if m['title']==draft['title']);mid=m['id']
expect('Duration saved',m['duration'],45)
expect('Description saved',m['description'],draft['description'])
expect('Star link remains private before request',next(m for m in data(star)['meetings'] if m['id']==mid).get('joinUrl'),None)
for client in [star,other]:expect('Open applications accepted',action(client,action='request',meetingId=mid)[0],200)
expect('Admin receives application notice',any(n['meetingId']==mid and n['title']=='Nueva solicitud por revisar' for n in data(admin)['notifications']),True)
expect('Star sends question',action(star,action='ask',meetingId=mid,text='¿Cuándo tendré la palabra para mi testimonio?')[0],200)
q=next(q for q in data(host)['questions'] if q['meetingId']==mid);qid=q['id']
expect('Host receives question notice',any(n['meetingId']==mid and n['title']=='Un Star tiene una pregunta' for n in data(host)['notifications']),True)
expect('Other Star cannot read the question',any(q['meetingId']==mid for q in data(other)['questions']),False)
expect('Other Star cannot reply',action(other,action='reply',questionId=q['id'],reply='Una respuesta falsa')[0],403)
expect('Host replies',action(host,action='reply',questionId=q['id'],reply='Te presentaré después de explicar el programa.')[0],200)
expect('Reply author is recorded',next(q for q in data(star)['questions'] if q['id']==qid)['replyAuthor'],'Sofía Méndez')
expect('Star receives reply notice',any(n['meetingId']==mid and n['title']=='Ya respondieron tu pregunta' for n in data(star)['notifications']),True)
expect('Other Star receives no private answer notice',any(n['meetingId']==mid and n['title']=='Ya respondieron tu pregunta' for n in data(other)['notifications']),False)
expect('Selection remains manual',data(admin)['confirmedCounts'][mid],0)
action(admin,action='select',meetingId=mid,userId='star-1')
expect('Confirmed Star sees link',next(m for m in data(star)['meetings'] if m['id']==mid)['joinUrl'],draft['joinUrl'])
edit={**draft,'action':'meeting_edit','meetingId':mid,'duration':30,'language':'English','startsAt':(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=6)).isoformat()}
expect('Host cannot reprogram',call(host,'/api/action',edit)[0],403)
expect('Admin edits date, language and duration',call(admin,'/api/action',edit)[0],200)
expect('Updated duration returned',next(m for m in data(admin)['meetings'] if m['id']==mid)['duration'],30)
expect('Editing never selects another Star',next(r for r in data(admin)['registrations'] if r['meetingId']==mid and r['status']=='confirmed')['userId'],'star-1')
for client in [star,other]:expect('Applicants receive change notice',any(n['meetingId']==mid and n['title']=='Cambios en una reunión' for n in data(client)['notifications']),True)
expect('Host receives change notice',any(n['meetingId']==mid and n['title']=='Reunión actualizada' for n in data(host)['notifications']),True)
expect('Unselected applicant still has no joining link',next(m for m in data(other)['meetings'] if m['id']==mid).get('joinUrl'),None)
expect('Host changes link',action(host,action='meeting_update',meetingId=mid,hostNote=edit['hostNote'],joinUrl='https://example.com/new-private-room')[0],200)
expect('Notification body does not leak joining URL',any('https://' in n['body'] for n in data(other)['notifications'] if n['meetingId']==mid),False)
other_unread=sum(not n.get('readAt') for n in data(other)['notifications'])
expect('Read-all accepted',action(star,action='notifications_read_all')[0],200)
expect('Own notifications all read',sum(not n.get('readAt') for n in data(star)['notifications']),0)
expect('Read-all never affects another account',sum(not n.get('readAt') for n in data(other)['notifications']),other_unread)
expect('Cancel meeting accepted',action(admin,action='status',meetingId=mid,status='cancelled')[0],200)
expect('Cancellation notice arrives',any(n['meetingId']==mid and n['title']=='Reunión cancelada' for n in data(star)['notifications']),True)
expect('Closed meeting cannot be edited',call(admin,'/api/action',edit)[0],400)
print(f'Passed {len(passed)} communication and scheduling checks: permissions, delivery, privacy, manual selection and ownership.')
