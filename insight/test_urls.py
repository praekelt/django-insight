from django.conf.urls.defaults import patterns, url, include
from django.views.generic.simple import direct_to_template

from insight.views import set_origin_code


urlpatterns = patterns('',
    # tracking url
    url(
        r'^$',
        direct_to_template,
        {'template': 'registration/password_reset_subject.txt'},
        name='home'
    ),
    url(
        r'^stub/$',
        direct_to_template,
        {'template': 'registration/password_reset_subject.txt'},
        name='stub'
    ),
    url(
        r'^i/(?P<code>[\w]+)/$',
        set_origin_code,
        name='set-origin-code'
    ),
    url(r'', include('django.contrib.auth.urls')),
)
