import unittest

from django.test import TestCase
from django.conf import settings
from django.core.urlresolvers import reverse
try:
    from django.contrib.auth import get_user_model
except ImportError:  # django < 1.5
    from django.contrib.auth.models import User
else:
    User = get_user_model()

from insight.models import (Origin, Registration,
                            QuerystringParameter)


def create_origin(title='test_origin'):
    origin = Origin(title=title)
    origin.save()
    return origin


class CannotCreateCustomUser(unittest.SkipTest):
    pass


def create_user(username, password):
    try:
        return User.objects.create_user(
            username, 'user@host.com', password
        )
    except TypeError:
        # We cannot run this test if we don't know
        # how to create a user - too tricksy to
        # solve right now
        if settings.AUTH_USER_MODEL != 'auth.User':
            raise CannotCreateCustomUser
        raise


class AuthUserTestCase(TestCase):
    urls = 'insight.test.urls'

    def test_registration_is_recorded(self):
        origin = create_origin()
        self.client.get(origin.get_absolute_url())
        user = create_user('username', 'password')
        self.client.login(username='username', password='password')
        self.assertTrue(Registration.objects.filter(user=user).exists())

    def test_registration_not_recorded(self):
        origin = create_origin()
        origin.track_registrations = False
        origin.save()
        self.client.get(origin.get_absolute_url())
        user = create_user('username', 'password')
        self.client.login(username='username', password='password')
        self.assertFalse('insight_code' in self.client.session)
        self.assertFalse(Registration.objects.filter(user=user).exists())

    def test_querystringparams_are_recorded(self):
        origin = create_origin()
        origin.querystring_parameters = "pid\noid\ngid"
        origin.save()

        # test creation of querystring param objects
        self.client.cookies.clear()
        self.client.get(origin.get_absolute_url(),
                        data={'pid': 123, 'oid': 444, 'kid': '00'})
        create_user('username1', 'password')
        self.client.login(username='username1', password='password')
        self.assertEqual(QuerystringParameter.objects.get(origin=origin,
                                                          identifier='pid',
                                                          value=123)
                         .number_of_registrations, 1)
        self.assertEqual(QuerystringParameter.objects.get(origin=origin,
                                                          identifier='oid',
                                                          value=444)
                         .number_of_registrations, 1)
        self.assertFalse(QuerystringParameter.objects.filter(origin=origin,
                                                             identifier='kid')
                         .exists())
        self.assertFalse(QuerystringParameter.objects.filter(origin=origin,
                                                             identifier='gid')
                         .exists())

        # test updating of querystring param objects
        self.client.cookies.clear()
        self.client.get(origin.get_absolute_url(),
                        data={'pid': 123, 'gid': 444})
        create_user('username2', 'password')
        self.client.login(username='username2', password='password')
        self.assertEqual(QuerystringParameter.objects.get(origin=origin,
                                                          identifier='pid',
                                                          value='123')
                         .number_of_registrations, 2)
        self.assertEqual(QuerystringParameter.objects.get(origin=origin,
                                                          identifier='oid',
                                                          value='444')
                         .number_of_registrations, 1)
        self.assertFalse(QuerystringParameter.objects.filter(origin=origin,
                                                             identifier='kid')
                         .exists())
        self.assertEqual(QuerystringParameter.objects.get(origin=origin,
                                                          identifier='gid',
                                                          value=444)
                         .number_of_registrations, 1)

    def test_redirect(self):
        origin1 = create_origin()
        origin2 = create_origin()
        origin2.redirect_to = reverse("stub")
        origin2.save()
        response = self.client.get(origin1.get_absolute_url())
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response['Location'].split('/', 3)[-1], '')
        response = self.client.get(origin2.get_absolute_url())
        self.assertEqual(response.status_code, 302)
        self.assertEqual(response['Location'].split('/', 3)[-1],
                         reverse('stub').lstrip('/'))

    def test_origin_hit_signal(self):
        origin = create_origin()
        signal_dict = {
            'instance': None,
            'request': None,
            'signal_received': False
        }

        def signal_handler(sender, **kwargs):
            signal_dict['signal_received'] = True
            signal_dict['instance'] = kwargs['instance']
            signal_dict['request'] = kwargs['request']

        from insight.signals import origin_hit
        origin_hit.connect(signal_handler, sender=Origin)
        self.client.get(origin.get_absolute_url())

        self.assertTrue(signal_dict['signal_received'])
        self.assertEqual(origin, signal_dict['instance'])
        self.assertEqual(signal_dict['request'].path,
                         origin.get_absolute_url())
