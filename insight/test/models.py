try:
    from django.contrib.auth.models import AbstractUser, UserManager

    class CustomUser(AbstractUser):
        objects = UserManager()

except ImportError:  # django < 1.5
    from django.contrib.auth.models import User as CustomUser
