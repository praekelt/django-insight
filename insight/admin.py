from django.contrib import admin
from django.contrib.sites.models import Site

from insight.models import Origin, OriginGroup, QuerystringParameter


class OriginAdmin(admin.ModelAdmin):
    list_display = ('title', 'description', 'origin_group', 'url', 'number_of_registrations')

    def url(self, origin):
        url = "%s%s" % (Site.objects.get_current().domain, origin.get_absolute_url())
        return '<a href="//%s">%s</a>' % (url, url)
    url.allow_tags = True


class QuerystringParameterAdmin(admin.ModelAdmin):
    list_display = ('origin', 'identifier', 'value', 'number_of_registrations')


admin.site.register(Origin, OriginAdmin)
admin.site.register(QuerystringParameter, QuerystringParameterAdmin)
admin.site.register(OriginGroup)
