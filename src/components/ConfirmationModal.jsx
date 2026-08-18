import { Modal, Btn } from './ui.jsx'

// ── ConfirmationModal ─────────────────────────────────────────────────────────
// Generic confirm/cancel dialog built on top of the shared Modal + Btn.
export function ConfirmationModal({
  title,
  message,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
  onConfirm,
  onClose,
}) {
  const content = message ?? children

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" size="sm" disabled={loading} onClick={onClose}>{cancelText}</Btn>
          <Btn variant={confirmVariant} size="sm" loading={loading} onClick={onConfirm}>{confirmText}</Btn>
        </>
      }
    >
      {typeof content === 'string'
        ? <p style={{ fontSize: 14, lineHeight: 1.7 }}>{content}</p>
        : content}
    </Modal>
  )
}
