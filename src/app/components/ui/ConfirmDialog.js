"use client";

import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

/**
 * In-app replacement for window.confirm. Render it with isOpen and handle the
 * answer in onConfirm (may be async: the button shows a spinner until it settles).
 */
export default function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    destructive = true,
    onConfirm,
    onCancel,
}) {
    const [isWorking, setIsWorking] = useState(false);

    const handleConfirm = async () => {
        setIsWorking(true);
        try {
            await onConfirm?.();
        } finally {
            setIsWorking(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={isWorking ? undefined : onCancel}
            title={title}
            size="sm"
            bodyClassName={description ? 'px-5 py-4' : 'hidden'}
            footer={
                <>
                    <Button onClick={onCancel} disabled={isWorking}>
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={destructive ? 'destructive' : 'primary'}
                        onClick={handleConfirm}
                        loading={isWorking}
                        autoFocus
                    >
                        {confirmLabel}
                    </Button>
                </>
            }
        >
            {description && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
            )}
        </Modal>
    );
}
