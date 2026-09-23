'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export type PickedImage = { id: string; url: string; alt: string; file: File };

/**
 * Sélecteur de galerie produit.
 *
 * La première image est la couverture — c'est `ProductMedia.position: 0` côté
 * API, celle qui illustre les listes et le moteur de recherche. Faire glisser
 * les vignettes serait le geste naturel pour la choisir, mais un glisser-
 * déposer accessible au clavier est un composant en soi ; deux flèches par
 * ligne font le même travail sans en payer le coût.
 *
 * Le SVG est exclu du filtre : c'est la même règle que l'API, il peut
 * embarquer du JavaScript et une image de produit est servie depuis le domaine
 * de la boutique.
 *
 * **Les fichiers voyagent dans le formulaire, pas par un appel séparé.** Après
 * chaque ajout, retrait ou déplacement, la `FileList` de l'input natif est
 * réécrite via un `DataTransfer` : c'est le seul moyen de la modifier, elle
 * est en lecture seule. L'ordre des fichiers dans l'input devient alors
 * l'ordre de la galerie, et le `FormData` le conserve — d'où des champs de
 * texte alternatif émis dans le même ordre, que l'action serveur apparie par
 * index.
 *
 * L'alternative — téléverser depuis le navigateur dès le choix du fichier —
 * exigerait le jeton d'accès dans le JavaScript de la page. Il vit dans un
 * cookie `httpOnly` et doit y rester.
 */
export function ImagePicker({
  label,
  hint,
  error,
  name,
  images,
  onChange,
}: {
  label: string;
  hint?: string;
  /** Refus renvoyé par l'action serveur — type ou poids hors limites. */
  error?: string;
  /** Nom de l'input fichier ; les alternatives prennent `${name}Alt`. */
  name: string;
  images: PickedImage[];
  onChange: (images: PickedImage[]) => void;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [rejected, setRejected] = useState(0);

  /* La `FileList` d'un input est en lecture seule : seul un `DataTransfer`
     permet d'en fabriquer une nouvelle. Sans cette synchronisation, retirer ou
     déplacer une vignette ne changerait rien à ce qui part au serveur. */
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const transfer = new DataTransfer();
    for (const image of images) transfer.items.add(image.file);
    input.files = transfer.files;
  }, [images]);

  /* Les URL d'aperçu sont des références que le navigateur retient tant qu'on
     ne les libère pas. `remove` s'en charge au cas par cas ; restent celles
     encore affichées quand on quitte la page.

     La liste passe par une référence et non par les dépendances de l'effet :
     la fermeture de nettoyage capturerait sinon le tableau du rendu où
     l'effet a été posé, c'est-à-dire un tableau vide au montage. */
  const latest = useRef(images);

  useEffect(() => {
    latest.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      for (const image of latest.current) URL.revokeObjectURL(image.url);
    };
  }, []);

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
        file,
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

  function setAlt(imageId: string, alt: string) {
    onChange(images.map((image) => (image.id === imageId ? { ...image, alt } : image)));
  }

  return (
    <div className="sm:col-span-2">
      <span className="block text-sm font-medium text-ink-800">{label}</span>

      <div className="mt-1.5 space-y-3">
        {images.length > 0 ? (
          <ul className="space-y-2">
            {images.map((image, index) => (
              <li
                key={image.id}
                className="flex items-start gap-3 rounded-control bg-ink-50 p-2 ring-1 ring-ink-200 ring-inset"
              >
                <div className="relative shrink-0">
                  {/* `next/image` ne sait pas charger une URL `blob:` : l'aperçu
                      d'un fichier tout juste choisi n'a pas d'autre forme tant
                      qu'il n'est pas envoyé quelque part. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt=""
                    className="size-16 rounded-control object-cover ring-1 ring-ink-200 ring-inset"
                  />
                  {index === 0 ? (
                    <span className="absolute -top-1 -left-1 rounded-full bg-cobalt-500 px-1.5 py-0.5 text-[10px] leading-none font-medium text-white">
                      Couverture
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <label htmlFor={`${id}-alt-${index}`} className="block text-xs text-ink-600">
                    Description de l’image {index + 1}
                  </label>
                  <input
                    id={`${id}-alt-${index}`}
                    name={`${name}Alt`}
                    value={image.alt}
                    onChange={(event) => setAlt(image.id, event.target.value)}
                    placeholder="Canapé trois places en velours bleu, vu de trois quarts"
                    className="mt-1 h-9 w-full rounded-control bg-surface px-2.5 text-sm text-ink-900 ring-1 ring-ink-200 ring-inset placeholder:text-ink-400"
                  />
                  <p className="mt-1 text-xs text-ink-500">
                    Lue à voix haute aux clients non voyants, et affichée si l’image ne charge pas.
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Déplacer l’image ${index + 1} vers le haut`}
                    className="grid size-7 place-items-center rounded-control text-ink-500 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronUp aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === images.length - 1}
                    aria-label={`Déplacer l’image ${index + 1} vers le bas`}
                    className="grid size-7 place-items-center rounded-control text-ink-500 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronDown aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(image.id)}
                    aria-label={`Retirer l’image ${index + 1}`}
                    className="grid size-7 place-items-center rounded-control text-ink-500 hover:bg-danger-soft hover:text-danger"
                  >
                    <X aria-hidden className="size-4" />
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
          <span className="text-xs text-ink-500">JPEG, PNG, WEBP ou AVIF — 15 Mo par image</span>
        </button>

        {/* L'input n'est pas la source de vérité : `addFiles` verse la
            sélection dans l'état, et l'effet ci-dessus réécrit ensuite la
            `FileList` à partir de cet état. C'est cette réécriture qui rend
            l'ordre et les retraits effectifs au moment de l'envoi. */}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          onChange={(event) => addFiles(event.target.files)}
        />
      </div>

      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>
      ) : rejected > 0 ? (
        <p className="mt-1.5 text-xs font-medium text-danger">
          {rejected} fichier{rejected > 1 ? 's' : ''} ignoré{rejected > 1 ? 's' : ''} — seuls les
          formats JPEG, PNG, WEBP et AVIF sont acceptés (le SVG peut embarquer du code et n’est
          jamais autorisé).
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}
