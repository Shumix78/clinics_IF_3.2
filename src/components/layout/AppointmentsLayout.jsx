import { NavLink, Outlet } from 'react-router-dom';
import AppointmentNotice from '../appointments/AppointmentNotice.jsx';
import AppointmentsGate from '../appointments/AppointmentsGate.jsx';

export default function AppointmentsLayout() {
    return (
        <>
            <nav aria-label="Навігація розділом записів">
                <ul className="nav-list">
                    <li><NavLink to="." end className="nav-link">Список записів</NavLink></li>
                    <li><NavLink to="new" className="nav-link">Новий запис</NavLink></li>
                </ul>
            </nav>
            <p className="field-hint">Дані зберігаються локально в браузері (localStorage) або на зовнішньому АРІ.</p>
            <AppointmentNotice />
            <AppointmentsGate>
                <Outlet />
            </AppointmentsGate>
        </>
    );
}