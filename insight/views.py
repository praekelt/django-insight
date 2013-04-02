from datetime import timedelta

from django.http import HttpResponseRedirect

from insight.models import Origin


def set_origin_code(request, code):
    request.session['insight_code'] = code
    request.session['insight_params'] = request.GET
    try:
        origin = Origin.objects.get(code=code)
        if origin.redirect_to:
            return HttpResponseRedirect(origin.redirect_to)
    except Origin.DoesNotExist:
        pass
    return HttpResponseRedirect("/")
