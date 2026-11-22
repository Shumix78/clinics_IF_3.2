import { mockAppointmentService } from './mockAppointmentService.js';
import { createApiAppointmentService } from './apiAppointmentService.js';

const source = process.env.REACT_APP_DATA_SOURCE ?? 'mock';

function selectService() {
    if (source === 'mock') return mockAppointmentService;
    if (source === 'api') {
        return createApiAppointmentService(process.env.REACT_APP_API_BASE_URL);
    }
    throw new Error(`Unsupported data source: ${source}`);
}

export const appointmentService = selectService();