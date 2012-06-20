from django.conf.urls.defaults import patterns, url

from insight.views import set_origin_code


urlpatterns = patterns('',
    # tracking url
    url(
        r'^(?P<prefix>[a-z])/(?P<code>[\w]+)/$',
        set_origin_code,
        name='set-origin-code'
    ),
)
