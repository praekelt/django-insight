from django.conf.urls.defaults import patterns, url, include

from insight.views import set_origin_code


urlpatterns = patterns('',
    # tracking url
    url(
        r'^i/(?P<code>[\w]+)/$',
        set_origin_code,
        name='set-origin-code'
    ),
    url(r'', include('django.contrib.auth.urls')),
)
