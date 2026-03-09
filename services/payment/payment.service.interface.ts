export interface PaymentCreateInput {
  orderId: string;
  amount: number;
  currency: string;
  description?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentResult {
  paymentId: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  confirmationUrl?: string;
}

export interface PaymentWebhookData {
  paymentId: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  metadata?: Record<string, unknown>;
}

export interface PaymentService {
  createPayment(input: PaymentCreateInput): Promise<PaymentResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentResult>;
  handleWebhook(data: unknown): Promise<PaymentWebhookData>;
  cancelPayment(paymentId: string): Promise<PaymentResult>;
}
