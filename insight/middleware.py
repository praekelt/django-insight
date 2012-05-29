import re
from datetime import datetime, timedelta

from django.http import HttpResponseRedirect

from insight.models import Registration, Origin


'''Requires Django's AuthenticationMiddleware'''
class RegistrationOriginMiddleware(object):
    TRACK_URL = '/join/'  # foundry join form url
    TRACK_REGEX = re.compile('^' + re.escape(TRACK_URL) + '$')
    INCOMING_REGEX = re.compile(r'^/(?P<prefix>[a-z])/(?P<code>[\w]+)/$')
    
    def process_request(self, request):
        match = self.INCOMING_REGEX.match(request.path)
        if match:
            response = HttpResponseRedirect('/')
            if request.user.is_anonymous():
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
                    'expires': expires,
                    #'domain': request.META['HTTP_HOST'],
                    'path': self.TRACK_URL,
                    'secure': request.is_secure() or None, 
                } 
                response.set_cookie(**cookie_args)
            return response
        else:
            return None


    def process_response(self, request, response):
        if request.method == 'POST' and self.TRACK_REGEX.match(request.path):
            if request.user.is_authenticated():
                # record new registration with its origin identified by code
                print('newly registered user jay!')
                new_registration = Registration(
                    user_id = request.user.id,
                    origin = Origin.objects.get(
                        code=request.COOKIES['insight_code'])
                )
                new_registration.save()
                # remove cookie
                response.delete_cookie(
                    'insight_code', 
                    self.TRACK_URL, 
                    request.META['HTTP_HOST']
                )
        return response
