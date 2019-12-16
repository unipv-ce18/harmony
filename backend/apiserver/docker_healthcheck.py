import sys
from http.client import HTTPConnection

conn = HTTPConnection('localhost')
conn.request('GET', '/api/v1/sayhello')

sys.exit(0 if conn.getresponse().status == 200 else 1)
