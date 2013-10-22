from django.http import HttpResponseRedirect

from insight.models import Origin
from insight.signals import origin_hit


def set_origin_code(request, code):
    try:
        origin = Origin.objects.get(code=code)
        if origin.track_registrations:
            request.session['insight_code'] = code
            request.session['insight_params'] = request.GET

        origin_hit.send(sender=Origin, instance=origin, request=request)

        if origin.redirect_to:
            return HttpResponseRedirect(origin.redirect_to)
    except Origin.DoesNotExist:
        pass
    return HttpResponseRedirect("/")
