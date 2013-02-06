from django.contrib import admin
from django import forms
from django.contrib.auth.models import User

from insight.models import Origin, OriginGroup, QuerystringParameter


class OriginAdmin(admin.ModelAdmin):
    list_display = ('title', 'description', 'origin_group', 'url', 'number_of_registrations')

    def url(self, origin):
        url = origin.get_absolute_url()
        return '<a href="%s">%s</a>' % (url, url)
    url.allow_tags = True


class QuerystringParameterAdmin(admin.ModelAdmin):
    list_display = ('origin', 'identifier', 'value', 'number_of_registrations')
    
    def has_add_permission(self, *args, **kwargs):
        return False

    def has_delete_permission(self, *args, **kwargs):
        return False


admin.site.register(Origin, OriginAdmin)
admin.site.register(QuerystringParameter, QuerystringParameterAdmin)
admin.site.register(OriginGroup)
