'use client';

import { useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type PickedImage = { id: string; url: string; alt: string };

/**
 * Sélecteur de galerie produit.
 *
 * La première image est la couverture — c'est `ProductMedia.position: 0` côté
 * API, celle qui illustre les listes et le moteur de recherche. Faire glisser
 * les vignettes serait le geste naturel pour la choisir, mais un glisser-
 * déposer accessible au clavier est un composant en soi ; deux flèches par
 * vignette font le même travail sans en payer le coût.
 *
 * Le SVG est exclu du filtre : c'est la même règle que le reste de l'API,
 * il peut embarquer du JavaScript et une image de produit est servie
 * directement depuis le domaine de la boutique.
 *
 * Rien n'est envoyé nulle part : la route d'upload existe côté API
 * (`POST /admin/media`) mais n'est pas encore branchée sur ce formulaire.
 * Les fichiers restent en mémoire, prévisualisés via des URL locales.
 */
export function ImagePicker({
  label,
  hint,
  images,
  onChange,
}: {
  label: string;
  hint?: string;
  images: PickedImage[];
  onChange: (images: PickedImage[]) => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [rejected, setRejected] = useState(0);

  function addFiles(files: FileList | null) {
    if (!files) return;

    const accepted: PickedImage[] = [];
    let refused = 0;

    for (const file of files) {
      if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
        refused += 1;
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        url: URL.createObjectURL(file),
        alt: '',
      });
    }

    setRejected(refused);
    if (accepted.length > 0) onChange([...images, ...accepted]);
  }

  function remove(imageId: string) {
    const target = images.find((image) => image.id === imageId);
    if (target) URL.revokeObjectURL(target.url);
    onChange(images.filter((image) => image.id !== imageId));
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;

    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="sm:col-span-2">
      <label htmlFor={id} className="block text-sm font-medium text-ink-800">
        {label}
      </label>

      <div className="mt-1.5 space-y-3">
        {images.length > 0 ? (
          <ul className="flex flex-wrap gap-3">
            {images.map((image, index) => (
              <li key={image.id} className="group relative size-24 shrink-0">
                {/* `next/image` ne sait pas charger une URL `blob:` : l'aperçu
                    d'un fichier tout juste choisi n'a pas d'autre forme tant
                    qu'il n'est pas envoyé quelque part. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt || 'Aperçu du produit'}
                  className="size-24 rounded-control object-cover ring-1 ring-ink-200 ring-inset"
                />

                {index === 0 ? (
                  <span className="absolute top-1 left-1 rounded-full bg-cobalt-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Couverture
                  </span>
                ) : null}

                <button
                  type="button"
                  onClick={() => remove(image.id)}
                  aria-label={`Retirer l’image ${index + 1}`}
                  className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-ink-900/70 text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  <X aria-hidden className="size-3" />
                </button>

                <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Déplacer l’image ${index + 1} vers la gauche`}
                    className="grid size-5 place-items-center rounded-full bg-ink-900/70 text-white disabled:pointer-events-none disabled:opacity-0"
                  >
                    <ChevronLeft aria-hidden className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1}
                    aria-label={`Déplacer l’image ${index + 1} vers la droite`}
                    className="grid size-5 place-items-center rounded-full bg-ink-900/70 text-white disabled:pointer-events-none disabled:opacity-0"
                  >
                    <ChevronRight aria-hidden className="size-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            addFiles(event.dataTransfer.files);
          }}
          className={cn(
            'flex w-full flex-col items-center gap-1.5 rounded-control border border-dashed px-4 py-6 text-sm transition-colors duration-150',
            dragOver ? 'border-cobalt-400 bg-cobalt-50' : 'border-ink-300 hover:border-ink-400 hover:bg-ink-50',
          )}
        >
          <ImagePlus aria-hidden className="size-5 text-ink-400" />
          <span className="text-ink-700">
            <span className="font-medium text-cobalt-600">Choisir des images</span> ou déposer ici
          </span>
          <span className="text-xs text-ink-500">JPEG, PNG ou WEBP</span>
        </button>

        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          onChange={(event) => {
            addFiles(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {rejected > 0 ? (
        <p className="mt-1.5 text-xs font-medium text-danger">
          {rejected} fichier{rejected > 1 ? 's' : ''} ignoré{rejected > 1 ? 's' : ''} — seuls les
          formats JPEG, PNG et WEBP sont acceptés (le SVG peut embarquer du code et n’est jamais
          autorisé).
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}
