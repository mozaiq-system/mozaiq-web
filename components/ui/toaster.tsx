'use client'

import { useToast } from '@/hooks/use-toast'
import { useIsMobile } from '@/components/ui/use-mobile'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

export function Toaster() {
  const { toasts } = useToast()
  const isMobile = useIsMobile()
  const duration = isMobile ? 2500 : 4000

  return (
    <ToastProvider duration={duration}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport className="pointer-events-none fixed inset-x-0 bottom-3 z-[100] flex max-h-screen flex-col items-center gap-1 px-4 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:items-end" />
    </ToastProvider>
  )
}
