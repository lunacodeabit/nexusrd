// Calendar utilities for Google Calendar and iCal integration

export interface CalendarEvent {
    title: string;
    description?: string;
    location?: string;
    startDate: Date;
    endDate: Date;
}

/**
 * Generate a Google Calendar URL for adding an event
 * User clicks this link and it opens Google Calendar with pre-filled event
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
    const formatDate = (date: Date): string => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${formatDate(event.startDate)}/${formatDate(event.endDate)}`,
        details: event.description || '',
        location: event.location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate iCal file content (.ics)
 * Compatible with Apple Calendar, Outlook, and other calendar apps
 */
export function generateICalContent(event: CalendarEvent): string {
    const formatDate = (date: Date): string => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const escapeText = (text: string): string => {
        return text.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n');
    };

    const uid = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}@alvearecrm.netlify.app`;

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//ALVEARE CRM//Voice Assistant//ES',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART:${formatDate(event.startDate)}`,
        `DTEND:${formatDate(event.endDate)}`,
        `SUMMARY:${escapeText(event.title)}`,
        event.description ? `DESCRIPTION:${escapeText(event.description)}` : '',
        event.location ? `LOCATION:${escapeText(event.location)}` : '',
        'END:VEVENT',
        'END:VCALENDAR',
    ].filter(line => line !== '').join('\r\n');

    return icsContent;
}

/**
 * Create and download an iCal file
 */
export function downloadICalFile(event: CalendarEvent, filename?: string): void {
    const icsContent = generateICalContent(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename || `cita_${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(link.href);
}

/**
 * Create CalendarEvent from voice assistant parsed command
 */
export function createEventFromTask(
    leadName: string,
    date: string,
    time: string,
    appointmentType?: 'virtual' | 'in_person' | null,
    notes?: string | null
): CalendarEvent {
    // Parse date and time
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration

    const typeLabel = appointmentType === 'virtual' ? '🖥️ Virtual' :
        appointmentType === 'in_person' ? '🏠 Presencial' : '';

    return {
        title: `Cita con ${leadName}`,
        description: [
            `Cita ${typeLabel}`,
            notes || '',
            '',
            'Creado desde ALVEARE CRM'
        ].filter(l => l).join('\n'),
        startDate,
        endDate,
    };
}
