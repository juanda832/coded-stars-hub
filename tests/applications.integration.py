"""Run against a separate demo server/database: python3 tests/applications.integration.py http://127.0.0.1:3001"""
import concurrent.futures, datetime, http.cookiejar, json, sys, urllib.error, urllib.request, uuid
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
def expect(name,actual,expected):
 assert actual==expected,(name,actual,expected)
 passed.append(name)
def data(client):return call(client,'/api/data')[1]
def action(client,**body):return call(client,'/api/action',body)
admin,admin2,host=login('admin@example.com'),login('admin@example.com'),login('host@example.com')
stars={f'star-{i+1}':login(email) for i,email in enumerate(['star@example.com','valentina@example.com','nicolas@example.com','camila@example.com'])}
title='JDP · Integridad '+uuid.uuid4().hex[:8]
future=(datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(days=3)).isoformat()
expect('Admin creates meeting',action(admin,action='create',hostId='host-1',title=title,program='Orlando',startsAt=future,language='Español')[0],200)
meeting=next(m for m in data(admin)['meetings'] if m['title']==title);mid=meeting['id']
expect('Exactly one assignable place',meeting['capacity'],1)
for uid in ['star-1','star-2','star-3']:expect('Multiple requests accepted '+uid,action(stars[uid],action='request',meetingId=mid)[0],200)
expect('Duplicate request rejected',action(stars['star-1'],action='request',meetingId=mid)[0],409)
expect('Requests never auto-confirm',data(admin)['confirmedCounts'][mid],0)
expect('Star cannot select',action(stars['star-1'],action='select',meetingId=mid,userId='star-1')[0],403)
expect('Host cannot confirm through legacy endpoint',action(host,action='confirm',meetingId=mid,userId='star-1')[0],403)
expect('Host cannot select',action(host,action='select',meetingId=mid,userId='star-1')[0],403)
expect('Admin can write flexible criteria',action(admin,action='criteria',meetingId=mid,text='Criterio interno definido por CODED; revisar cada perfil manualmente.')[0],200)
expect('Star cannot access candidate profiles',data(stars['star-1'])['candidates'],[])
expect('Host cannot access candidate profiles',data(host)['candidates'],[])
expect('Host cannot access internal criteria',data(host)['criteria'],{})
expect('Admin sees profiles',len(data(admin)['candidates']),4)
expect('Host adds joining information',action(host,action='meeting_update',meetingId=mid,hostNote='Revisar indicaciones.',joinUrl='https://example.com/demo-meeting')[0],200)
expect('Pending application cannot see joining link',next(m for m in data(stars['star-1'])['meetings'] if m['id']==mid).get('joinUrl'),None)
with concurrent.futures.ThreadPoolExecutor(2) as pool:
 futures=[pool.submit(action,client,action='select',meetingId=mid,userId=uid) for client,uid in [(admin,'star-1'),(admin2,'star-2')]]
 codes=sorted(f.result()[0] for f in futures)
expect('Concurrent selection has one winner',codes,[200,409])
applications=[r for r in data(admin)['registrations'] if r['meetingId']==mid]
confirmed=[r for r in applications if r['status']=='confirmed']
expect('Only one confirmed record',len(confirmed),1)
winner=confirmed[0]['userId']
expect('Other candidates receive final status',len([r for r in applications if r['status']=='not_selected']),2)
expect('Selected Star sees joining link',next(m for m in data(stars[winner])['meetings'] if m['id']==mid).get('joinUrl'),'https://example.com/demo-meeting')
loser=next(uid for uid in ['star-1','star-2'] if uid!=winner)
expect('Other applicant has no joining link',next(m for m in data(stars[loser])['meetings'] if m['id']==mid).get('joinUrl'),None)
expect('Host sees only confirmed applicant',len([r for r in data(host)['registrations'] if r['meetingId']==mid]),1)
expect('New requests stop after assignment',action(stars['star-4'],action='request',meetingId=mid)[0],409)
expect('Selected Star receives confirmation',any(n['meetingId']==mid and 'confirmada' in n['title'] for n in data(stars[winner])['notifications']),True)
notice=next(n for n in data(stars[loser])['notifications'] if n['meetingId']==mid and 'actualización' in n['title'])
expect('Notification owner is enforced',action(stars[winner],action='notification_read',notificationId=notice['id'])[0],404)
expect('Recipient marks notification as read',action(stars[loser],action='notification_read',notificationId=notice['id'])[0],200)
expect('Confirmed person can cancel',action(stars[winner],action='cancel',meetingId=mid)[0],200)
expect('Cancellation never auto-promotes another applicant',data(admin)['confirmedCounts'][mid],0)
applications=[r for r in data(admin)['registrations'] if r['meetingId']==mid]
expect('Remaining candidates return to pending',len([r for r in applications if r['status']=='pending']),2)
expect('Cancelled request remains in history',next(r['status'] for r in applications if r['userId']==winner),'withdrawn')
expect('Admin gets reassignment notice',any(n['meetingId']==mid and 'reasignar' in n['title'] for n in data(admin)['notifications']),True)
expect('New applicant can request vacant slot',action(stars['star-4'],action='request',meetingId=mid)[0],200)
expect('Manual reassignment uses administrator criteria',action(admin,action='select',meetingId=mid,userId='star-3')[0],200)
expect('Exactly one confirmed after reassignment',data(admin)['confirmedCounts'][mid],1)
expect('Selected manually despite different program',next(r['userId'] for r in data(admin)['registrations'] if r['meetingId']==mid and r['status']=='confirmed'),'star-3')
print(f'Passed {len(passed)} integration checks. Meeting {mid}; reassigned to star-3.')
