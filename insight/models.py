import uuid

from django.core.urlresolvers import reverse
from django.contrib.auth.signals import user_logged_in
from django.contrib.sites.models import Site
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.db import models, IntegrityError
from django.db.models import F


class Origin(models.Model):
    title = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    code = models.CharField(unique=True, max_length=7, blank=True)
    number_of_registrations = models.IntegerField(editable=False, default=0)

    class Meta:
        ordering = ['title']

    def __init__(self, *args, **kwargs):
        super(Origin, self).__init__(*args, **kwargs)
        if not self.code:
            self.code = self.generate_code()

    def generate_code(self):
        while True:
            # we expect to have few origin objects, so this is ok
            cde = uuid.uuid4().hex[:7]
            if not Origin.objects.filter(code=cde).exists():
                return cde

    def __unicode__(self):
        return self.title

    def get_absolute_url(self):
        return "%s%s" % (Site.objects.get_current().domain, \
            reverse('set-origin-code', kwargs={'code': self.code}))


class Registration(models.Model):
    user = models.ForeignKey(User, editable=False, unique=True)
    origin = models.ForeignKey(Origin, editable=False)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created']

    def save(self, *args, **kwargs):
        if not self.pk:
            self.origin.number_of_registrations = F('number_of_registrations') + 1
            self.origin.save()
        super(Registration, self).save(*args, **kwargs)

    def __unicode__(self):
        return str(self.id)


@receiver(user_logged_in)
def record_registration(sender, **kwargs):
    request = kwargs['request']
    if 'insight_code' in request.session:
        try:
            registration = Registration(
                user=kwargs['user'],
                origin=Origin.objects.get(
                    code=request.session['insight_code']
                )
            )
            registration.save()
        except IntegrityError:
            pass
        del request.session['insight_code']
