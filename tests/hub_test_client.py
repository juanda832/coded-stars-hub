"""Supply the revision a current editor would read before a normal test mutation.

Explicit expectedVersion values are never changed, including stale/invalid ones.
"""
import json,urllib.error,urllib.request
def versioned_meeting_body(base,client,body):
 if not isinstance(body,dict) or body.get('action') not in ['meeting_edit','meeting_update','status'] or 'expectedVersion' in body:return body
 try:
  with client.open(urllib.request.Request(base+'/api/data')) as response:data=json.load(response)
 except urllib.error.HTTPError:return body
 meeting=next((meeting for meeting in data.get('meetings',[]) if meeting['id']==body.get('meetingId')),None)
 return {**body,'expectedVersion':meeting.get('editVersion',0)} if meeting else body
