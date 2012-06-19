import os.path

from django.test import TestCase
from django.test.client import Client
from django.contrib.auth.models import User
from django.core.files import File as DjangoFile
from django.core.urlresolvers import reverse
from django.conf import settings
from django.contrib.sites.models import Site

from insight.models import Origin, Registration

class InsightTestCase(TestCase):

    def setUp(self):
        self.username = 'username'
        self.password = 'password'
        self.user = User.objects.create_user(
            self.username, 'user@host.com', self.password
        )
        self.client = Client()

    def create_origin(self):
        origin = Origin(title='test_origin')
        origin.save()
        return origin

    def test_cookie_is_set(self):
        origin = self.create_origin()
        self.client.get(origin.url)
        self.assertTrue(self.client.cookies.has_key("insight_code"))
        