import { clinics } from '../data/clinics.js';
import { validateAppointment } from '../domain/appointmentValidation.js';
import { ServiceError } from './ServiceError.js';

export function toAppointmentInput(input) {
    const result = validateAppointment(input, clinics);
    if (!result.ok) {
        throw new ServiceError('Перевірте поля запису.', {
            errors: result.errors,
            code: 'VALIDATION',
        });
    }
    return result.value;
}

export function toAppointment(value) {
    const valid =
        value !== null &&
        typeof value === 'object' &&
        typeof value.id === 'string' &&
        value.id.length > 0 &&
        typeof value.clinicId === 'string' &&
        typeof value.purpose === 'string' &&
        Number.isInteger(value.durationHours) &&
        typeof value.hasDeclaration === 'boolean';

    if (!valid) {
        throw new ServiceError('Джерело повернуло некоректний запис.', {
            code: 'BAD_DATA',
        });
    }

    return {
        id: value.id,
        clinicId: value.clinicId,
        purpose: value.purpose,
        durationHours: value.durationHours,
        hasDeclaration: value.hasDeclaration,
    };
}

export function toAppointmentList(value) {
    if (!Array.isArray(value)) {
        throw new ServiceError('Джерело повернуло некоректний список.', {
            code: 'BAD_DATA',
        });
    }
    const records = value.map(toAppointment);
    if (new Set(records.map((r) => r.id)).size !== records.length) {
        throw new ServiceError('Джерело повернуло повторні ідентифікатори.', {
            code: 'BAD_DATA',
        });
    }
    return records;
}