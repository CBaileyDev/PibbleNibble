/**
 * pages/Settings.tsx
 *
 * User profile settings — display name, Minecraft username, and theme choice.
 */

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PageLayout } from '@/components/layout/PageLayout'
import { SectionCard } from '@/components/layout/SectionCard'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { useUpdateProfile } from '@/hooks/useUserProfile'
import { useUserStore } from '@/stores/userStore'
import { useAuth } from '@/features/auth/useAuth'

const schema = z.object({
  displayName:       z.string().min(1, 'Required.').max(40),
  minecraftUsername: z.string().max(16).optional(),
})

type FormValues = z.infer<typeof schema>

export function Settings() {
  const { user, theme, setTheme } = useUserStore()
  const { signOut } = useAuth()
  const { mutate: updateProfile, isPending } = useUpdateProfile()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName:       user?.profile.displayName ?? '',
      minecraftUsername: user?.profile.minecraftUsername ?? '',
    },
  })

  function onSubmit(values: FormValues) {
    updateProfile(values, {
      onSuccess: () => toast.success('Profile updated!'),
      onError:   () => toast.error('Failed to update profile.'),
    })
  }

  return (
    <PageLayout>
      <div className="max-w-lg mx-auto flex flex-col gap-5">
        <SectionCard title="Profile">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Display name"
              placeholder="Pibble"
              error={errors.displayName?.message}
              {...register('displayName')}
            />
            <Input
              label="Minecraft username"
              placeholder="Pibble123"
              helperText="Shown next to coordinate pins."
              error={errors.minecraftUsername?.message}
              {...register('minecraftUsername')}
            />
            <Button type="submit" isLoading={isPending} className="w-full">
              Save Changes
            </Button>
          </form>
        </SectionCard>

        <SectionCard title="Theme">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--text-muted)]">
              Choose your visual theme. Each player gets their own.
            </p>
            <Toggle
              checked={theme === 'blossom'}
              onChange={(checked) => {
                const next = checked ? 'blossom' : 'deepslate'
                setTheme(next)
                updateProfile({ theme: next })
              }}
              label={`Theme: ${theme === 'blossom' ? '🌸 Blossom' : '⛏️ Deepslate'}`}
            />
          </div>
        </SectionCard>

        <SectionCard title="Account">
          <Button variant="danger" onClick={() => void signOut()} className="w-full">
            Sign out
          </Button>
        </SectionCard>
      </div>
    </PageLayout>
  )
}
