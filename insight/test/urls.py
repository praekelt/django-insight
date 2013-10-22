from django.conf.urls.defaults import patterns, url, include
from django.http import HttpResponse

from insight.urls import urlpatterns as insight_urls


def view_stub(request):
    return HttpResponse()


urlpatterns = patterns(
    '',
    url(
        r'^stub/$',
        view_stub,
        name='stub'
    ),
    url(r'', include('django.contrib.auth.urls')),
) + insight_urls
