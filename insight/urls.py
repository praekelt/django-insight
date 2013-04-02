from django.conf.urls.defaults import patterns, url

from insight.views import set_origin_code


urlpatterns = patterns('',
    # tracking url
    url(
        r'^i/(?P<code>[\w]+)/$',
        set_origin_code,
        name='set-origin-code'
    ),
)
