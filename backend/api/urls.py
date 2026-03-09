from django.urls import path
from . import views

urlpatterns = [
    path('generate/', views.generate_content, name='generate_content'),
    path('export_csv/', views.export_csv, name='export_csv'),
    path('usage/', views.get_usage, name='get_usage'),
    path('auth/google/', views.GoogleLogin.as_view(), name='google_login'),
    path('auth/register/', views.EmailRegister.as_view(), name='email_register'),
    path('auth/login/', views.EmailLogin.as_view(), name='email_login'),
]
