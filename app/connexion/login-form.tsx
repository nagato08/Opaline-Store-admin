'use client';

import { useActionState } from 'react';
import { Field, useFieldValues } from '@/components/ui/field';
import { FormNotice } from '@/components/ui/form-notice';
import { SubmitButton } from '@/components/ui/submit-button';
import { IDLE } from '@/lib/form';
import { signIn } from './actions';

export function LoginForm({ suite }: { suite: string }) {
  const [state, action] = useActionState(signIn, IDLE);
  const { field, formKey } = useFieldValues({}, state);

  return (
    <form key={formKey} action={action} className="mt-6 space-y-4" noValidate>
      {/* La destination voyage dans le formulaire plutôt que dans l'action :
          une redirection après connexion doit survivre au rechargement de la
          page de connexion. */}
      <input type="hidden" name="suite" value={suite} />

      <Field label="Adresse courriel" required error={state.errors?.email}>
        {(props) => (
          <input
            {...props}
            {...field('email')}
            type="email"
            autoComplete="username"
            autoFocus
            placeholder="vous@exemple.fr"
          />
        )}
      </Field>

      <Field label="Mot de passe" required error={state.errors?.password}>
        {(props) => (
          <input
            {...props}
            name="password"
            type="password"
            autoComplete="current-password"
          />
        )}
      </Field>

      <FormNotice state={state} />

      <SubmitButton variant="primary" className="w-full">
        Se connecter
      </SubmitButton>
    </form>
  );
}
