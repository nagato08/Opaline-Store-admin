import { notFound } from 'next/navigation';
import { productBySku } from '@/lib/demo';
import { EditForm } from './edit-form';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/produits/[sku]/modifier'>) {
  const { sku } = await params;
  const product = productBySku(decodeURIComponent(sku));
  return { title: `Modifier ${product?.name ?? 'produit'} — Comptoir` };
}

export default async function EditProductPage({ params }: PageProps<'/produits/[sku]/modifier'>) {
  const { sku } = await params;
  const product = productBySku(decodeURIComponent(sku));

  if (!product) notFound();

  return <EditForm product={product} />;
}
