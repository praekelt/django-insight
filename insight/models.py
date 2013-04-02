import uuid

from django.core.urlresolvers import reverse
from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.db import models, IntegrityError
from django.db.models import F


class OriginGroup(models.Model):
    title = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)

    def __unicode__(self):
        return self.title


class Origin(models.Model):
    title = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    code = models.CharField(db_index=True, unique=True, max_length=7, blank=True,
        help_text="The code that uniquely identifies this origin. Leave blank to have it automatically generated.")
    querystring_parameters = models.TextField(null=True, blank=True,
        help_text="A list of querystring parameters that need to be tracked, one per line.")
    track_registrations = models.BooleanField(default=True)
    number_of_registrations = models.IntegerField(editable=False, default=0)
    origin_group = models.ForeignKey(OriginGroup, null=True, blank=True)
    redirect_to = models.URLField(blank=True, null=True, help_text="The URL that this origin's URL will redirect to.")

    class Meta:
        ordering = ['title']

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self.generate_code()
        super(Origin, self).save(*args, **kwargs)

    def generate_code(self):
        while True:
            # we expect to have few origin objects, so this is ok
            cde = uuid.uuid4().hex[:7]
            if not Origin.objects.filter(code=cde).exists():
                return cde

    def __unicode__(self):
        return self.title

    def get_absolute_url(self):
        return reverse('set-origin-code', kwargs={'code': self.code})

    @property
    def parameter_list(self):
        if self.querystring_parameters:
            params = self.querystring_parameters.split("\n")
            return [p.strip() for p in params]
        return []

    @staticmethod
    def track(request, user):
        try:
            origin = Origin.objects.get(code=request.session['insight_code'])
            if origin.track_registrations:
                try:
                    Registration.objects.create(user=user, origin=origin)
                    origin.number_of_registrations = F('number_of_registrations') + 1
                    origin.save()
                    for param in origin.parameter_list:
                        insight_params = request.session['insight_params']
                        if param in insight_params:
                            num_updated = QuerystringParameter.objects.filter(identifier=param, value=insight_params[param],
                                origin=origin).update(number_of_registrations=F('number_of_registrations') + 1)
                            if num_updated == 0:
                                QuerystringParameter.objects.create(identifier=param, value=insight_params[param],
                                    origin=origin, number_of_registrations=1)
                except IntegrityError:
                    pass
        except (Origin.DoesNotExist, KeyError):
            pass


class QuerystringParameter(models.Model):
    identifier = models.CharField(max_length=32, db_index=True, editable=False)
    value = models.CharField(max_length=50, db_index=True, editable=False)
    origin = models.ForeignKey(Origin, editable=False)
    number_of_registrations = models.IntegerField(default=0, editable=False)

    class Meta:
        unique_together = (('identifier', 'value', 'origin'),)


class Registration(models.Model):
    user = models.ForeignKey(User, unique=True)
    origin = models.ForeignKey(Origin)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created']

    def __unicode__(self):
        return "%s: %s" % (self.origin.title, unicode(self.user))


@receiver(user_logged_in)
def record_registration(sender, **kwargs):
    request = kwargs['request']
    if 'insight_code' in request.session:
        Origin.track(request, kwargs['user'])
        del request.session['insight_code']
        del request.session['insight_params']
