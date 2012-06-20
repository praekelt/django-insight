from datetime import datetime, timedelta

from django.http import HttpResponseRedirect


def set_origin_code(request, prefix, code):
    response = HttpResponseRedirect('/')
    request.session['insight_code'] = code
    return response
