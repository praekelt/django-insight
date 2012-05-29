from django.contrib import admin
from django import forms

from insight.models import Origin


class OriginAdmin(admin.ModelAdmin):
    fields = ('title', 'description')
    list_display = ('title', 'description', 'url', 'number_of_registrations')

    def url(self, origin):
      return '<a href="%s">%s</a>' % (origin.url, origin.url)
    url.allow_tags = True


admin.site.register(Origin, OriginAdmin)