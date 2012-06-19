import random


def generate():
    objects = []
    for i in range(1, 6):
        objects.append({
            "model": "insight.Origin",
            "fields": {
                "title": "origin_%s" % i,
                "description": "description_%s" % i,
            },
        })
    for i in range(1, 101):
        objects.append({
            "model": "auth.User",
            "fields": {
                "username": "user_%s" % i,
                "password": "password",
            },
        })
        objects.append({
            "model": "insight.Registration",
            "fields": {
                "user": {
                    "model": "auth.User",
                    "fields": {"username": "user_%s" % i}
                },
                "origin": {
                    "model": "insight.Origin",
                    "fields": {"title": "origin_%s" % random.randint(1, 5)}
                }
            },
        })
    return objects
