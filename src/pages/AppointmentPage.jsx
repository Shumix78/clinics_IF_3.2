import { useEffect, useRef, useState } from 'react';
import PageHeading from '../components/ui/PageHeading.jsx';
import Section from '../components/ui/Section.jsx';
import AppButton from '../components/ui/AppButton.jsx';
import ClinicStatusBadge from '../components/clinics/ClinicStatusBadge.jsx';
import AppointmentForm from '../components/appointments/AppointmentForm.jsx';
import AppointmentSummary from '../components/appointments/AppointmentSummary.jsx';
import { validateAppointment } from '../domain/appointmentValidation.js';

const emptyDraft = { purpose: '', durationHours: '1', hasDeclaration: false };

export default function AppointmentPage({
    title,
    item,
    initialDraft = emptyDraft,
    onSave,
    onCancel,
    submitLabel,
    cancelLabel = 'Вийти без збереження',
}) {
    const initialValues = {
        purpose: initialDraft.purpose ?? '',
        durationHours: String(initialDraft.durationHours ?? '1'),
        hasDeclaration: Boolean(initialDraft.hasDeclaration),
    };

    const [draft, setDraft] = useState(() => ({ ...initialValues }));
    const [touched, setTouched] = useState({});
    const [attempted, setAttempted] = useState(false);
    const [operationError, setOperationError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitting = useRef(false);
    const alive = useRef(false);

    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);

    const validation = validateAppointment({ ...draft, clinicId: item.id }, [item]);
    const errors = Object.fromEntries(
        Object.entries(validation.errors).filter(([field]) => attempted || touched[field])
    );

    const isDirty =
        draft.purpose !== initialValues.purpose ||
        draft.durationHours !== initialValues.durationHours ||
        draft.hasDeclaration !== initialValues.hasDeclaration;

    function handleChange(field, value) {
        setDraft((prev) => ({ ...prev, [field]: value }));
        setOperationError('');
    }

    function handleBlur(field) {
        setTouched((prev) => ({ ...prev, [field]: true }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (submitting.current) return;

        setAttempted(true);
        setOperationError('');

        if (!validation.ok) {
            const firstField = ['purpose', 'durationHours', 'hasDeclaration'].find(
                (f) => validation.errors[f]
            );
            if (firstField) {
                event.currentTarget.elements.namedItem(firstField)?.focus();
            }
            return;
        }

        submitting.current = true;
        setIsSubmitting(true);
        try {
            const result = await onSave(validation.value);
            if (!result.ok && alive.current) {
                setOperationError(
                    result.errors
                        ? Object.values(result.errors).join(' ')
                        : result.message || 'Не вдалося зберегти запис.'
                );
            }
        } catch {
            if (alive.current) setOperationError('Не вдалося завершити збереження.');
        } finally {
            submitting.current = false;
            if (alive.current) setIsSubmitting(false);
        }
    }

    function handleReset() {
        if (submitting.current) return;
        if (!isDirty || window.confirm('Відкинути зміни та відновити початкові поля?')) {
            setDraft({ ...initialValues });
            setTouched({});
            setAttempted(false);
            setOperationError('');
        }
    }

    function handleCancel() {
        if (submitting.current) return;
        if (!isDirty || window.confirm('Вийти та відкинути незбережені зміни?')) {
            onCancel();
        }
    }

    return (
        <>
            <PageHeading title={title} />
            <Section id="appointment-editor" title="Поля та підсумок">
                <p>Обрано заклад «{item.name}» <ClinicStatusBadge isOpenToday={item.isOpenToday} /></p>

                <AppointmentForm
                    idPrefix="appointment-draft"
                    clinicName={item.name}
                    draft={draft}
                    errors={errors}
                    operationError={operationError}
                    isSubmitting={isSubmitting}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onSubmit={handleSubmit}
                    onReset={handleReset}
                    submitLabel={submitLabel}
                />

                <AppointmentSummary clinicName={item.name} draft={draft} />
            </Section>

            <AppButton variant="secondary" disabled={isSubmitting} onClick={handleCancel}>
                {cancelLabel}
            </AppButton>
        </>
    );
}