import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.sites.models import Site
from allauth.socialaccount.models import SocialApp

def seed_social_app():
    # 1. Update Site
    site, created = Site.objects.get_or_create(id=1, defaults={'domain': 'localhost:5000', 'name': 'Localhost'})
    if not created:
        site.domain = 'localhost:5000'
        site.name = 'Localhost'
        site.save()
    print(f"Site configured: {site.domain}")

    # 2. Add Social App
    # Check if app already exists
    app, created = SocialApp.objects.get_or_create(
        provider='google',
        defaults={
            'name': 'Google Login',
            'client_id': '703335616589-p16fkbldg9jpq04gs71cq2iqfh2la16b.apps.googleusercontent.com',
            'secret': os.getenv('GOOGLE_CLIENT_SECRET'),
        }
    )
    
    if created:
        app.sites.add(site)
        print("SocialApp 'google' created and linked to Site.")
    else:
        app.client_id = '703335616589-p16fkbldg9jpq04gs71cq2iqfh2la16b.apps.googleusercontent.com'
        app.secret = os.getenv('GOOGLE_CLIENT_SECRET')
        app.save()
        print("Updated existing SocialApp client_id and secret.")

if __name__ == '__main__':
    seed_social_app()
