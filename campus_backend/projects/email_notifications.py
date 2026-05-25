from django.core.mail import send_mail, EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth.models import User
from .models import Club, Membership, PaymentTransaction
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class EmailNotificationService:
    """Service for sending email notifications"""
    
    def __init__(self):
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@campusconnect.com')
    
    def send_membership_application_confirmation(self, membership: Membership) -> bool:
        """Send confirmation email to user after membership application"""
        try:
            subject = f"Membership Application Received - {membership.club.name}"
            
            context = {
                'user_name': membership.user.get_full_name() or membership.user.username,
                'club_name': membership.club.name,
                'club_type': membership.club.type,
                'application_date': membership.joined_at.strftime('%B %d, %Y'),
                'status': membership.status,
                'frontend_url': settings.FRONTEND_URL
            }
            
            # HTML email content
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #1e3d58; color: white; padding: 20px; text-align: center;">
                        <h1>Campus Connect</h1>
                        <h2>Membership Application Received</h2>
                    </div>
                    
                    <div style="padding: 30px; background: #f9f9f9;">
                        <h3>Hello {context['user_name']},</h3>
                        
                        <p>Thank you for your interest in joining <strong>{context['club_name']}</strong>!</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h4>Application Details:</h4>
                            <ul>
                                <li><strong>Club:</strong> {context['club_name']} ({context['club_type'].title()})</li>
                                <li><strong>Application Date:</strong> {context['application_date']}</li>
                                <li><strong>Status:</strong> {context['status'].title()}</li>
                            </ul>
                        </div>
                        
                        <p>Your membership application has been submitted successfully and is currently under review by the club administrators.</p>
                        
                        <p>You will receive another email once your application has been reviewed.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{context['frontend_url']}/clubs" style="background: #1e3d58; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View Clubs</a>
                        </div>
                        
                        <p>Best regards,<br>Campus Connect Team</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Plain text version
            plain_content = f"""
Hello {context['user_name']},

Thank you for your interest in joining {context['club_name']}!

Application Details:
- Club: {context['club_name']} ({context['club_type'].title()})
- Application Date: {context['application_date']}
- Status: {context['status'].title()}

Your membership application has been submitted successfully and is currently under review by the club administrators.

You will receive another email once your application has been reviewed.

Best regards,
Campus Connect Team
            """
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=plain_content,
                from_email=self.from_email,
                to=[membership.user.email]
            )
            email.attach_alternative(html_content, "text/html")
            email.send()
            
            logger.info(f"Membership confirmation email sent to {membership.user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send membership confirmation email: {str(e)}")
            return False
    
    def send_membership_status_update(self, membership: Membership) -> bool:
        """Send email when membership status is updated"""
        try:
            status_messages = {
                'approved': 'has been approved! Welcome to the club!',
                'rejected': 'has been rejected. Please contact the club administrators for more information.',
                'active': 'is now active. You are now a full member!',
                'inactive': 'has been set to inactive.'
            }
            
            message = status_messages.get(membership.status, 'has been updated.')
            subject = f"Membership Status Update - {membership.club.name}"
            
            context = {
                'user_name': membership.user.get_full_name() or membership.user.username,
                'club_name': membership.club.name,
                'status': membership.status,
                'message': message,
                'approved_date': membership.approved_at.strftime('%B %d, %Y') if membership.approved_at else '',
                'frontend_url': settings.FRONTEND_URL
            }
            
            # HTML email content
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #1e3d58; color: white; padding: 20px; text-align: center;">
                        <h1>Campus Connect</h1>
                        <h2>Membership Status Update</h2>
                    </div>
                    
                    <div style="padding: 30px; background: #f9f9f9;">
                        <h3>Hello {context['user_name']},</h3>
                        
                        <p>Your membership application for <strong>{context['club_name']}</strong> {context['message']}</p>
                        
                        <div style="background: {'#d4edda' if membership.status == 'approved' else '#f8d7da'}; 
                             padding: 20px; border-radius: 8px; margin: 20px 0; 
                             border-left: 4px solid {'#28a745' if membership.status == 'approved' else '#dc3545'};">
                            <h4>Status: {context['status'].title()}</h4>
                            {f"<p><strong>Approved Date:</strong> {context['approved_date']}</p>" if context['approved_date'] else ""}
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{context['frontend_url']}/clubs" style="background: #1e3d58; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View Clubs</a>
                        </div>
                        
                        <p>Best regards,<br>Campus Connect Team</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            plain_content = f"""
Hello {context['user_name']},

Your membership application for {context['club_name']} {context['message']}

Status: {context['status'].title()}
{f"Approved Date: {context['approved_date']}" if context['approved_date'] else ""}

Best regards,
Campus Connect Team
            """
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=plain_content,
                from_email=self.from_email,
                to=[membership.user.email]
            )
            email.attach_alternative(html_content, "text/html")
            email.send()
            
            logger.info(f"Membership status update email sent to {membership.user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send membership status update email: {str(e)}")
            return False
    
    def send_payment_confirmation(self, payment: PaymentTransaction) -> bool:
        """Send payment confirmation email"""
        try:
            subject = f"Payment Confirmation - {payment.membership.club.name}"
            
            context = {
                'user_name': payment.membership.user.get_full_name() or payment.membership.user.username,
                'club_name': payment.membership.club.name,
                'amount': payment.amount,
                'payment_method': payment.payment_method.upper(),
                'transaction_id': payment.transaction_id,
                'payment_date': payment.created_at.strftime('%B %d, %Y at %I:%M %p'),
                'status': payment.status,
                'frontend_url': settings.FRONTEND_URL
            }
            
            # HTML email content
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #28a745; color: white; padding: 20px; text-align: center;">
                        <h1>Campus Connect</h1>
                        <h2>Payment Confirmation</h2>
                    </div>
                    
                    <div style="padding: 30px; background: #f9f9f9;">
                        <h3>Hello {context['user_name']},</h3>
                        
                        <p>Your payment for <strong>{context['club_name']}</strong> membership has been processed successfully!</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h4>Payment Details:</h4>
                            <ul>
                                <li><strong>Club:</strong> {context['club_name']}</li>
                                <li><strong>Amount:</strong> ৳{context['amount']}</li>
                                <li><strong>Payment Method:</strong> {context['payment_method']}</li>
                                <li><strong>Transaction ID:</strong> {context['transaction_id']}</li>
                                <li><strong>Date:</strong> {context['payment_date']}</li>
                                <li><strong>Status:</strong> {context['status'].title()}</li>
                            </ul>
                        </div>
                        
                        <div style="background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                            <p><strong>What's Next?</strong></p>
                            <p>Your membership application is now under review. You will receive another email once it has been approved by the club administrators.</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{context['frontend_url']}/clubs" style="background: #1e3d58; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View Clubs</a>
                        </div>
                        
                        <p>Keep this email as a receipt for your records.</p>
                        
                        <p>Best regards,<br>Campus Connect Team</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            plain_content = f"""
Hello {context['user_name']},

Your payment for {context['club_name']} membership has been processed successfully!

Payment Details:
- Club: {context['club_name']}
- Amount: ৳{context['amount']}
- Payment Method: {context['payment_method']}
- Transaction ID: {context['transaction_id']}
- Date: {context['payment_date']}
- Status: {context['status'].title()}

What's Next?
Your membership application is now under review. You will receive another email once it has been approved by the club administrators.

Keep this email as a receipt for your records.

Best regards,
Campus Connect Team
            """
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=plain_content,
                from_email=self.from_email,
                to=[payment.membership.user.email]
            )
            email.attach_alternative(html_content, "text/html")
            email.send()
            
            logger.info(f"Payment confirmation email sent to {payment.membership.user.email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send payment confirmation email: {str(e)}")
            return False
    
    def send_club_admin_notification(self, membership: Membership) -> bool:
        """Send notification to club admin about new membership application"""
        try:
            # Get club admin (assuming club has an admin field)
            admin_email = None
            if membership.club.admin:
                admin_email = membership.club.admin.email
            elif hasattr(settings, 'CLUB_ADMIN_EMAIL'):
                admin_email = settings.CLUB_ADMIN_EMAIL
            
            if not admin_email:
                logger.warning(f"No admin email found for club {membership.club.name}")
                return False
            
            subject = f"New Membership Application - {membership.club.name}"
            
            context = {
                'admin_name': membership.club.admin.get_full_name() if membership.club.admin else 'Admin',
                'club_name': membership.club.name,
                'applicant_name': membership.user.get_full_name() or membership.user.username,
                'applicant_email': membership.user.email,
                'application_date': membership.joined_at.strftime('%B %d, %Y'),
                'motivation': membership.motivation,
                'frontend_url': settings.FRONTEND_URL
            }
            
            # HTML email content
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: #1e3d58; color: white; padding: 20px; text-align: center;">
                        <h1>Campus Connect</h1>
                        <h2>New Membership Application</h2>
                    </div>
                    
                    <div style="padding: 30px; background: #f9f9f9;">
                        <h3>Hello {context['admin_name']},</h3>
                        
                        <p>A new membership application has been submitted for <strong>{context['club_name']}</strong>.</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h4>Applicant Details:</h4>
                            <ul>
                                <li><strong>Name:</strong> {context['applicant_name']}</li>
                                <li><strong>Email:</strong> {context['applicant_email']}</li>
                                <li><strong>Application Date:</strong> {context['application_date']}</li>
                            </ul>
                            
                            {f"<h4>Motivation:</h4><p style='background: #f8f9fa; padding: 15px; border-radius: 5px; font-style: italic;'>{context['motivation']}</p>" if context['motivation'] else ""}
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                            <p><strong>Action Required:</strong></p>
                            <p>Please review this application and update the membership status accordingly.</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{context['frontend_url']}/admin/clubs" style="background: #1e3d58; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Review Application</a>
                        </div>
                        
                        <p>Best regards,<br>Campus Connect System</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            plain_content = f"""
Hello {context['admin_name']},

A new membership application has been submitted for {context['club_name']}.

Applicant Details:
- Name: {context['applicant_name']}
- Email: {context['applicant_email']}
- Application Date: {context['application_date']}

{f"Motivation: {context['motivation']}" if context['motivation'] else ""}

Action Required:
Please review this application and update the membership status accordingly.

Best regards,
Campus Connect System
            """
            
            email = EmailMultiAlternatives(
                subject=subject,
                body=plain_content,
                from_email=self.from_email,
                to=[admin_email]
            )
            email.attach_alternative(html_content, "text/html")
            email.send()
            
            logger.info(f"Club admin notification email sent to {admin_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send club admin notification email: {str(e)}")
            return False

# Create a global instance for easy access
email_service = EmailNotificationService()
