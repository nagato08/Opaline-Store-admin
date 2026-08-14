'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

const control =
  'h-11 w-full rounded-control bg-surface px-3 text-sm text-ink-900 ring-1 ring-ink-200 ring-inset placeholder:text-ink-400 transition-colors duration-150 hover:ring-ink-300 disabled:opacity-60';

/**
 * Champ de formulaire.
 *
 * Le libellé est **toujours** visible et lié par `htmlFor` : un placeholder
 * qui tient lieu de libellé disparaît à la première frappe, et l'utilisateur
 * ne sait plus ce qu'il remplit à la relecture.
 *
 * L'erreur est rattachée par `aria-describedby` et annoncée : sans ce lien, un
 * lecteur d'écran lit le champ puis passe au suivant sans jamais dire
 * pourquoi il a été refusé.
 *
 * L'astérisque du champ obligatoire est doublée d'un `required` réel — la
 * décoration seule ne bloque rien, et le navigateur sait déjà signaler un
 * champ vide mieux que nous.
 */
export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: true;
    required?: boolean;
    className: string;
  }) => React.ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-aide` : undefined;
  const errorId = error ? `${id}-erreur` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-sm font-medium text-ink-800">
        {label}
        {required ? (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        ) : null}
      </label>

      <div className="mt-1.5">
        {children({
          id,
          'aria-describedby': describedBy,
          'aria-invalid': error ? true : undefined,
          required,
          className: cn(control, error && 'ring-danger hover:ring-danger'),
        })}
      </div>

      {hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-ink-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Zone de saisie longue, même habillage que les champs d'une ligne. */
export const textareaClass =
  'min-h-28 w-full rounded-control bg-surface px-3 py-2.5 text-sm text-ink-900 ring-1 ring-ink-200 ring-inset placeholder:text-ink-400 transition-colors duration-150 hover:ring-ink-300';

/**
 * État local des champs d'un formulaire à action serveur.
 *
 * React réinitialise le `<form>` natif dès qu'une action se termine — même
 * refusée, même sans redirection — en appelant `form.reset()` en dehors de
 * son propre rendu. Un champ **contrôlé** n'y survit pas non plus : React ne
 * réécrit la valeur d'un nœud DOM que lorsque la prop `value` change d'une
 * frappe à l'autre, et `form.reset()` la modifie sans que React s'en
 * aperçoive — la prop, elle, n'a pas bougé, donc React ne retouche rien au
 * rendu suivant, et le champ reste visuellement vide.
 *
 * La seule échappatoire est de **remonter** les champs après coup : `formKey`
 * change à chaque fin d'action (`resetSignal` change alors de référence), ce
 * qui force React à recréer les nœuds avec leur `defaultValue` à jour — celle
 * gardée dans `values`, jamais touchée par le `reset` puisqu'elle ne vit que
 * dans l'état React.
 */
export function useFieldValues(initial: Record<string, string> = {}, resetSignal?: unknown) {
  const [values, setValues] = useState(initial);
  const [formKey, setFormKey] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setFormKey((key) => key + 1);
  }, [resetSignal]);

  function field(name: string) {
    return {
      name,
      defaultValue: values[name] ?? '',
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setValues((current) => ({ ...current, [name]: event.target.value }));
      },
    };
  }

  return { values, field, formKey, setValues };
}
