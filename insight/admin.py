from django.contrib import admin
from django import forms
from django.contrib.auth.models import User

from insight.models import Origin, Registration


class OriginAdmin(admin.ModelAdmin):
    fields = ('title', 'description')
    list_display = ('title', 'description', 'url', 'number_of_registrations')

    def url(self, origin):
        return '<a href="%s">%s</a>' % (origin.url, origin.url)
    url.allow_tags = True


class RegistrationAdmin(admin.ModelAdmin):
    fk_name = 'origin'
    date_hierarchy = 'created'
    list_display = ('id', 'user_link', 'origin_link', 'created')
    actions = None  # cannot add, delete or change these records

    def __init__(self, *args, **kwargs):
        super(RegistrationAdmin, self).__init__(*args, **kwargs)
        self.list_display_links = (None, )

    def user_link(self, reg_obj):
        return '<a href="%s">%s</a>' % (
            '/admin/auth/user/' + str(reg_obj.user_id),
            reg_obj.user
        )
    user_link.allow_tags = True

    def origin_link(self, reg_obj):
        return '<a href="%s">%s</a>' % (
            '/admin/insight/origin/' + str(reg_obj.origin_id),
            reg_obj.origin
        )
    origin_link.allow_tags = True

    def has_add_permission(self, *args, **kwargs):
        return False

    def has_delete_permission(self, *args, **kwargs):
        return False


admin.site.register(Origin, OriginAdmin)
admin.site.register(Registration, RegistrationAdmin)
