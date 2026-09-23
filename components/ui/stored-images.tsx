'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type { ProductImage } from '@/lib/data/products';

/**
 * Photos déjà enregistrées d'un produit.
 *
 * Pendant de `ImagePicker`, qui ne traite que des fichiers pas encore envoyés.
 * Ici rien ne se téléverse : on réordonne et on retire des identifiants de
 * médias existants, transportés par des champs cachés dans l'ordre affiché.
 *
 * Retirer une photo ne la **supprime pas** de la médiathèque : elle quitte
 * seulement la galerie du produit. C'est délibéré — le même visuel peut
 * illustrer plusieurs fiches, et une suppression réelle les casserait toutes.
 */
export function StoredImages({
  name,
  images,
  onChange,
}: {
  /** Nom des champs cachés portant les identifiants conservés. */
  name: string;
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}) {
  const [removed, setRemoved] = useState(0);

  function remove(id: string) {
    setRemoved((count) => count + 1);
    onChange(images.filter((image) => image.id !== id));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;

    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  if (images.length === 0) {
    return removed > 0 ? (
      <p aria-live="polite" className="text-xs text-ink-500">
        Toutes les photos ont été retirées de la fiche. Elles restent dans la médiathèque et
        l’enregistrement laissera le produit sans visuel.
      </p>
    ) : null;
  }

  return (
    <div>
      <span className="block text-sm font-medium text-ink-800">Photos actuelles</span>

      <ul className="mt-1.5 flex flex-wrap gap-2">
        {images.map((image, index) => (
          <li key={image.id} className="relative">
            <input type="hidden" name={name} value={image.id} />

            {/* Cohérent avec le reste du back-office, qui n'utilise `next/image`
                nulle part : le domaine des médias change encore. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt=""
              className="size-20 rounded-control object-cover ring-1 ring-ink-200 ring-inset"
            />

            {index === 0 ? (
              <span className="absolute -top-1 -left-1 rounded-full bg-cobalt-500 px-1.5 py-0.5 text-[10px] leading-none font-medium text-white">
                Couverture
              </span>
            ) : null}

            <div className="mt-1 flex justify-center gap-0.5">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Avancer la photo ${index + 1}`}
                className="grid size-6 place-items-center rounded-control text-ink-500 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronUp aria-hidden className="size-3.5 -rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === images.length - 1}
                aria-label={`Reculer la photo ${index + 1}`}
                className="grid size-6 place-items-center rounded-control text-ink-500 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronDown aria-hidden className="size-3.5 -rotate-90" />
              </button>
              <button
                type="button"
                onClick={() => remove(image.id)}
                aria-label={`Retirer la photo ${index + 1} de la fiche`}
                className="grid size-6 place-items-center rounded-control text-ink-500 hover:bg-danger-soft hover:text-danger"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-1.5 text-xs text-ink-500">
        La première illustre le catalogue et la recherche. Retirer une photo la sort de la fiche,
        pas de la médiathèque.
      </p>
    </div>
  );
}
