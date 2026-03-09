import { PaymentService, PaymentCreateInput, PaymentResult, PaymentWebhookData } from './payment.service.interface';
import { StripeProvider } from './stripe.provider';
import { YooKassaProvider } from './yookassa.provider';
import { logger } from '@/core/logger';

export type PaymentProviderType = 'stripe' | 'yookassa' | 'paypal';

/**
 * Payment Gateway Service
 * Facade for managing multiple payment providers
 */
export class PaymentGatewayService {
  private providers: Map<PaymentProviderType, PaymentService>;
  private defaultProvider: PaymentProviderType;

  constructor() {
    this.providers = new Map();
    this.defaultProvider = 'stripe';

    // Register providers based on environment
    if (process.env.STRIPE_SECRET_KEY) {
      this.providers.set('stripe', new StripeProvider());
    }

    if (process.env.YOOKASSA_SHOP_ID) {
      this.providers.set('yookassa', new YooKassaProvider());
    }
  }

  /**
   * Get payment provider by type
   */
  getProvider(type: PaymentProviderType): PaymentService {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Payment provider ${type} is not configured`);
    }
    return provider;
  }

  /**
   * Get default provider
   */
  getDefaultProvider(): PaymentService {
    return this.getProvider(this.defaultProvider);
  }

  /**
   * Create payment using specified or default provider
   */
  async createPayment(
    input: PaymentCreateInput,
    providerType?: PaymentProviderType
  ): Promise<PaymentResult> {
    const provider = providerType
      ? this.getProvider(providerType)
      : this.getDefaultProvider();

    logger.info('Creating payment', {
      orderId: input.orderId,
      amount: input.amount,
      provider: providerType || this.defaultProvider,
    });

    return provider.createPayment(input);
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(
    paymentId: string,
    providerType: PaymentProviderType
  ): Promise<PaymentResult> {
    const provider = this.getProvider(providerType);
    return provider.getPaymentStatus(paymentId);
  }

  /**
   * Handle webhook from payment provider
   */
  async handleWebhook(
    data: unknown,
    providerType: PaymentProviderType
  ): Promise<PaymentWebhookData> {
    const provider = this.getProvider(providerType);
    return provider.handleWebhook(data);
  }

  /**
   * Cancel payment
   */
  async cancelPayment(
    paymentId: string,
    providerType: PaymentProviderType
  ): Promise<PaymentResult> {
    const provider = this.getProvider(providerType);
    return provider.cancelPayment(paymentId);
  }
}

// Singleton instance
export const paymentGateway = new PaymentGatewayService();
