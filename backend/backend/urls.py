from django.urls import path
from appbackend import views,edituser,system
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('user/', views.checkService), # localhost:8000/user/ gehed views.checkService function duudna.
    path('useredit/', edituser.editcheckService),
    path('system/', system.systemcheckService), # localhost:8000/useredit/ gehed edituser.editcheckService function duudna.
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)