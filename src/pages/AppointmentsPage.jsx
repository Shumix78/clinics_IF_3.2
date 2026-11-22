import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeading from '../components/ui/PageHeading.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import AppButton from '../components/ui/AppButton.jsx';
import AppointmentFilters from '../components/appointments/AppointmentFilters.jsx';
import AppointmentTable from '../components/appointments/AppointmentTable.jsx';
import useAppointments from '../hooks/useAppointments.js';
import useAppointmentFilters from '../hooks/useAppointmentFilters.js';
import useDeleteAppointment from '../hooks/useDeleteAppointment.js';
import { clinics as defaultClinics } from '../data/clinics.js';

export default function AppointmentsPage({ items }) {
    const clinicsList = items && items.length > 0 ? items : defaultClinics;
    const { appointments = [], reload, isMutating } = useAppointments();
    const filters = useAppointmentFilters(appointments, clinicsList);
    const deleteWithConfirmation = useDeleteAppointment(clinicsList);
    const [error, setError] = useState('');

    const pageAlive = useRef(false);
    useEffect(() => {
        pageAlive.current = true;
        return () => {
            pageAlive.current = false;
        };
    }, []);

    async function handleDelete(appointment) {
        if (isMutating) return;
        setError('');
        const result = await deleteWithConfirmation(appointment);
        if (pageAlive.current && !result.ok && !result.cancelled) {
            setError(result.message);
        }
    }

    return (
        <>
            <PageHeading title="Записи на прийом" />
            <p>
                <Link to="/appointments/new">Створити новий запис</Link>{' '}
                <button type="button" disabled={isMutating} onClick={() => void reload()}>
                    Оновити дані
                </button>
            </p>

            <AppointmentFilters
                query={filters.query}
                decl={filters.decl}
                sort={filters.sort}
                onQueryChange={filters.setQuery}
                onDeclChange={filters.setDecl}
                onSortChange={filters.setSort}
                onReset={filters.resetFilters}
            />

            <p role="status">
                Показано: {filters.visibleAppointments.length} із {appointments.length}
                {isMutating ? ' (Опрацювання зміни...)' : ''}
            </p>

            {error && <p role="alert" className="field-error">{error}</p>}

            {appointments.length === 0 ? (
                <EmptyState title="Записів ще немає.">
                    <p><Link to="/clinics">Виберіть поліклініку в каталозі для першого запису</Link></p>
                </EmptyState>
            ) : filters.visibleAppointments.length === 0 ? (
                <EmptyState title="За цими умовами нічого не знайдено.">
                    <AppButton variant="secondary" onClick={filters.resetFilters}>
                        Показати всі записи
                    </AppButton>
                </EmptyState>
            ) : (
                <AppointmentTable
                    appointments={filters.visibleAppointments}
                    items={clinicsList}
                    isMutating={isMutating}
                    onDelete={handleDelete}
                />
            )}
        </>
    );
}