from allauth.account.adapter import DefaultAccountAdapter

class CustomAccountAdapter(DefaultAccountAdapter):
    def send_mail(self, template_prefix, email, context):
        print("CustomAccountAdapter: Overriding domain for password reset email!")
        context['domain'] = 'localhost:5173'
        context['protocol'] = 'http'
        super().send_mail(template_prefix, email, context)
