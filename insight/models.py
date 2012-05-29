from django.db import models
from django.db.models import F


class Origin(models.Model):
    code = models.CharField(unique=True, max_length=20)
    title = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    number_of_registrations = models.IntegerField()


class Registration(models.Model):
    user_id = models.IntegerField()
    origin = models.ForeignKey(Origin)
    created = models.DateTimeField(auto_now_add=True)
    
    def save(self):
        super(Registration, self).save()
        self.origin.number_of_registrations = F('number_of_registrations') + 1
        self.origin.save()