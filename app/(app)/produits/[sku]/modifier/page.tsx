import { notFound, redirect } from 'next/navigation';
import { getProductBySku } from '@/lib/data/products';
import { getSession } from '@/lib/current-session';
import { EditForm } from './edit-form';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/produits/[sku]/modifier'>) {
  const { sku } = await params;
  const session = await getSession();
  const product = session ? await getProductBySku(session, decodeURIComponent(sku)) : null;
  return { title: `Modifier ${product?.name ?? 'produit'} — Comptoir` };
}

export default async function EditProductPage({ params }: PageProps<'/produits/[sku]/modifier'>) {
  const session = await getSession();
  if (!session) redirect('/connexion');

  const { sku } = await params;
  const product = await getProductBySku(session, decodeURIComponent(sku));

  if (!product) notFound();

  return <EditForm product={product} />;
}
