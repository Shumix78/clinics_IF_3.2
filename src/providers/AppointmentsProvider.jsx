import { useCallback, useEffect, useRef, useState } from 'react';
import { AppointmentsContext } from '../context/AppointmentsContext.js';
import { appointmentService } from '../services/appointmentService.js';
import { errorMessage } from '../services/ServiceError.js';

export default function AppointmentsProvider({ children }) {
    const [appointments, setAppointments] = useState([]);
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [isMutating, setIsMutating] = useState(false);

    const activeRead = useRef(null);
    const readVersion = useRef(0);
    const mutationLock = useRef(false);
    const mounted = useRef(false);

    const reload = useCallback(async () => {
        if (mutationLock.current) return;
        activeRead.current?.abort();
        const controller = new AbortController();
        activeRead.current = controller;
        const version = ++readVersion.current;

        setStatus('loading');
        setError('');
        try {
            const records = await appointmentService.getAll({ signal: controller.signal });
            if (controller.signal.aborted || version !== readVersion.current) return;
            setAppointments(records);
            setStatus('success');
        } catch (cause) {
            if (controller.signal.aborted || version !== readVersion.current) return;
            setError(errorMessage(cause));
            setStatus('error');
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        reload();
        return () => {
            mounted.current = false;
            activeRead.current?.abort();
            readVersion.current += 1;
        };
    }, [reload]);

    async function mutate(operation, apply, message) {
        if (mutationLock.current || status !== 'success') {
            return { ok: false, message: 'Дочекайтеся завершення поточної операції.' };
        }

        mutationLock.current = true;
        setIsMutating(true);
        setNotice('');
        activeRead.current?.abort();
        readVersion.current += 1;

        try {
            const record = await operation();
            if (mounted.current) {
                setAppointments((previous) => apply(previous, record));
                setNotice(message);
            }
            return { ok: true, record };
        } catch (cause) {
            return {
                ok: false,
                message: errorMessage(cause),
                errors: cause.errors,
                code: cause.code,
            };
        } finally {
            mutationLock.current = false;
            if (mounted.current) setIsMutating(false);
        }
    }

    function createAppointment(input) {
        return mutate(
            () => appointmentService.create(input),
            (previous, record) => [...previous.filter((e) => e.id !== record.id), record],
            'Запис створено.'
        );
    }

    function updateAppointment(id, input) {
        return mutate(
            () => appointmentService.update(id, input),
            (previous, record) => previous.map((e) => (e.id === id ? record : e)),
            'Зміни запису збережено.'
        );
    }

    function deleteAppointment(id) {
        return mutate(
            () => appointmentService.delete(id),
            (previous) => previous.filter((e) => e.id !== id),
            'Запис видалено.'
        );
    }

    return (
        <AppointmentsContext.Provider
            value={{
                appointments,
                status,
                error,
                reload,
                isMutating,
                createAppointment,
                updateAppointment,
                deleteAppointment,
                notice,
                dismissNotice: () => setNotice(''),
            }}
        >
            {children}
        </AppointmentsContext.Provider>
    );
}