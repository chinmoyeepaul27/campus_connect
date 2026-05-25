import requests
import json
import uuid
from decimal import Decimal
from django.conf import settings
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class PaymentGatewayError(Exception):
    """Custom exception for payment gateway errors"""
    pass

class BasePaymentGateway:
    """Base class for payment gateway implementations"""
    
    def __init__(self):
        self.gateway_name = ""
    
    def process_payment(self, amount: Decimal, phone: str, reference: str) -> Dict[str, Any]:
        """Process payment and return transaction details"""
        raise NotImplementedError
    
    def verify_payment(self, transaction_id: str) -> Dict[str, Any]:
        """Verify payment status"""
        raise NotImplementedError

class BkashGateway(BasePaymentGateway):
    """bKash payment gateway integration"""
    
    def __init__(self):
        super().__init__()
        self.gateway_name = "bKash"
        self.base_url = getattr(settings, 'BKASH_BASE_URL', 'https://tokenized.sandbox.bka.sh/v1.2.0-beta')
        self.app_key = getattr(settings, 'BKASH_APP_KEY', '')
        self.app_secret = getattr(settings, 'BKASH_APP_SECRET', '')
        self.username = getattr(settings, 'BKASH_USERNAME', '')
        self.password = getattr(settings, 'BKASH_PASSWORD', '')
        self.access_token = None
    
    def get_access_token(self) -> str:
        """Get access token from bKash"""
        try:
            url = f"{self.base_url}/tokenized/checkout/token/grant"
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'username': self.username,
                'password': self.password
            }
            payload = {
                'app_key': self.app_key,
                'app_secret': self.app_secret
            }
            
            response = requests.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                self.access_token = data.get('id_token')
                return self.access_token
            else:
                raise PaymentGatewayError(f"Failed to get bKash token: {response.text}")
                
        except Exception as e:
            logger.error(f"bKash token error: {str(e)}")
            raise PaymentGatewayError(f"bKash authentication failed: {str(e)}")
    
    def process_payment(self, amount: Decimal, phone: str, reference: str) -> Dict[str, Any]:
        """Process bKash payment"""
        try:
            if not self.access_token:
                self.get_access_token()
            
            transaction_id = f"TXN_{uuid.uuid4().hex[:12].upper()}"
            
            # For sandbox/development, simulate successful payment
            if getattr(settings, 'PAYMENT_SIMULATION_MODE', True):
                return {
                    'success': True,
                    'transaction_id': transaction_id,
                    'payment_id': f"BKASH_{uuid.uuid4().hex[:8].upper()}",
                    'status': 'Completed',
                    'amount': str(amount),
                    'currency': 'BDT',
                    'customer_msisdn': phone,
                    'merchant_invoice_number': reference,
                    'gateway_response': {
                        'statusCode': '0000',
                        'statusMessage': 'Successful',
                        'paymentID': f"BKASH_{uuid.uuid4().hex[:8].upper()}",
                        'paymentCreateTime': '2025-01-15T10:30:00',
                        'transactionStatus': 'Completed',
                        'amount': str(amount),
                        'currency': 'BDT'
                    }
                }
            
            # Real bKash API integration (for production)
            url = f"{self.base_url}/tokenized/checkout/create"
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'authorization': self.access_token,
                'x-app-key': self.app_key
            }
            
            payload = {
                'mode': '0011',
                'payerReference': phone,
                'callbackURL': f"{settings.FRONTEND_URL}/payment-callback",
                'amount': str(amount),
                'currency': 'BDT',
                'intent': 'sale',
                'merchantInvoiceNumber': reference
            }
            
            response = requests.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'transaction_id': transaction_id,
                    'payment_id': data.get('paymentID'),
                    'bkash_url': data.get('bkashURL'),
                    'gateway_response': data
                }
            else:
                raise PaymentGatewayError(f"bKash payment failed: {response.text}")
                
        except Exception as e:
            logger.error(f"bKash payment error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'transaction_id': f"FAILED_{uuid.uuid4().hex[:8]}"
            }

class NagadGateway(BasePaymentGateway):
    """Nagad payment gateway integration"""
    
    def __init__(self):
        super().__init__()
        self.gateway_name = "Nagad"
        self.base_url = getattr(settings, 'NAGAD_BASE_URL', 'https://api.mynagad.com')
        self.merchant_id = getattr(settings, 'NAGAD_MERCHANT_ID', '')
        self.merchant_key = getattr(settings, 'NAGAD_MERCHANT_KEY', '')
    
    def process_payment(self, amount: Decimal, phone: str, reference: str) -> Dict[str, Any]:
        """Process Nagad payment"""
        try:
            transaction_id = f"NGD_{uuid.uuid4().hex[:12].upper()}"
            
            # For sandbox/development, simulate successful payment
            if getattr(settings, 'PAYMENT_SIMULATION_MODE', True):
                return {
                    'success': True,
                    'transaction_id': transaction_id,
                    'payment_id': f"NAGAD_{uuid.uuid4().hex[:8].upper()}",
                    'status': 'Success',
                    'amount': str(amount),
                    'currency': 'BDT',
                    'customer_mobile': phone,
                    'merchant_order_id': reference,
                    'gateway_response': {
                        'status': 'Success',
                        'payment_ref_id': f"NAGAD_{uuid.uuid4().hex[:8].upper()}",
                        'amount': str(amount),
                        'currency': 'BDT',
                        'message': 'Payment completed successfully'
                    }
                }
            
            # Real Nagad API integration would go here
            # This is a placeholder for actual implementation
            
        except Exception as e:
            logger.error(f"Nagad payment error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'transaction_id': f"FAILED_{uuid.uuid4().hex[:8]}"
            }

class RocketGateway(BasePaymentGateway):
    """Rocket payment gateway integration"""
    
    def __init__(self):
        super().__init__()
        self.gateway_name = "Rocket"
        self.base_url = getattr(settings, 'ROCKET_BASE_URL', 'https://api.rocket.com.bd')
        self.merchant_id = getattr(settings, 'ROCKET_MERCHANT_ID', '')
        self.secret_key = getattr(settings, 'ROCKET_SECRET_KEY', '')
    
    def process_payment(self, amount: Decimal, phone: str, reference: str) -> Dict[str, Any]:
        """Process Rocket payment"""
        try:
            transaction_id = f"RKT_{uuid.uuid4().hex[:12].upper()}"
            
            # For sandbox/development, simulate successful payment
            if getattr(settings, 'PAYMENT_SIMULATION_MODE', True):
                return {
                    'success': True,
                    'transaction_id': transaction_id,
                    'payment_id': f"ROCKET_{uuid.uuid4().hex[:8].upper()}",
                    'status': 'COMPLETED',
                    'amount': str(amount),
                    'currency': 'BDT',
                    'customer_number': phone,
                    'order_id': reference,
                    'gateway_response': {
                        'result_code': '200',
                        'result_description': 'Transaction successful',
                        'transaction_id': f"ROCKET_{uuid.uuid4().hex[:8].upper()}",
                        'amount': str(amount),
                        'currency': 'BDT'
                    }
                }
            
            # Real Rocket API integration would go here
            # This is a placeholder for actual implementation
            
        except Exception as e:
            logger.error(f"Rocket payment error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'transaction_id': f"FAILED_{uuid.uuid4().hex[:8]}"
            }

class PaymentGatewayFactory:
    """Factory class to get payment gateway instances"""
    
    @staticmethod
    def get_gateway(payment_method: str) -> BasePaymentGateway:
        """Get payment gateway instance based on payment method"""
        gateways = {
            'bkash': BkashGateway,
            'nagad': NagadGateway,
            'rocket': RocketGateway
        }
        
        gateway_class = gateways.get(payment_method.lower())
        if not gateway_class:
            raise PaymentGatewayError(f"Unsupported payment method: {payment_method}")
        
        return gateway_class()

def process_payment(payment_method: str, amount: Decimal, phone: str, reference: str) -> Dict[str, Any]:
    """Process payment using the specified gateway"""
    try:
        gateway = PaymentGatewayFactory.get_gateway(payment_method)
        return gateway.process_payment(amount, phone, reference)
    except Exception as e:
        logger.error(f"Payment processing error: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'transaction_id': f"FAILED_{uuid.uuid4().hex[:8]}"
        }
