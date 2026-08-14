import { customers, products } from '@/lib/demo';
import { OrderForm } from './order-form';

export const metadata = { title: 'Nouvelle commande — Comptoir' };

export default function NewOrderPage() {
  return (
    <OrderForm
      customers={customers().map((customer) => ({ name: customer.name, email: customer.email }))}
      products={products().map((product) => ({ name: product.name, sku: product.sku }))}
    />
  );
}
