from django.db import models
from django.contrib.auth.models import User

class UsageTrack(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True, unique=True)
    email_count = models.IntegerField(default=0)
    message_count = models.IntegerField(default=0)
    last_reset = models.DateTimeField(auto_now=True)

    def __str__(self):
        label = self.user.email if self.user else self.ip_address
        return f"{label} - E:{self.email_count} M:{self.message_count}"
