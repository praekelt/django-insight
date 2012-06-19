import os.path

from django.test import TestCase
from django.test.client import Client
from django.contrib.auth.models import User
from django.core.files import File as DjangoFile
from django.core.urlresolvers import reverse
from django.conf import settings
from django.contrib.sites.models import Site


class InsightTestCase(TestCase):

    def setUp(self):
        self.username = 'username'
        self.password = 'password'
        self.user = User.objects.create_user(
            self.username, 'user@host.com', self.password
        )
        self.client = Client()
        self.client.login(username=self.username, password=self.password)