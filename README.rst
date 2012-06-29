Django Insight User Guide
=========================

Insight keeps track of how users get to your site. It allows you to create an origin with an associated URL. If a user browses to this URL, 
they are redirected to the main site and their origin is stored when they register. You can browse to Insight on Django's admin interface to
see stats like registration growth per origin and the percentage of users coming from a specific origin.

How to use
----------

1. Add `insight` to INSTALLED_APPS.
2. Run `manage.py migrate insight` (requires South).
3. Create as many origins as you need via the Django admin interface (URLs are automatically generated).
4. Use the URLs on other websites to direct people to your site.

Requirements
------------

- Django 1.3 and above
- The following Django modules:
    - `django.contrib.auth`
    - `django.contrib.contenttypes`
    - `django.contrib.sessions`
- The following Django middlewares:
    - `django.contrib.auth.middleware.AuthenticationMiddleware`
    - `django.contrib.sessions.middleware.SessionMiddleware`
- South
- .. _django-generate: https://github.com/praekelt/django-generate (optional - used to generate test data)
