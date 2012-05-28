import re
from datetime import datetime, timedelta

from django.http import HttpResponseRedirect


class RecordOriginMiddleware(object)
    TRACK_URL = '/join/'  # foundry join form url
    TRACK_REGEX = re.compile('^' + TRACK_URL + '$')
    INCOMING_REGEX = r'^/(?P<prefix>[a-z])/(?P<code>[\w]+)/$'
    
    process_request(self, request):
        match = self.INCOMING_REGEX.match(request.path)
        if match:
            response = HttpResponseRedirect('')
            # set cookie with insight code
            max_age = 365 * 24 * 60 * 60  # one year
            expires = datetime.strftime(
                datetime.utcnow() + timedelta(seconds=max_age),
                "%a, %d-%b-%Y %H:%M:%S GMT"
            )
            cookie_args = {
                'key': 'insight_code',
                'value': match.group('code'),
                'max_age': max_age,
                'domain': request.META['Host'],
                'path': self.TRACK_URL,
                'secure': request.is_secure() or None, 
            } 
            response.set_cookie(**cookie_args) 
            return response
        else:
            if request.method == 'POST' and self.TRACK_REGEX.match(request.path):
                # record code and additional data
                
                # remove cookie
                request.delete_cookie('insight_code')
            return None
