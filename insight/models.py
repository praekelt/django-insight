import uuid

from django.contrib.auth.models import User
from django.db import models
from django.db.models import F


class Origin(models.Model):
    title = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    code = models.CharField(unique=True, max_length=7, editable=False)
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

    @property
    def url(self):
        return '/i/%s/' % self.code


class Registration(models.Model):
    user = models.ForeignKey(User, editable=False)
    origin = models.ForeignKey(Origin, editable=False)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created']

    def save(self, *args, **kwargs):
        super(Registration, self).save(*args, **kwargs)
        self.origin.number_of_registrations = F('number_of_registrations') + 1
        self.origin.save()

    def __unicode__(self):
        return str(self.id)
