"""Run only against an isolated local demo instance with fictitious data."""
import io,json,zipfile,sys,http.cookiejar,urllib.request,urllib.error,urllib.parse,xml.etree.ElementTree as ET
BASE=sys.argv[1]
assert urllib.parse.urlparse(BASE).hostname in ('127.0.0.1','localhost')
assert urllib.parse.urlparse(BASE).scheme=='http'
def client(email=None):
 c=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 if email:
  req=urllib.request.Request(BASE+'/api/auth',data=json.dumps({'email':email,'password':'Demo2026!'}).encode(),headers={'Content-Type':'application/json'})
  with c.open(req) as r:assert r.status==200
 return c
def get(c,path):
 try:
  with c.open(BASE+path) as r:return r.status,r.headers,r.read()
 except urllib.error.HTTPError as e:return e.code,e.headers,e.read()
checks=0
def expect(name,condition):
 global checks
 assert condition,name
 checks+=1
 print('PASS',name)
admin=client('isa@example.com')
for email,status in [(None,401),('host@example.com',403),('star@example.com',403)]:
 expect('export access '+str(email),get(client(email),'/api/exports')[0]==status)
expect('invalid period rejected',get(admin,'/api/exports?period=invalid')[0]==400)
expect('invalid zone rejected',get(admin,'/api/exports?zone=invalid')[0]==400)
status,headers,raw=get(admin,'/api/exports?period=all&zone=America%2FLa_Paz')
expect('Excel HTTP response',status==200 and headers['Content-Type'].endswith('spreadsheetml.sheet'))
expect('private download not cached','no-store' in headers['Cache-Control'])
expect('attachment filename',headers['Content-Disposition'].endswith('.xlsx"'))
with zipfile.ZipFile(io.BytesIO(raw)) as z:
 expect('valid ZIP CRC',z.testzip() is None)
 expect('all parts parse as XML',all(ET.fromstring(z.read(name)) is not None for name in z.namelist()))
 ns={'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
 book=ET.fromstring(z.read('xl/workbook.xml'))
 expect('three worksheet names',[s.attrib['name'] for s in book.findall('.//x:sheet',ns)]==['Resumen','Agenda','Resultados'])
 agenda=ET.fromstring(z.read('xl/worksheets/sheet2.xml'))
 data=json.loads(get(admin,'/api/data')[2])
 expect('agenda rows match visible meetings',len(agenda.findall('.//x:row',ns))==1+len(data['meetings']))
 expect('no formulas',not agenda.findall('.//x:f',ns))
 expect('no private email or meeting link columns',not any(b'@example.com' in z.read(n) or b'https://' in z.read(n) for n in z.namelist() if n.startswith('xl/worksheets/')))
 expect('agenda filter present',agenda.find('x:autoFilter',ns) is not None)
 print('EXPORT_BYTES',len(raw))
expect('seven-day export works',get(admin,'/api/exports?period=7')[0]==200)
print('EXPORT_HTTP_CHECKS',checks)
