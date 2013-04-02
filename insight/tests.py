from django.test import TestCase
from django.test.client import Client
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse

from insight.models import Origin, Registration, QuerystringParameter


class InsightTestCase(TestCase):
    urls = 'insight.test_urls'

    def setUp(self):
        self.username = 'username'
        self.password = 'password'
        self.client = Client()

    def create_origin(self):
        origin = Origin(title='test_origin')
        origin.save()
        return origin

    def test_registration_is_recorded(self):
        origin = self.create_origin()
        self.client.get("/%s" % origin.get_absolute_url().split("/", 1)[1])
        self.user = User.objects.create_user(
            self.username, 'user@host.com', self.password
        )
        self.client.login(username=self.username, password=self.password)
        self.assertTrue(Registration.objects.filter(user=self.user).exists())

    def test_querystringparams_are_recorded(self):
        origin = self.create_origin()
        origin.querystring_parameters = "pid\noid\ngid"
        origin.save()

        # test creation of querystring param objects
        self.client.cookies.clear()
        self.client.get("/%s" % origin.get_absolute_url().split("/", 1)[1], data={'pid': 123, 'oid': 444, 'kid': '00'})
        self.user = User.objects.create_user(
            'username1', 'user1@host.com', self.password
        )
        self.client.login(username='username1', password=self.password)
        self.assertTrue(QuerystringParameter.objects.get(origin=origin, identifier='pid',
            value=123).number_of_registrations==1)
        self.assertTrue(QuerystringParameter.objects.get(origin=origin, identifier='oid',
            value=444).number_of_registrations==1)
        self.assertFalse(QuerystringParameter.objects.filter(origin=origin, identifier='kid').exists())
        self.assertFalse(QuerystringParameter.objects.filter(origin=origin, identifier='gid').exists())

        # test updating of querystring param objects
        self.client.cookies.clear()
        self.client.get("/%s" % origin.get_absolute_url().split("/", 1)[1], data={'pid': 123, 'gid': 444})
        self.user = User.objects.create_user(
            'username2', 'user2@host.com', self.password
        )
        self.client.login(username='username2', password=self.password)
        self.assertTrue(QuerystringParameter.objects.get(origin=origin, identifier='pid',
            value='123').number_of_registrations==2)
        self.assertTrue(QuerystringParameter.objects.get(origin=origin, identifier='oid',
            value='444').number_of_registrations==1)
        self.assertFalse(QuerystringParameter.objects.filter(origin=origin, identifier='kid').exists())
        self.assertTrue(QuerystringParameter.objects.get(origin=origin, identifier='gid',
            value=444).number_of_registrations==1)

    def test_redirect(self):
        origin1 = self.create_origin()
        origin2 = self.create_origin()
        origin2.redirect_to = reverse("login")
        origin2.save()
        r = self.client.get("/%s" % origin1.get_absolute_url().split("/", 1)[1])
        self.assertEqual("/%s" % r['Location'].split('/', 3)[3], '/')
        r = self.client.get("/%s" % origin2.get_absolute_url().split("/", 1)[1])
        self.assertEqual("/%s" % r['Location'].split('/', 3)[3], reverse("login"))
