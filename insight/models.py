import uuid

from django.db import models
from django.db.models import F


class Origin(models.Model):
    code = models.CharField(unique=True, max_length=7, editable=False)
    title = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    number_of_registrations = models.IntegerField(editable=False)
    
    def generate_code():
        while True:
            # we expect to have few origin objects, so this is ok
            cde = uuid.uuid4().hex[:7]
            if not Origin.objects.filter(code=cde).exists():
                return cde


class Registration(models.Model):
    user_id = models.IntegerField()
    origin = models.ForeignKey(Origin)
    created = models.DateTimeField(auto_now_add=True)
    
    def save(self):
        super(Registration, self).save()
        self.origin.number_of_registrations = F('number_of_registrations') + 1
        self.origin.save()
