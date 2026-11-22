import useAppointments from '../../hooks/useAppointments.js';

export default function AppointmentsGate({ children }) {
    const { status, error, reload } = useAppointments();

    if (status === 'loading') {
        return (
            <section aria-busy="true" aria-label="Записи на прийом">
                <p role="status">Завантаження записів...</p>
            </section>
        );
    }

    if (status === 'error') {
        return (
            <section aria-label="Помилка завантаження">
                <p role="alert">{error}</p>
                <button type="button" onClick={() => void reload()}>
                    Спробувати ще раз
                </button>
            </section>
        );
    }

    return children;
}