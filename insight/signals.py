from django.dispatch import Signal


# allow other apps to track hits for this url
origin_hit = Signal(providing_args=['instance', 'request'])
