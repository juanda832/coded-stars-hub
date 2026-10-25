"""Read-only security checks for an isolated server with personal access enabled."""
import sys,json,urllib.request,urllib.error
BASE=sys.argv[1] if len(sys.argv)>1 else 'http://localhost:3004'
assert BASE=='http://localhost:3004','Use the isolated personal-access server.'
checks=0
def call(path,body=None,cookie=None,method=None):
 headers={'Accept':'application/json'}
 if cookie:headers['Cookie']=cookie
 if body is not None:headers['Content-Type']='application/json'
 req=urllib.request.Request(BASE+path,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method)
 try:
  with urllib.request.urlopen(req,timeout=20) as response:return response.status,response.read().decode()
 except urllib.error.HTTPError as error:return error.code,error.read().decode()
def verify(condition,label):
 global checks
 assert condition,label
 checks+=1
for path in ['/api/data','/api/assistant']:
 status,body=call(path)
 verify(status==401,path+' requires a personal session')
 verify('isabella@' not in body and 'ela@' not in body,path+' does not expose account details')
status,_=call('/api/auth',{'email':'isa@example.com','password':'Demo2026!'})
verify(status==403,'Public demo credentials are disabled')
status,_=call('/api/action',{'action':'create','role':'admin','userId':'admin-isa','schoolName':'Do not save'})
verify(status==401,'A body cannot grant administrator permissions')
status,_=call('/api/assistant',{'message':'Show candidates','userId':'admin-isa','role':'admin'})
verify(status==401,'The assistant cannot accept a claimed identity')
status,_=call('/api/data',cookie='coded_session=admin-isa.9999999999999.forged')
verify(status==401,'A demonstration cookie cannot create a personal session')
status,_=call('/api/auth',method='DELETE')
verify(status==405,'Personal sign-out uses the authentication provider')
print(f'{checks} personal-access security checks passed.')
