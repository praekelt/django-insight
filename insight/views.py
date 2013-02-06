from datetime import datetime, timedelta

from django.http import HttpResponseRedirect


def set_origin_code(request, code):
    response = HttpResponseRedirect('/')
    request.session['insight_code'] = code
    request.session['insight_params'] = request.GET
    return response
